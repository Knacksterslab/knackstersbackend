/**
 * Admin Dashboard Routes
 * /api/admin/*
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import AdminController from '../../controllers/AdminController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/stats', (req, res) => AdminController.getPlatformStats(req as any, res));
router.get('/users', (req, res) => AdminController.getUsers(req as any, res));
router.get('/users/:userId', (req, res) => AdminController.getUserDetails(req as any, res));
router.patch('/users/:userId', (req, res) => AdminController.updateUser(req as any, res));
router.delete('/users/:userId', (req, res) => AdminController.deleteUser(req as any, res));
router.get('/activities', (req, res) => AdminController.getActivityLogs(req as any, res));

export default router;
