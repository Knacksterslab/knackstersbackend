/**
 * Talent Dashboard Routes
 * /api/talent/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import TalentController from '../../controllers/TalentController';

const router = Router();

// All routes require authentication AND talent role
router.use(requireAuth);
router.use(requireRole('TALENT')); // Strict tenant isolation

router.get('/dashboard', (req, res) => TalentController.getDashboard(req as any, res));
router.get('/earnings', (req, res) => TalentController.getEarnings(req as any, res));
router.get('/tasks/history', (req, res) => TalentController.getTaskHistory(req as any, res));

export default router;
