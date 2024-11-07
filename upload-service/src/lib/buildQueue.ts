// lib/buildQueue.ts
import { Queue, Worker, QueueEvents } from 'bullmq';
import { buildRepo, uploadDirectoryToS3 } from './helpers';
import { createDNSRecord } from './dns';
import { createClient } from '@supabase/supabase-js';
import { rimraf } from 'rimraf';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Redis connection configuration for Upstash
const connection = {
  host: process.env.UPSTASH_REDIS_HOST as string,
  port: 6379,
  password: process.env.UPSTASH_REDIS_PASSWORD as string,
};

// Create BullMQ queue
const buildQueue = new Queue('build-queue', {
  connection
});

// Create queue events listener
const queueEvents = new QueueEvents('build-queue', { connection });

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

// Queue event listeners
queueEvents.on('completed', async ({ jobId }) => {
  const job = await buildQueue.getJob(jobId);
  if (job) {
    await updateDeploymentStatus(job.data.id, 'completed', 100);
  }
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  const job = await buildQueue.getJob(jobId);
  if (job) {
    await updateDeploymentStatus(job.data.id, 'failed', 0, failedReason);
  }
});

queueEvents.on('waiting', async ({ jobId }) => {
  const job = await buildQueue.getJob(jobId);
  if (job) {
    await updateDeploymentStatus(job.data.id, 'queued', 0);
    await addBuildLog(job.data.id, 'info', 'Job waiting in queue');
  }
});

queueEvents.on('active', async ({ jobId }) => {
  const job = await buildQueue.getJob(jobId);
  if (job) {
    await updateDeploymentStatus(job.data.id, 'building', 25);
    await addBuildLog(job.data.id, 'info', 'Job started processing');
  }
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

// Create worker
const worker = new Worker('build-queue', async (job) => {
  const { id, repoPath, repoUrl } = job.data;

  try {
    await updateDeploymentStatus(id, 'queued', 0);
    await addBuildLog(id, 'info', 'Build queued');

    await updateDeploymentStatus(id, 'building', 25);
    await addBuildLog(id, 'info', 'Starting build process');
    
    const buildDir = await buildRepo(repoPath);
    if (!buildDir) {
      throw new Error('Build process failed');
    }
    await addBuildLog(id, 'success', 'Build completed successfully');

    await updateDeploymentStatus(id, 'uploading', 50);
    await addBuildLog(id, 'info', 'Uploading built files');
    
    await uploadDirectoryToS3(buildDir, "source", `builds/${id}`);
    await addBuildLog(id, 'success', 'Files uploaded successfully');

    await addBuildLog(id, 'info', 'Configuring DNS');
    await createDNSRecord(id);
    await addBuildLog(id, 'success', 'DNS configured successfully');

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
}, { connection });

export const addToBuildQueue = async (id: string, repoPath: string, repoUrl: string) => {
  const job = await buildQueue.add('build', { id, repoPath, repoUrl }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 3600,
      count: 1000
    },
    removeOnFail: {
      age: 24 * 3600
    }
  });

  await updateDeploymentStatus(id, 'queued', 0);
  await addBuildLog(id, 'info', 'Added to build queue');
  
  return job;
};

export const getBuildStatus = async (id: string) => {
  const jobs = await buildQueue.getJobs(['waiting', 'active', 'delayed']);
  const job = jobs.find(j => j.data.id === id);
  
  const [statusResult, logsResult] = await Promise.all([
    supabase.from('upload_statuses').select('*').eq('id', id).single(),
    supabase.from('deployment_logs').select('logs').eq('id', id).single()
  ]);

  if (!job && !statusResult.data) {
    return null;
  }

  const queueInfo = await getQueueInfo(jobs, job);
  
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

async function getQueueInfo(allJobs: any[], job: any) {
  if (!job) {
    return {
      state: 'unknown',
      queuePosition: null,
      jobsAhead: 0,
      totalQueuedJobs: 0
    };
  }

  const state = await job.getState();
  
  // Sort jobs by timestamp
  const sortedJobs = allJobs.sort((a, b) => 
    Number(a.timestamp) - Number(b.timestamp)
  );

  const position = sortedJobs.findIndex(j => j.id === job.id);
  const jobsAhead = Math.max(0, position);

  return {
    state,
    queuePosition: position === -1 ? null : position + 1,
    jobsAhead,
    totalQueuedJobs: allJobs.length
  };
}