import { Router } from 'express';
import { requireAuth } from './middleware/auth.middleware';
import { authRoutes } from '../domains/auth/auth.controller';
import { automationRoutes } from '../domains/automation/automation.controller';
import { accountRoutes } from '../domains/social-accounts/account.routes';
import { postRoutes } from '../domains/publishing/post.controller';
import { contentRoutes } from '../domains/content/content.controller';
import { analyticsRoutes } from '../domains/analytics/analytics.controller';
import { metricsRoutes } from '../domains/metrics/metrics.controller';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/posts', requireAuth, postRoutes);
router.use('/content', requireAuth, contentRoutes);
router.use('/analytics', requireAuth, analyticsRoutes);
router.use('/automation', requireAuth, automationRoutes);
router.use('/metrics', requireAuth, metricsRoutes);

export const apiRoutes = router;
