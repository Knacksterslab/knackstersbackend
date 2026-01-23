/**
 * Client Notifications Routes
 * /api/client/notifications/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import NotificationController from '../../controllers/NotificationController';
import { UserRole } from '../../config/supertokens';

const router = Router();

// All routes require authentication AND client role
router.use(requireAuth);
router.use(requireRole(UserRole.CLIENT));

// Get all notifications
router.get('/', (req, res) => NotificationController.getNotifications(req as any, res));

// Get unread notifications only
router.get('/unread', (req, res) => NotificationController.getUnreadNotifications(req as any, res));

// Get unread count - MUST come before /:id routes
router.get('/count', (req, res) => NotificationController.getUnreadCount(req as any, res));

// Mark notification as read
router.patch('/:id/read', (req, res) => NotificationController.markAsRead(req as any, res));

// Mark all notifications as read
router.patch('/mark-all-read', (req, res) => NotificationController.markAllAsRead(req as any, res));

// Delete notification
router.delete('/:id', (req, res) => NotificationController.deleteNotification(req as any, res));

export default router;
