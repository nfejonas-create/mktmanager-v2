import { Router } from 'express';
import { requireAuth } from '../../api/middleware/auth.middleware';
import { accountRoutes as socialAccountControllerRoutes } from './account.controller';

const router = Router();

router.use(requireAuth, socialAccountControllerRoutes);

export const accountRoutes = router;
