/**
 * Talent Dashboard Routes
 * /api/talent/*
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import TalentController from '../../controllers/TalentController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/dashboard', (req, res) => TalentController.getDashboard(req as any, res));
router.get('/earnings', (req, res) => TalentController.getEarnings(req as any, res));
router.get('/tasks/history', (req, res) => TalentController.getTaskHistory(req as any, res));

export default router;
