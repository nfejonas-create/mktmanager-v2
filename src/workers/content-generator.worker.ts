import { ContentType, PostStatus } from '@prisma/client';
import { prisma } from '../shared/database/prisma.client';
import { findAutomationConfigByIdAndUserId } from '../shared/database/automation.repository';
import { contentGenQueue, publishQueue } from '../shared/queue/bull.queue';
import { EncryptionService } from '../shared/security/encryption.service';
import { ContentGeneratorService } from '../domains/content/content-generator.service';

const contentGeneratorService = new ContentGeneratorService();

console.log('Content generator worker started...');

export async function processContentGenerationJob(job: { data: { userId: string; automationConfigId: string } }) {
  const { userId, automationConfigId } = job.data as { userId: string; automationConfigId: string };

  console.log(`[ContentGen] START userId=${userId} automationConfigId=${automationConfigId}`);

  const config = await findAutomationConfigByIdAndUserId(automationConfigId, userId);

  if (!config) {
    throw new Error('Automation config not found for user');
  }

  const aiApiKey = EncryptionService.decrypt(config.aiApiKeyEncrypted);
  const generated = await contentGeneratorService.generate({
    userId,
    prompt: config.promptTemplate,
    aiProvider: config.aiProvider,
    aiApiKey
  });

  const accounts = await prisma.socialAccount.findMany({
    where: {
      userId,
      platform: {
        in: config.platforms as Array<'LINKEDIN' | 'FACEBOOK'>
      },
      isDefault: true,
      isActive: true
    },
    select: {
      id: true,
      platform: true
    }
  });

  const createdPosts = [];

  for (const account of accounts) {
    const post = await prisma.post.create({
      data: {
        userId,
        socialAccountId: account.id,
        content: generated.content,
        contentType: ContentType.TEXT,
        mediaUrls: [],
        status: config.autoPublish ? PostStatus.PUBLISHING : PostStatus.DRAFT
      }
    });

    createdPosts.push(post);

    if (config.autoPublish) {
      await publishQueue.add(
        { postId: post.id, userId },
        { removeOnComplete: true, attempts: 3 }
      );
    }
  }

  console.log(`[ContentGen] END userId=${userId} createdPosts=${createdPosts.length}`);

  return {
    userId,
    createdPosts: createdPosts.map((post) => post.id)
  };
}

contentGenQueue.process(processContentGenerationJob);

process.on('SIGTERM', async () => {
  await contentGenQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await contentGenQueue.close();
  process.exit(0);
});
