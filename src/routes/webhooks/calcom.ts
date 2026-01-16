/**
 * Cal.com Webhook Routes
 * /api/webhooks/calcom/*
 */

import { Router } from 'express';
import CalComWebhookController from '../../controllers/CalComWebhookController';

const router = Router();

// Webhook endpoint for Cal.com events
router.post('/', (req, res) => CalComWebhookController.handleBooking(req, res));

export default router;
