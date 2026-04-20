import Queue from 'bull';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create and export the publish queue
export const publishQueue = new Queue('post-publish', redisUrl);
export const contentGenQueue = new Queue('content-gen', redisUrl);

// Queue event handlers for logging
publishQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

publishQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

publishQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

contentGenQueue.on('completed', (job) => {
  console.log(`Content job ${job.id} completed successfully`);
});

contentGenQueue.on('failed', (job, err) => {
  console.error(`Content job ${job?.id} failed:`, err.message);
});
