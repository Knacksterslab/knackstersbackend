/**
 * Client Hours Routes
 * /api/client/hours/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import DashboardController from '../../controllers/DashboardController';

const router = Router();

router.use(requireAuth);
router.use(requireRole('CLIENT'));

router.get('/balance', (req, res) => DashboardController.getHoursBalance(req as any, res));

export default router;
