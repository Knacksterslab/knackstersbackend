/**
 * Client Dashboard Routes
 * /api/client/dashboard/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import DashboardController from '../../controllers/DashboardController';

const router = Router();

// All routes require authentication AND client role
router.use(requireAuth);
router.use(requireRole('CLIENT')); // Strict tenant isolation

// Dashboard overview
router.get('/overview', DashboardController.getOverview.bind(DashboardController));

// Dashboard stats
router.get('/stats', DashboardController.getStats.bind(DashboardController));

export default router;
