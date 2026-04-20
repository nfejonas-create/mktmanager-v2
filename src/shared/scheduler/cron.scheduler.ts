import cron from 'node-cron';
import { PostStatus } from '@prisma/client';
import { prisma } from '../database/prisma.client';
import { listDueAutomationConfigs, markAutomationRun } from '../database/automation.repository';
import { contentGenQueue, publishQueue } from '../queue/bull.queue';
import { getNextRunAt } from './cron.utils';

export async function runScheduler() {
  const now = new Date();

  const dueConfigs = await listDueAutomationConfigs(now);

  for (const config of dueConfigs) {
    await contentGenQueue.add(
      {
        userId: config.userId,
        automationConfigId: config.id
      },
      {
        removeOnComplete: true,
        attempts: 3
      }
    );

    await markAutomationRun({
      id: config.id,
      userId: config.userId,
      lastRunAt: now,
      nextRunAt: getNextRunAt(config.cronExpression, config.timezone, now)
    });
  }

  const scheduledPosts = await prisma.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledAt: {
        lte: now
      }
    },
    select: {
      id: true,
      userId: true
    }
  });

  for (const post of scheduledPosts) {
    await prisma.post.update({
      where: { id: post.id },
      data: { status: PostStatus.PUBLISHING }
    });

    await publishQueue.add(
      { postId: post.id, userId: post.userId },
      { removeOnComplete: true, attempts: 3 }
    );
  }

  return {
    checked: dueConfigs.length + scheduledPosts.length
  };
}

export function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await runScheduler();
    } catch (error) {
      console.error('[Scheduler] Failed to process automation configs:', error);
    }
  });

  console.log('[Scheduler] Iniciado - automação por usuário a cada 1 minuto');
}
