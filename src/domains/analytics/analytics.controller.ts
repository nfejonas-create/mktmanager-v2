import { Request, Response, Router } from 'express';
import { MetricsService } from './metrics.service';
import { PostService } from '../publishing/post.service';

const router = Router();
const metricsService = new MetricsService();
const postService = new PostService();

// Get dashboard data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default';
    const data = await metricsService.getDashboardData(userId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get post metrics
router.get('/posts/:id/metrics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await postService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Sync latest metrics
    await metricsService.syncPostMetrics(post);
    
    // Return updated post
    const updatedPost = await postService.getPostById(id);
    res.json({
      likes: updatedPost?.likes || 0,
      comments: updatedPost?.comments || 0,
      shares: updatedPost?.shares || 0
    });
  } catch (error) {
    console.error('Error fetching post metrics:', error);
    res.status(500).json({ error: 'Failed to fetch post metrics' });
  }
});

export const analyticsRoutes = router;