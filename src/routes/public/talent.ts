/**
 * Public Talent Application Routes
 * /api/public/talent/*
 * No authentication required
 */

import { Router } from 'express';
import TalentApplicationController from '../../controllers/TalentApplicationController';

const router = Router();

// Submit talent application
router.post('/apply', (req, res) => TalentApplicationController.submitApplication(req, res));

// Schedule meeting
router.post('/schedule', (req, res) => TalentApplicationController.scheduleMeeting(req, res));

export default router;
