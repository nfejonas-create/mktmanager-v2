import { publishQueue } from '../shared/queue/bull.queue';
import { PostService } from '../domains/publishing/post.service';
import { PublisherService } from '../domains/publishing/publisher.service';
import { AccountService } from '../domains/social-accounts/account.service';
import { PostStatus } from '@prisma/client';

const postService = new PostService();
const publisherService = new PublisherService();
const accountService = new AccountService();

console.log('Publisher worker started...');

// Process jobs from the queue
publishQueue.process(async (job) => {
  const { postId } = job.data;
  
  console.log(`Processing job ${job.id} for post ${postId}`);
  
  try {
    // Get post with account
    const post = await postService.getPostById(postId);
    
    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }
    
    if (post.status === PostStatus.PUBLISHED) {
      console.log(`Post ${postId} already published, skipping`);
      return { success: true, skipped: true };
    }
    
    // Update status to PUBLISHING
    await postService.updatePostStatus(postId, PostStatus.PUBLISHING);
    
    // Get account with decrypted token
    const account = await accountService.getAccountById(post.socialAccountId, true);
    
    if (!account) {
      throw new Error(`Account for post ${postId} not found`);
    }
    
    // Publish to platform
    const result = await publisherService.publish(post, account as any);
    
    if (result.success) {
      // Update post as published
      await postService.updatePostStatus(postId, PostStatus.PUBLISHED, {
        externalId: result.externalId,
        externalUrl: result.externalUrl,
        publishedAt: new Date()
      });
      
      console.log(`Post ${postId} published successfully: ${result.externalUrl}`);
      return { success: true, externalUrl: result.externalUrl };
    } else {
      throw new Error(result.error || 'Publishing failed');
    }
  } catch (error: any) {
    console.error(`Error publishing post ${postId}:`, error.message);
    
    // Update post status to FAILED
    await postService.updatePostStatus(postId, PostStatus.FAILED);
    
    // Throw error to trigger retry
    throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queue...');
  await publishQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing queue...');
  await publishQueue.close();
  process.exit(0);
});