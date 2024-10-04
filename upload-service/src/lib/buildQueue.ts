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
  const logs: any = [];

  const addLog = async (message: string) => {
    logs.push({ timestamp: new Date().toISOString(), message });
    await supabase.from('deployment_logs').upsert({ id, logs });
  };

  const timeout = 180000; // 3 minutes in milliseconds
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Deployment timed out after 3 minutes')), timeout);
  });

  try {
    await addLog('Starting build process');
    await supabase.from('upload_statuses').update({
      status: 'building',
      progress: 25
    }).eq('id', id);

    await addLog('Building repository');
    const buildDir = await buildRepo(repoPath);

    if (!buildDir) {
      throw new Error('Build process failed');
    }

    await addLog('Build completed, starting upload');
    await supabase.from('upload_statuses').update({
      status: 'uploading',
      progress: 50
    }).eq('id', id);

    await addLog('Uploading built files to S3');
    await Promise.race([
      uploadDirectoryToS3(buildDir, "source", `builds/${id}`),
      timeoutPromise
    ]);

    await addLog('Creating DNS record');
    await Promise.race([
      createDNSRecord(id),
      timeoutPromise
    ]);

    await addLog('Deployment completed successfully');
    await supabase.from('upload_statuses').update({
      status: 'completed',
      progress: 100
    }).eq('id', id);

    // Clean up the local repository after successful upload
    await rimraf(repoPath);

    return { success: true, id };
  } catch (error: any) {
    console.error('Error during build process:', error);
    await addLog(`Error: ${error.message}`);

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
  const jobCounts = await buildQueue.getJobCounts();

  // Fetch status data from the database
  const { data: statusData, error: statusError } = await supabase
    .from('upload_statuses')
    .select('*')
    .eq('id', id)
    .single();

  // Fetch logs data from the database
  const { data: logsData, error: logsError } = await supabase
    .from('deployment_logs')
    .select('logs')
    .eq('id', id)
    .single();

  // If there's no job in the queue and no data in the database, return null
  if (!job && !statusData) {
    return null;
  }

  let queueInfo: {
    state: string;
    progress: number;
    queuePosition: number | null;
    jobsAhead: number | null;
    totalQueuedJobs: number;
  } = {
    state: 'completed',
    progress: 100,
    queuePosition: null,
    jobsAhead: null,
    totalQueuedJobs: jobCounts.waiting + jobCounts.active
  };

  if (job) {
    const state = await job.getState();
    const progress = job.progress();

    // Manually calculate the job's position in the queue
    const waitingJobs = await buildQueue.getWaiting();
    const activeJobs = await buildQueue.getActive();
    const allJobs = [...waitingJobs, ...activeJobs];
    const position = allJobs.findIndex(j => j.id === job.id);

    queueInfo = {
      state,
      progress,
      queuePosition: position !== -1 ? position + 1 : null,
      jobsAhead: position !== -1 ? position : null,
      totalQueuedJobs: jobCounts.waiting + jobCounts.active
    };
  }

  return { 
    id,
    ...queueInfo,
    status: statusData || { status: 'unknown' },
    logs: logsData?.logs || []
  };
};