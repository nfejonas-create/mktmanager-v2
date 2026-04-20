import axios from 'axios';
import { Platform } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.client';
import { EncryptionService } from '../../shared/security/encryption.service';

type DailyStat = {
  date: string;
  impressions: number;
  engagement: number;
  reach: number;
};

type LinkedInMetricsPayload = {
  followers: number;
  impressions: number;
  engagement: number;
  reach: number;
  dailyStats: DailyStat[];
};

const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION || '202601';

function getLinkedInHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Restli-Protocol-Version': '2.0.0',
    'Linkedin-Version': LINKEDIN_VERSION,
    'Content-Type': 'application/json'
  };
}

function toOrganizationUrn(externalId: string) {
  return externalId.startsWith('urn:li:organization:') ? externalId : `urn:li:organization:${externalId}`;
}

function normalizeDailyFollowers(elements: unknown[]): Array<{ date: string; followers: number }> {
  return elements
    .map((item) => {
      const entry = item as {
        timeRange?: { start?: number };
        followerCounts?: {
          organicFollowerCount?: number;
          paidFollowerCount?: number;
        };
      };

      const timestamp = entry.timeRange?.start;
      if (!timestamp) {
        return null;
      }

      const date = new Date(timestamp);
      date.setUTCHours(0, 0, 0, 0);

      return {
        date: date.toISOString(),
        followers: Number(entry.followerCounts?.organicFollowerCount || 0) + Number(entry.followerCounts?.paidFollowerCount || 0)
      };
    })
    .filter((item): item is { date: string; followers: number } => Boolean(item))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-14);
}

function normalizeDailyStats(elements: unknown[]): DailyStat[] {
  return elements
    .map((item) => {
      const entry = item as {
        timeRange?: { start?: number };
        totalShareStatistics?: {
          impressionCount?: number;
          uniqueImpressionsCount?: number;
          uniqueImpressionsCounts?: number;
          engagement?: number;
        };
      };

      const timestamp = entry.timeRange?.start;
      if (!timestamp) {
        return null;
      }

      const stats = entry.totalShareStatistics || {};
      const date = new Date(timestamp);
      date.setUTCHours(0, 0, 0, 0);

      return {
        date: date.toISOString(),
        impressions: Number(stats.impressionCount || 0),
        engagement: Number(stats.engagement || 0),
        reach: Number(stats.uniqueImpressionsCount ?? stats.uniqueImpressionsCounts ?? 0)
      };
    })
    .filter((item): item is DailyStat => Boolean(item))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-14);
}

export async function fetchLinkedInMetrics(userId: string, socialAccountId: string): Promise<LinkedInMetricsPayload> {
  const account = await prisma.socialAccount.findFirst({
    where: {
      id: socialAccountId,
      userId,
      platform: Platform.LINKEDIN,
      isActive: true
    }
  });

  if (!account) {
    throw new Error('LinkedIn account not found');
  }

  const accessToken = EncryptionService.decrypt(account.accessToken);
  const organizationUrn = toOrganizationUrn(account.externalId);
  const now = Date.now();
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const [followersResponse, shareStatsResponse] = await Promise.all([
    axios.get('https://api.linkedin.com/rest/organizationalEntityFollowerStatistics', {
      headers: getLinkedInHeaders(accessToken),
      params: {
        q: 'organizationalEntity',
        organizationalEntity: organizationUrn,
        'timeIntervals.timeGranularityType': 'DAY',
        'timeIntervals.timeRange.start': fourteenDaysAgo,
        'timeIntervals.timeRange.end': now
      }
    }),
    axios.get('https://api.linkedin.com/rest/organizationalEntityShareStatistics', {
      headers: getLinkedInHeaders(accessToken),
      params: {
        q: 'organizationalEntity',
        organizationalEntity: organizationUrn,
        'timeIntervals.timeGranularityType': 'DAY',
        'timeIntervals.timeRange.start': fourteenDaysAgo,
        'timeIntervals.timeRange.end': now
      }
    })
  ]);

  const followerElements = Array.isArray(followersResponse.data?.elements) ? followersResponse.data.elements : [];
  const shareElements = Array.isArray(shareStatsResponse.data?.elements) ? shareStatsResponse.data.elements : [];
  const followerDailyStats = normalizeDailyFollowers(followerElements);
  const dailyStats = normalizeDailyStats(shareElements);
  const followers = followerDailyStats[followerDailyStats.length - 1]?.followers || 0;
  const impressions = dailyStats.reduce((accumulator, item) => accumulator + item.impressions, 0);
  const reach = dailyStats.reduce((accumulator, item) => accumulator + item.reach, 0);
  const engagement =
    dailyStats.length > 0
      ? Number((dailyStats.reduce((accumulator, item) => accumulator + item.engagement, 0) / dailyStats.length).toFixed(4))
      : 0;

  await Promise.all(
    dailyStats.map((item) =>
      prisma.accountMetric.upsert({
        where: {
          socialAccountId_date: {
            socialAccountId,
            date: new Date(item.date)
          }
        },
        update: {
          followers,
          impressions: item.impressions,
          engagement: item.engagement
        },
        create: {
          socialAccountId,
          date: new Date(item.date),
          followers,
          impressions: item.impressions,
          engagement: item.engagement
        }
      })
    )
  );

  return {
    followers,
    impressions,
    engagement,
    reach,
    dailyStats
  };
}
