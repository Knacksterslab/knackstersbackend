/**
 * Manager Dashboard Routes
 * /api/manager/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { ManagerController } from '../../controllers/ManagerController';
import { UserRole } from '../../config/supertokens';

const router = Router();

// All routes require authentication AND manager role
router.use(requireAuth);
router.use(requireRole(UserRole.MANAGER)); // Strict tenant isolation

// Dashboard routes (using 'as any' to work around TypeScript static method type inference issues)
router.get('/dashboard', ManagerController.getDashboard as any);
router.get('/clients', ManagerController.getClients as any);
router.get('/clients/:clientId', ManagerController.getClientDetails as any);
router.get('/projects', ManagerController.getProjects as any);
router.get('/tasks', ManagerController.getTasks as any);
router.get('/stats', ManagerController.getStats as any);
router.get('/talent', ManagerController.getAvailableTalent as any);

export default router;
