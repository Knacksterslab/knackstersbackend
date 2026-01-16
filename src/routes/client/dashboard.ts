/**
 * Client Dashboard Routes
 * /api/client/dashboard/*
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import DashboardController from '../../controllers/DashboardController';

const router = Router();

router.use(requireAuth);

// Dashboard overview
router.get('/overview', DashboardController.getOverview.bind(DashboardController));

// Dashboard stats
router.get('/stats', DashboardController.getStats.bind(DashboardController));

export default router;
