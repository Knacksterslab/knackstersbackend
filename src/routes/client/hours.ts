/**
 * Client Hours Routes
 * /api/client/hours/*
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import DashboardController from '../../controllers/DashboardController';

const router = Router();

router.use(requireAuth);

router.get('/balance', (req, res) => DashboardController.getHoursBalance(req as any, res));

export default router;
