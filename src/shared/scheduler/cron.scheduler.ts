import cron from 'node-cron';
import { PrismaClient, PostStatus } from '@prisma/client';
import { PublisherService } from '../../domains/publishing/publisher.service';

const prisma = new PrismaClient();
const publisherService = new PublisherService();

export async function runScheduler() {
  const now = new Date();
  console.log(`[Scheduler] Verificando posts agendados. Agora: ${now.toISOString()}`);

  try {
    const posts = await prisma.post.findMany({
      where: {
        status: { in: [PostStatus.SCHEDULED, PostStatus.PUBLISHING] },
        OR: [
          { scheduledAt: { lte: now } },
          { status: PostStatus.PUBLISHING }
        ]
      },
      include: { socialAccount: true }
    });

    console.log(`[Scheduler] Posts encontrados: ${posts.length}`);

    for (const post of posts) {
      try {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: PostStatus.PUBLISHING }
        });

        const result = await publisherService.publish(post, post.socialAccount);

        if (result.success) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: PostStatus.PUBLISHED,
              publishedAt: new Date(),
              externalId: result.externalId,
              externalUrl: result.externalUrl
            }
          });
          console.log(`[Scheduler] Post ${post.id} publicado com sucesso`);
        } else {
          throw new Error(result.error || 'Publishing failed');
        }
      } catch (error: any) {
        console.error(`[Scheduler] Erro ao publicar post ${post.id}:`, error.message);
        await prisma.post.update({
          where: { id: post.id },
          data: { status: PostStatus.FAILED }
        });
      }
    }

    return { checked: posts.length, published: posts.length };
  } catch (error: any) {
    console.error('[Scheduler] Erro:', error.message);
    throw error;
  }
}

export function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await runScheduler();
    } catch (err: any) {
      console.error('[Scheduler Cron] Erro:', err.message);
    }
  });
  console.log('[Scheduler] Iniciado - verificando a cada 1 minuto');
}
