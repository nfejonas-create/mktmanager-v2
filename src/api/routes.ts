import { Router } from 'express';
import { accountRoutes } from '../domains/social-accounts/account.controller';
import { postRoutes } from '../domains/publishing/post.controller';
import { contentRoutes } from '../domains/content/content.controller';
import { analyticsRoutes } from '../domains/analytics/analytics.controller';

const router = Router();

// Mount routes
router.use('/accounts', accountRoutes);
router.use('/posts', postRoutes);
router.use('/content', contentRoutes);
router.use('/analytics', analyticsRoutes);

export const apiRoutes = router;