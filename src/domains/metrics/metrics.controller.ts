import { Router } from 'express';
import { Platform } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.client';
import { fetchLinkedInMetrics } from './linkedin-metrics.service';

const router = Router();

async function loadOwnedLinkedInAccount(accountId: string, userId: string) {
  return prisma.socialAccount.findFirst({
    where: {
      id: accountId,
      userId,
      platform: Platform.LINKEDIN,
      isActive: true
    }
  });
}

router.get('/linkedin/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await loadOwnedLinkedInAccount(accountId, req.user!.id);

    if (!account) {
      return res.status(404).json({ error: 'LinkedIn account not found' });
    }

    const metrics = await fetchLinkedInMetrics(req.user!.id, accountId);

    res.json({
      current: {
        followers: metrics.followers,
        impressions: metrics.impressions,
        engagement: metrics.engagement,
        reach: metrics.reach
      },
      chart14d: metrics.dailyStats
    });
  } catch (error) {
    console.error('Error fetching LinkedIn metrics:', error);
    res.status(500).json({ error: 'Failed to fetch LinkedIn metrics' });
  }
});

router.post('/linkedin/:accountId/sync', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await loadOwnedLinkedInAccount(accountId, req.user!.id);

    if (!account) {
      return res.status(404).json({ error: 'LinkedIn account not found' });
    }

    const metrics = await fetchLinkedInMetrics(req.user!.id, accountId);

    res.json({
      success: true,
      current: {
        followers: metrics.followers,
        impressions: metrics.impressions,
        engagement: metrics.engagement,
        reach: metrics.reach
      },
      chart14d: metrics.dailyStats
    });
  } catch (error) {
    console.error('Error syncing LinkedIn metrics:', error);
    res.status(500).json({ error: 'Failed to sync LinkedIn metrics' });
  }
});

export const metricsRoutes = router;
