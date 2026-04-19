import { Request, Response, Router } from 'express';
import { Platform } from '@prisma/client';
import { ContentGeneratorService } from './content-generator.service';

const router = Router();
const contentService = new ContentGeneratorService();

// Generate post content
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topic, platform, tone } = req.body;
    
    if (!topic || !platform) {
      return res.status(400).json({ 
        error: 'Missing required fields: topic, platform' 
      });
    }
    
    if (!['LINKEDIN', 'FACEBOOK'].includes(platform)) {
      return res.status(400).json({ 
        error: 'Invalid platform. Must be LINKEDIN or FACEBOOK' 
      });
    }
    
    const result = await contentService.generatePost(
      topic,
      platform as Platform,
      tone
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Generate hashtags
router.post('/hashtags', async (req: Request, res: Response) => {
  try {
    const { topic, count } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Missing required field: topic' });
    }
    
    const hashtags = await contentService.generateHashtags(
      topic,
      count || 5
    );
    
    res.json({ hashtags });
  } catch (error) {
    console.error('Error generating hashtags:', error);
    res.status(500).json({ error: 'Failed to generate hashtags' });
  }
});

export const contentRoutes = router;