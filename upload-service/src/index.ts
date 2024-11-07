// index.ts
import express from 'express';
import simpleGit from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { addToBuildQueue, getBuildStatus } from './lib/buildQueue';  // Updated import
import fs from 'fs';

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

// Route for checking the build status
app.get('/status/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const statusData = await getBuildStatus(id);  // Use the function to get the status

    if (!statusData) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json({
      id: statusData.id,
      state: statusData.state,
      progress: statusData.progress,
      queuePosition: statusData.queuePosition,
      jobsAhead: statusData.jobsAhead,
      totalQueuedJobs: statusData.totalQueuedJobs,
      status: statusData.status,
      logs: statusData.logs
    });
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    res.status(500).json({ error: 'Failed to fetch deployment status' });
  }
});

app.get('/test-connection', async (req, res) => {
  try {
    const { data, error } = await supabase.from('upload_statuses').select('*').limit(1);
    if (error) throw error;
    res.json({ message: 'Connected to the database', data });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to connect to the database', error: error.message });
  }
});

app.get('/status/:id/live', async (req, res) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial status
  const sendStatus = async () => {
    const status = await getBuildStatus(id);
    if (status) {
      res.write(`data: ${JSON.stringify(status)}\n\n`);
    }
  };

  // Send initial status
  await sendStatus();

  // Set up interval to send updates
  const intervalId = setInterval(sendStatus, 1000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

app.post('/upload', async (req, res) => {
  console.log('Received upload request:', req.body);
  const { id, title, repoUrl, envVariables } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const logStream = new Readable({
    read() { }
  });

  logStream.on('data', (chunk) => {
    res.write(`data: ${chunk.toString()}\n\n`);
  });

  const repoPath = path.join(__dirname, `../output/${id}`);

  try {
    await supabase.from('upload_statuses').insert([
      { id, title, repo_url: repoUrl, status: 'cloning', progress: 0 }
    ]);

    logStream.push('Cloning repository...\n');
    await simpleGit().clone(repoUrl, repoPath);

    if (envVariables) {
      const envFilePath = path.join(repoPath, '.env');
      const envContent = Object.entries(envVariables)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      await fs.promises.writeFile(envFilePath, envContent);
    }

    logStream.push('Adding to build queue...\n');
    await addToBuildQueue(id, repoPath, repoUrl);  // Add job to the queue

    logStream.push(`ID: ${id}\n`);
    logStream.push(`Added to build queue\n`);
    logStream.push(null);

    res.end();
  } catch (error: any) {
    console.error('Error during upload:', error);
    logStream.push(`Error: ${error.message}\n`);

    try {
      await supabase.from('upload_statuses').update({
        status: 'failed',
        error: error.message
      }).eq('id', id);
    } catch (dbError) {
      console.error('Error updating database:', dbError);
    }

    logStream.push(null);
    res.end();
  }
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

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
