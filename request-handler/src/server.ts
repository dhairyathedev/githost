import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { S3 } from 'aws-sdk';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 2402;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  s3ForcePathStyle: true, // required for Cloudflare
  signatureVersion: 'v4'
});

// Middleware to determine Content-Type based on file extension
const getContentType = (filePath: string): string => {
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'application/javascript';
  return 'application/octet-stream';
};

// Route to fetch and serve the built app from S3
app.get('/open/:id/*', async (req, res) => {
  const params = req.params as any;
  const id = params.id;
  const filePath = params[0] || 'index.html';

  try {
    const { data, error } = await supabase
      .from('upload_statuses')
      .select('id')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'ID not found or no S3 information available' });
    }

    const bucketName = "source";
    const prefix = `builds/${data.id}/`;
    const fullPath = path.join(prefix, filePath);

    const contents = await s3.getObject({
      Bucket: bucketName,
      Key: fullPath
    }).promise();

    const contentType = getContentType(filePath);
    res.set('Content-Type', contentType);
    res.send(contents.Body);
  } catch (err) {
    console.error('Error fetching build URL:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
