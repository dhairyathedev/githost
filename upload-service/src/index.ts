import express from 'express';
import simpleGit from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { buildRepo, uploadDirectoryToS3 } from './lib/helpers';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import { Readable } from 'stream';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.get('/env', (req, res) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: 'hidden', // Don't expose the key
    PORT: process.env.PORT,
  });
});

app.post('/upload', async (req, res) => {
  const { title,repoUrl } = req.body;
  const id = uuidv4();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const logStream = new Readable({
    read() {}
  });

  logStream.on('data', (chunk) => {
    res.write(`data: ${chunk.toString()}\n\n`);
  });

  try {
    // Insert initial status into Supabase
    await supabase.from('upload_statuses').insert([
      { id,title, repo_url: repoUrl, status: 'cloning', progress: 0 }
    ]);

    const repoPath = path.join(__dirname, `../output/${id}`);
    logStream.push('Cloning repository...\n');
    await simpleGit().clone(repoUrl, repoPath);

    // Update status to 'uploading'
    await supabase.from('upload_statuses').update({
      status: 'uploading'
    }).eq('id', id);

    logStream.push('Building repository...\n');
    const buildDir = await buildRepo(repoPath);

    if (buildDir) {
      logStream.push('Uploading built files to S3...\n');
      await uploadDirectoryToS3(buildDir, "source", `builds/${id}`);
    } else {
      logStream.push('Uploading source files to S3...\n');
      await uploadDirectoryToS3(repoPath, "source", `builds/${id}`);
    }

    // Update status to 'completed'
    await supabase.from('upload_statuses').update({
      status: 'completed',
      progress: 100
    }).eq('id', id);
    logStream.push(`ID: ${id}\n`);
    logStream.push(`Upload complete\n`);
    logStream.push(null);  // Close the stream

    res.end();  // Close the SSE connection after completion
  } catch (error: any) {
    console.error('Error during upload:', error);
    logStream.push(`Error: ${error.message}\n`);
    logStream.push(null);  // Close the stream
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Status check endpoint
app.get('/status/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('upload_statuses').select('*').eq('id', id).single();

  if (error) {
    return res.status(404).json({ error: 'ID not found' });
  }

  res.json(data);
});

// In-memory store for active log streams
const activeLogStreams: { [key: string]: Readable } = {};

console.log(`Server is running on port ${port}`);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
