/**
 * Client Notifications Routes
 * /api/client/notifications/*
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import NotificationController from '../../controllers/NotificationController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/', (req, res) => NotificationController.getNotifications(req as any, res));
router.get('/unread', (req, res) => NotificationController.getUnreadNotifications(req as any, res));
router.patch('/:id/read', (req, res) => NotificationController.markAsRead(req as any, res));
router.patch('/mark-all-read', (req, res) => NotificationController.markAllAsRead(req as any, res));
router.delete('/:id', (req, res) => NotificationController.deleteNotification(req as any, res));
router.get('/unread/count', (req, res) => NotificationController.getUnreadCount(req as any, res));

export default router;
