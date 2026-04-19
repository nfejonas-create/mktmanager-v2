import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PostService } from './post.service';
import { PostStatus } from '@prisma/client';

const router = Router();
const postService = new PostService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Get all posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default';
    const status = req.query.status as PostStatus | undefined;
    const socialAccountId = req.query.socialAccountId as string | undefined;
    
    const posts = await postService.getPostsByUser(userId, {
      status,
      socialAccountId,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0
    });
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default';
    const stats = await postService.getDashboardStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get single post
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await postService.getPostById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      socialAccountId,
      content,
      contentType,
      mediaUrls,
      scheduledAt,
      publishNow
    } = req.body;
    
    const userId = req.body.userId || 'default';
    
    // Validate required fields
    if (!socialAccountId || !content || !contentType) {
      return res.status(400).json({ 
        error: 'Missing required fields: socialAccountId, content, contentType' 
      });
    }
    
    // Create post
    const post = await postService.createPost({
      userId,
      socialAccountId,
      content,
      contentType,
      mediaUrls,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });
    
    // If publishNow is true, update status to PUBLISHING (will be picked up by cron)
    if (publishNow) {
      await postService.updatePostStatus(post.id, PostStatus.PUBLISHING);
    } 
    // If scheduledAt is provided and publishNow is false, status is already SCHEDULED
    
    // Return updated post
    const updatedPost = await postService.getPostById(post.id);
    res.status(201).json(updatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, contentType, mediaUrls, scheduledAt } = req.body;
    
    const post = await postService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Only allow updates to draft or scheduled posts
    if (post.status === PostStatus.PUBLISHED || post.status === PostStatus.PUBLISHING) {
      return res.status(400).json({ error: 'Cannot update published or publishing posts' });
    }
    
    const updatedPost = await postService.updatePost(id, {
      content,
      contentType,
      mediaUrls,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await postService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    await postService.deletePost(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Publish now
router.post('/:id/publish-now', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await postService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.status === PostStatus.PUBLISHED || post.status === PostStatus.PUBLISHING) {
      return res.status(400).json({ error: 'Post is already published or publishing' });
    }
    
    await postService.updatePostStatus(id, PostStatus.PUBLISHING);
    
    res.json({ success: true, message: 'Post queued for publishing' });
  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// Upload image
router.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export const postRoutes = router;