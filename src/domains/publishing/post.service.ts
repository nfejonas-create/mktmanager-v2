import { PrismaClient, Post, PostStatus, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePostData {
  userId: string;
  socialAccountId: string;
  content: string;
  contentType: ContentType;
  mediaUrls?: string[];
  scheduledAt?: Date;
}

export interface UpdatePostData {
  content?: string;
  contentType?: ContentType;
  mediaUrls?: string[];
  scheduledAt?: Date;
  status?: PostStatus;
}

export class PostService {
  async createPost(data: CreatePostData): Promise<Post> {
    const status = data.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT;
    
    return prisma.post.create({
      data: {
        ...data,
        status,
        mediaUrls: data.mediaUrls || []
      }
    });
  }
  
  async getPostsByUser(userId: string, filters?: {
    status?: PostStatus;
    socialAccountId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    return prisma.post.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.socialAccountId && { socialAccountId: filters.socialAccountId })
      },
      include: {
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    });
  }
  
  async getPostById(id: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
      include: {
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountName: true
          }
        }
      }
    });
  }
  
  async getScheduledPosts(): Promise<Post[]> {
    return prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: {
          lte: new Date()
        }
      },
      include: {
        socialAccount: true
      }
    });
  }
  
  async updatePost(id: string, data: UpdatePostData): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data
    });
  }
  
  async deletePost(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id }
    });
  }
  
  async updatePostStatus(id: string, status: PostStatus, data?: {
    externalId?: string;
    externalUrl?: string;
    publishedAt?: Date;
  }): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data: {
        status,
        ...(data?.externalId && { externalId: data.externalId }),
        ...(data?.externalUrl && { externalUrl: data.externalUrl }),
        ...(data?.publishedAt && { publishedAt: data.publishedAt })
      }
    });
  }
  
  async updatePostMetrics(id: string, metrics: {
    likes: number;
    comments: number;
    shares: number;
  }): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data: metrics
    });
  }
  
  async getDashboardStats(userId: string): Promise<{
    totalPublished: number;
    totalScheduled: number;
    totalFailed: number;
    recentPosts: Post[];
  }> {
    const [published, scheduled, failed, recentPosts] = await Promise.all([
      prisma.post.count({ where: { userId, status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { userId, status: PostStatus.SCHEDULED } }),
      prisma.post.count({ where: { userId, status: PostStatus.FAILED } }),
      prisma.post.findMany({
        where: { userId },
        include: {
          socialAccount: {
            select: {
              id: true,
              platform: true,
              accountName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);
    
    return {
      totalPublished: published,
      totalScheduled: scheduled,
      totalFailed: failed,
      recentPosts
    };
  }
}