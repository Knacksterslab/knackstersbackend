/**
 * Client Projects Routes
 * /api/client/projects/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import ProjectController from '../../controllers/ProjectController';
import TaskController from '../../controllers/TaskController';
import { UserRole } from '../../config/supertokens';

const router = Router();

// All routes require authentication AND client role
router.use(requireAuth);
router.use(requireRole(UserRole.CLIENT));

router.get('/', (req, res) => ProjectController.getProjects(req as any, res));
router.post('/', (req, res) => ProjectController.createProject(req as any, res));
router.get('/:id', (req, res) => ProjectController.getProject(req as any, res));
router.patch('/:id', (req, res) => ProjectController.updateProject(req as any, res));
router.delete('/:id', (req, res) => ProjectController.deleteProject(req as any, res));
router.get('/:id/stats', (req, res) => ProjectController.getProjectStats(req as any, res));
router.get('/:projectId/tasks', (req, res) => TaskController.getProjectTasks(req as any, res));

export default router;
