import axios from 'axios';
import { Post, SocialAccount, Platform } from '@prisma/client';
import { AccountService } from '../social-accounts/account.service';
import { PostService } from '../publishing/post.service';
import { prisma } from '../../shared/database/prisma.client';
const accountService = new AccountService();
const postService = new PostService();

export class MetricsService {
  async syncPostMetrics(post: Post): Promise<void> {
    if (!post.externalId || post.status !== 'PUBLISHED') {
      return;
    }
    
    const account = await accountService.getAccountById(post.socialAccountId, true);
    if (!account) {
      console.error(`Account not found for post ${post.id}`);
      return;
    }
    
    try {
      let metrics: { likes: number; comments: number; shares: number } = {
        likes: post.likes,
        comments: post.comments,
        shares: post.shares
      };
      
      if (account.platform === Platform.LINKEDIN) {
        metrics = await this.getLinkedInPostMetrics(post.externalId, (account as any).accessToken);
      } else if (account.platform === Platform.FACEBOOK) {
        metrics = await this.getFacebookPostMetrics(post.externalId, (account as any).accessToken);
      }
      
      await postService.updatePostMetrics(post.id, metrics);
    } catch (error) {
      console.error(`Error syncing metrics for post ${post.id}:`, error);
    }
  }
  
  private async getLinkedInPostMetrics(externalId: string, accessToken: string): Promise<{
    likes: number;
    comments: number;
    shares: number;
  }> {
    // For mock tokens
    if (accessToken.startsWith('mock_')) {
      return {
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10)
      };
    }
    
    try {
      // LinkedIn API for social actions
      const response = await axios.get(
        `https://api.linkedin.com/v2/socialActions/${externalId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      const likes = response.data.likesSummary?.totalLikes || 0;
      const comments = response.data.commentsSummary?.totalComments || 0;
      
      return { likes, comments, shares: 0 }; // LinkedIn doesn't provide shares count easily
    } catch (error) {
      console.error('Error fetching LinkedIn metrics:', error);
      return { likes: 0, comments: 0, shares: 0 };
    }
  }
  
  private async getFacebookPostMetrics(externalId: string, accessToken: string): Promise<{
    likes: number;
    comments: number;
    shares: number;
  }> {
    // For mock tokens
    if (accessToken.startsWith('mock_')) {
      return {
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10)
      };
    }
    
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${externalId}`,
        {
          params: {
            fields: 'likes.summary(true),comments.summary(true),shares',
            access_token: accessToken
          }
        }
      );
      
      return {
        likes: response.data.likes?.summary?.total_count || 0,
        comments: response.data.comments?.summary?.total_count || 0,
        shares: response.data.shares?.count || 0
      };
    } catch (error) {
      console.error('Error fetching Facebook metrics:', error);
      return { likes: 0, comments: 0, shares: 0 };
    }
  }
  
  async syncAccountMetrics(account: SocialAccount): Promise<void> {
    const accountWithToken = await accountService.getAccountById(account.id, true);
    if (!accountWithToken) {
      return;
    }
    
    try {
      let followers = 0;
      let impressions = 0;
      let engagement = 0;
      
      if (account.platform === Platform.LINKEDIN) {
        // LinkedIn doesn't provide follower count easily in basic API
        followers = 0;
      } else if (account.platform === Platform.FACEBOOK) {
        const accessToken = (accountWithToken as any).accessToken;
        
        if (!accessToken.startsWith('mock_')) {
          const response = await axios.get(
            `https://graph.facebook.com/v18.0/${account.externalId}`,
            {
              params: {
                fields: 'followers_count',
                access_token: accessToken
              }
            }
          );
          
          followers = response.data.followers_count || 0;
        }
      }
      
      // Save metrics
      await prisma.accountMetric.create({
        data: {
          socialAccountId: account.id,
          date: new Date(),
          followers,
          impressions,
          engagement
        }
      });
    } catch (error) {
      console.error(`Error syncing account metrics for ${account.id}:`, error);
    }
  }
  
  async getDashboardData(userId: string): Promise<{
    totalPublished: number;
    totalScheduled: number;
    totalFailed: number;
    recentPosts: Post[];
    accountMetrics: Array<{
      accountId: string;
      accountName: string;
      platform: string;
      followers: number;
    }>;
  }> {
    const stats = await postService.getDashboardStats(userId);
    
    // Get account metrics
    const accounts = await accountService.getAccountsByUser(userId);
    const accountMetrics = await Promise.all(
      accounts.map(async (account) => {
        const latestMetric = await prisma.accountMetric.findFirst({
          where: { socialAccountId: account.id },
          orderBy: { date: 'desc' }
        });
        
        return {
          accountId: account.id,
          accountName: account.accountName,
          platform: account.platform,
          followers: latestMetric?.followers || 0
        };
      })
    );
    
    return {
      ...stats,
      accountMetrics
    };
  }
}
