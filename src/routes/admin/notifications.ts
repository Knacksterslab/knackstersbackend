/**
 * Admin Notification Routes
 * /api/admin/notifications/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import NotificationController from '../../controllers/NotificationController';
import { UserRole } from '../../config/supertokens';

const router = Router();

// Apply middleware
router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN));

// Get all notifications
router.get('/', (req, res) => NotificationController.getNotifications(req, res));

// Get unread notifications only
router.get('/unread', (req, res) => NotificationController.getUnreadNotifications(req, res));

// Get unread count
router.get('/count', (req, res) => NotificationController.getUnreadCount(req, res));

// Mark notification as read
router.patch('/:id/read', (req, res) => NotificationController.markAsRead(req, res));

// Mark all notifications as read
router.patch('/read-all', (req, res) => NotificationController.markAllAsRead(req, res));

// Delete notification
router.delete('/:id', (req, res) => NotificationController.deleteNotification(req, res));

export default router;
