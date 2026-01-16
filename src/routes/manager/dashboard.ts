/**
 * Manager Dashboard Routes
 * /api/manager/*
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { ManagerController } from '../../controllers/ManagerController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Dashboard routes (using 'as any' to work around TypeScript static method type inference issues)
router.get('/dashboard', ManagerController.getDashboard as any);
router.get('/clients', ManagerController.getClients as any);
router.get('/clients/:clientId', ManagerController.getClientDetails as any);
router.get('/projects', ManagerController.getProjects as any);
router.get('/tasks', ManagerController.getTasks as any);
router.get('/stats', ManagerController.getStats as any);
router.get('/talent', ManagerController.getAvailableTalent as any);

export default router;
