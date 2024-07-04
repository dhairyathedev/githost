import express from 'express';
import simpleGit from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import { getAllFiles } from './lib/files';
import path from 'path';
import { uploadFile } from './lib/aws';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

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
  const { repoUrl } = req.body;
  const id = uuidv4();
  

  try {
    // Insert initial status into Supabase
    await supabase.from('upload_statuses').insert([
      { id, repo_url: repoUrl, status: 'cloning', progress: 0 }
    ]);

    await simpleGit().clone(repoUrl, path.join(__dirname, `../output/${id}`));

    // Update status to 'uploading'
    await supabase.from('upload_statuses').update({
      status: 'uploading'
    }).eq('id', id);

    const files = await getAllFiles(path.join(__dirname, `../output/${id}`));
    const totalFiles = files.length;

    await Promise.all(files.map(async (file, index) => {
      await uploadFile(file.slice(__dirname.length + 1), file);
      // Update progress
      await supabase.from('upload_statuses').update({
        progress: Math.round(((index + 1) / totalFiles) * 100)
      }).eq('id', id);
    }));

    // Update status to 'completed'
    await supabase.from('upload_statuses').update({
      status: 'completed',
      progress: 100
    }).eq('id', id);

    res.json({ id, repoUrl });
  } catch (error) {
    console.error('Error during upload:', error);
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});