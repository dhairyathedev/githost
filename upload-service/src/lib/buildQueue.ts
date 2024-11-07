// lib/buildQueue.ts
import Queue from 'bull';
import { buildRepo, uploadDirectoryToS3 } from './helpers';
import { createDNSRecord } from './dns';
import { createClient } from '@supabase/supabase-js';
import { rimraf } from 'rimraf';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BuildLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'system';
  message: string;
}

interface DeploymentStatus {
  id: string;
  status: 'queued' | 'building' | 'uploading' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  logs: BuildLog[];
  error?: string;
}

const buildQueue = new Queue('build-queue', process.env.REDIS_URL as string);

// Add queue event listeners
buildQueue.on('global:completed', async (jobId, result) => {
  const job = await buildQueue.getJob(jobId);
  if (job) {
    await updateDeploymentStatus(job.data.id, 'completed', 100);
  }
});

buildQueue.on('global:failed', async (jobId, error) => {
  const job = await buildQueue.getJob(jobId);
  if (job) {
    await updateDeploymentStatus(job.data.id, 'failed', 0, error.message);
  }
});

buildQueue.on('waiting', async (jobId) => {
  const job = await buildQueue.getJob(jobId);
  if (job) {
    await updateDeploymentStatus(job.data.id, 'queued', 0);
    await addBuildLog(job.data.id, 'info', 'Job waiting in queue');
  }
});

buildQueue.on('active', async (job) => {
  await updateDeploymentStatus(job.data.id, 'building', 25);
  await addBuildLog(job.data.id, 'info', 'Job started processing');
});

buildQueue.on('failed', async (job, err) => {
  await updateDeploymentStatus(job.data.id, 'failed', 0, err.message);
  await addBuildLog(job.data.id, 'error', `Job failed: ${err.message}`);
});

buildQueue.on('stalled', async (job) => {
  await addBuildLog(job.data.id, 'error', 'Job stalled - will be retried');
});

const updateDeploymentStatus = async (
  id: string,
  status: DeploymentStatus['status'],
  progress: number,
  error?: string
) => {
  const timestamp = new Date().toISOString();
  
  await supabase.from('upload_statuses').update({
    status,
    progress,
    error,
    updated_at: timestamp
  }).eq('id', id);
};

const addBuildLog = async (
  id: string,
  type: BuildLog['type'],
  message: string
) => {
  const log: BuildLog = {
    id,
    timestamp: new Date().toISOString(),
    type,
    message
  };

  const { data: existingLogs } = await supabase
    .from('deployment_logs')
    .select('logs')
    .eq('id', id)
    .single();

  const logs = existingLogs ? [...existingLogs.logs, log] : [log];

  await supabase.from('deployment_logs').upsert({
    id,
    logs
  });

  return log;
};

buildQueue.process(async (job) => {
  const { id, repoPath, repoUrl } = job.data;

  try {
    // Update initial status
    await updateDeploymentStatus(id, 'queued', 0);
    await addBuildLog(id, 'info', 'Build queued');

    // Building phase
    await updateDeploymentStatus(id, 'building', 25);
    await addBuildLog(id, 'info', 'Starting build process');
    
    const buildDir = await buildRepo(repoPath);
    if (!buildDir) {
      throw new Error('Build process failed');
    }
    await addBuildLog(id, 'success', 'Build completed successfully');

    // Uploading phase
    await updateDeploymentStatus(id, 'uploading', 50);
    await addBuildLog(id, 'info', 'Uploading built files');
    
    await uploadDirectoryToS3(buildDir, "source", `builds/${id}`);
    await addBuildLog(id, 'success', 'Files uploaded successfully');

    // DNS setup
    await addBuildLog(id, 'info', 'Configuring DNS');
    await createDNSRecord(id);
    await addBuildLog(id, 'success', 'DNS configured successfully');

    // Cleanup and completion
    await rimraf(repoPath);
    await updateDeploymentStatus(id, 'completed', 100);
    await addBuildLog(id, 'success', 'Deployment completed successfully');

    return { success: true, id };
  } catch (error: any) {
    console.error('Build process failed:', error);
    await addBuildLog(id, 'error', `Error: ${error.message}`);
    await updateDeploymentStatus(id, 'failed', 0, error.message);
    await rimraf(repoPath);
    throw error;
  }
});

export const addToBuildQueue = async (id: string, repoPath: string, repoUrl: string) => {
  const job = await buildQueue.add(
    { id, repoPath, repoUrl },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000 // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 24 * 3600 // Keep failed jobs for 24 hours
      },
      priority: 1
    }
  );

  await updateDeploymentStatus(id, 'queued', 0);
  await addBuildLog(id, 'info', 'Added to build queue');
  
  return job;
};

export const getBuildStatus = async (id: string) => {
  const job = await buildQueue.getJob(id);
  const jobCounts = await buildQueue.getJobCounts();

  // Fetch status and logs from database
  const [statusResult, logsResult] = await Promise.all([
    supabase.from('upload_statuses').select('*').eq('id', id).single(),
    supabase.from('deployment_logs').select('logs').eq('id', id).single()
  ]);

  if (!job && !statusResult.data) {
    return null;
  }

  const queueInfo = await getQueueInfo(job);
  
  return {
    id,
    ...queueInfo,
    status: statusResult.data?.status || 'unknown',
    progress: statusResult.data?.progress || 0,
    createdAt: statusResult.data?.created_at,
    updatedAt: statusResult.data?.updated_at,
    logs: logsResult.data?.logs || [],
    error: statusResult.data?.error
  };
};

async function getQueueInfo(job: Queue.Job | null) {
  if (!job) {
    return {
      state: 'unknown',
      queuePosition: null,
      jobsAhead: 0,
      totalQueuedJobs: 0
    };
  }

  const state = await job.getState();
  const [waiting, active, delayed] = await Promise.all([
    buildQueue.getWaiting(),
    buildQueue.getActive(),
    buildQueue.getDelayed()
  ]);

  // Sort by job ID or creation time
  const allJobs = [...waiting, ...active, ...delayed].sort((a, b) => 
    Number(a.timestamp || a.id) - Number(b.timestamp || b.id)
  );

  const position = allJobs.findIndex(j => j.id === job.id);
  const jobsAhead = Math.max(0, position);  // Ensure non-negative

  return {
    state,
    queuePosition: position === -1 ? null : position + 1,
    jobsAhead,
    totalQueuedJobs: allJobs.length
  };
}