import Queue from 'bull';
import { buildRepo, uploadDirectoryToS3 } from './helpers';
import { createDNSRecord } from './dns';
import { createClient } from '@supabase/supabase-js';
import { rimraf } from 'rimraf';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const buildQueue = new Queue('build-queue', process.env.REDIS_URL as string);

buildQueue.process(async (job) => {
  const { id, repoPath, repoUrl } = job.data;

  try {
    await supabase.from('upload_statuses').update({
      status: 'building',
      progress: 25
    }).eq('id', id);

    const buildDir = await buildRepo(repoPath);

    await supabase.from('upload_statuses').update({
      status: 'uploading',
      progress: 50
    }).eq('id', id);

    if (buildDir) {
      await uploadDirectoryToS3(buildDir, "source", `builds/${id}`);
    } else {
      await uploadDirectoryToS3(repoPath, "source", `builds/${id}`);
    }

    await createDNSRecord(id);

    await supabase.from('upload_statuses').update({
      status: 'completed',
      progress: 100
    }).eq('id', id);

    // Clean up the local repository after successful upload
    await rimraf(repoPath);

    return { success: true, id };
  } catch (error: any) {
    console.error('Error during build process:', error);

    await supabase.from('upload_statuses').update({
      status: 'failed',
      error: error.message
    }).eq('id', id);

    await rimraf(repoPath);

    throw error;
  }
});

export const addToBuildQueue = async (id: string, repoPath: string, repoUrl: string) => {
  await buildQueue.add({ id, repoPath, repoUrl });
};

export const getBuildStatus = async (id: string) => {
  const job = await buildQueue.getJob(id);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress();

  return { id: job.id, state, progress };
};