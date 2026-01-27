/**
 * Client Meetings Routes
 * /api/client/meetings/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import MeetingController from '../../controllers/MeetingController';
import { UserRole } from '../../config/supertokens';

const router = Router();

// All routes require authentication AND client role
router.use(requireAuth);
router.use(requireRole(UserRole.CLIENT));

router.get('/', (req, res) => MeetingController.getMeetings(req as any, res));
router.get('/:id', (req, res) => MeetingController.getMeeting(req as any, res));
router.post('/', (req, res) => MeetingController.scheduleMeeting(req as any, res));
router.post('/calcom-booking', (req, res) => MeetingController.saveCalcomBooking(req as any, res));
router.patch('/:id/reschedule', (req, res) => MeetingController.rescheduleMeeting(req as any, res));
router.delete('/:id/cancel', (req, res) => MeetingController.cancelMeeting(req as any, res)); // Changed to DELETE
router.patch('/:id/complete', (req, res) => MeetingController.completeMeeting(req as any, res));
router.get('/calendar', (req, res) => MeetingController.getCalendarView(req as any, res));
router.get('/slots/available', (req, res) => MeetingController.getAvailableSlots(req as any, res));

export default router;
