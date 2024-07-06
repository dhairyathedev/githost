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
import rimraf from 'rimraf'; // Add rimraf to delete directories

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
  const { id, title, repoUrl } = req.body;

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
    await supabase.from('upload_statuses').insert([
      { id, title, repo_url: repoUrl, status: 'cloning', progress: 0 }
    ]);

    const repoPath = path.join(__dirname, `../output/${id}`);
    
    
    logStream.push('Cloning repository...\n');
    await simpleGit().clone(repoUrl, repoPath);

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

    await supabase.from('upload_statuses').update({
      status: 'completed',
      progress: 100
    }).eq('id', id);

    logStream.push(`ID: ${id}\n`);
    logStream.push(`Upload complete\n`);
    logStream.push(null);

    res.end();
  } catch (error: any) {
    console.error('Error during upload:', error);
    logStream.push(`Error: ${error.message}\n`);
    logStream.push(null);
    res.end(); // Ensure response is ended before sending error response

    // Use setImmediate to avoid 'Cannot set headers after they are sent to the client'
    setImmediate(() => {
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }
});

app.get('/status/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('upload_statuses').select('*').eq('id', id).single();

    if (error) {
      return res.status(404).json({ error: 'ID not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use((err: any, req: any, res:any, next:any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// In-memory store for active log streams
const activeLogStreams: { [key: string]: Readable } = {};

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});