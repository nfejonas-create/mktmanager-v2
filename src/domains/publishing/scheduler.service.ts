import Queue from 'bull';
import { PostStatus } from '@prisma/client';
import { PostService } from './post.service';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queue for post publishing
export const publishQueue = new Queue('post-publish', redisUrl);

const postService = new PostService();

export interface SchedulePostData {
  postId: string;
  scheduledAt: Date;
}

export class SchedulerService {
  async schedulePost(postId: string, scheduledAt: Date): Promise<void> {
    // Calculate delay in milliseconds
    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }
    
    // Add job to queue with delay
    await publishQueue.add(
      { postId },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000 // 1 minute
        }
      }
    );
    
    // Update post status
    await postService.updatePostStatus(postId, PostStatus.SCHEDULED);
  }
  
  async cancelSchedule(postId: string): Promise<void> {
    // Find and remove job from queue
    const jobs = await publishQueue.getJobs(['waiting', 'delayed']);
    const job = jobs.find(j => j.data.postId === postId);
    
    if (job) {
      await job.remove();
    }
    
    // Update post status back to DRAFT
    await postService.updatePostStatus(postId, PostStatus.DRAFT);
  }
  
  async getScheduledJobs(): Promise<Array<{
    id: string;
    postId: string;
    scheduledAt: Date;
    status: string;
  }>> {
    const jobs = await publishQueue.getJobs(['waiting', 'delayed', 'active']);
    
    return jobs.map(job => ({
      id: job.id!.toString(),
      postId: job.data.postId,
      scheduledAt: new Date(job.opts.delay ? Date.now() + job.opts.delay : Date.now()),
      status: 'scheduled'
    }));
  }
  
  async reschedulePost(postId: string, newScheduledAt: Date): Promise<void> {
    // Cancel existing job
    await this.cancelSchedule(postId);
    // Create new job with updated time
    await this.schedulePost(postId, newScheduledAt);
    console.log(`Post ${postId} rescheduled to ${newScheduledAt}`);
  }

  async publishNow(postId: string): Promise<void> {
    // Add job to queue immediately (no delay)
    await publishQueue.add(
      { postId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000
        }
      }
    );
  }
}