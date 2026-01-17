/**
 * Admin Dashboard Routes
 * /api/admin/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import AdminController from '../../controllers/AdminController';
import { UserRole } from '../../config/supertokens';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/stats', (req, res) => AdminController.getPlatformStats(req as any, res));
router.get('/users', (req, res) => AdminController.getUsers(req as any, res));
router.post('/users', requireRole(UserRole.ADMIN), (req, res) => AdminController.createUser(req as any, res));
router.get('/users/:userId', (req, res) => AdminController.getUserDetails(req as any, res));
router.patch('/users/:userId', (req, res) => AdminController.updateUser(req as any, res));
router.patch('/users/:userId/role', requireRole(UserRole.ADMIN), (req, res) => AdminController.updateUserRole(req as any, res));
router.patch('/users/:userId/status', requireRole(UserRole.ADMIN), (req, res) => AdminController.toggleUserStatus(req as any, res));
router.delete('/users/:userId', (req, res) => AdminController.deleteUser(req as any, res));
router.get('/activities', (req, res) => AdminController.getActivityLogs(req as any, res));

export default router;
