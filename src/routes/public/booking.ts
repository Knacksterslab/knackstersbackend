/**
 * Public Booking Routes
 * /api/public/booking/*
 * For fetching booking details without authentication
 */

import { Router } from 'express';
import CalComWebhookController from '../../controllers/CalComWebhookController';

const router = Router();

// Get booking details by profile ID
router.get('/:profileId', (req, res) => CalComWebhookController.getBookingDetails(req, res));

export default router;
