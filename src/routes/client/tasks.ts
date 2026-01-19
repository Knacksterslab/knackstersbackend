/**
 * Client Tasks Routes
 * /api/client/tasks/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import TaskController from '../../controllers/TaskController';
import { UserRole } from '../../config/supertokens';

const router = Router();

// All routes require authentication AND client role
router.use(requireAuth);
router.use(requireRole(UserRole.CLIENT));

router.get('/', (req, res) => TaskController.getTasks(req as any, res));
router.post('/', (req, res) => TaskController.createTask(req as any, res));
router.get('/:id', (req, res) => TaskController.getTask(req as any, res));
router.patch('/:id', (req, res) => TaskController.updateTask(req as any, res));
router.delete('/:id', (req, res) => TaskController.deleteTask(req as any, res));
router.patch('/:id/assign', (req, res) => TaskController.assignTask(req as any, res));
router.get('/:projectId/stats', (req, res) => TaskController.getTaskStats(req as any, res));

export default router;
