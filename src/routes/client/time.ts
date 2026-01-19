/**
 * Client Time Logs Routes
 * /api/client/time/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import TimeLogController from '../../controllers/TimeLogController';

const router = Router();

router.use(requireAuth);
router.use(requireRole('CLIENT'));

// Get all time logs for the user
router.get('/', (req, res) => TimeLogController.getTimeLogs(req as any, res));

// Get single time log
router.get('/:id', (req, res) => TimeLogController.getTimeLog(req as any, res));

// Create new time log
router.post('/', (req, res) => TimeLogController.createTimeLog(req as any, res));

// Update time log
router.patch('/:id', (req, res) => TimeLogController.updateTimeLog(req as any, res));

// Delete time log
router.delete('/:id', (req, res) => TimeLogController.deleteTimeLog(req as any, res));

export default router;
