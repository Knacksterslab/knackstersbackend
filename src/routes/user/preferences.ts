/**
 * User Preferences Routes
 * Routes for managing user preferences and onboarding tips
 */

import { Router } from 'express';
import UserPreferencesController from '../../controllers/UserPreferencesController';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get dismissed tips
router.get('/tips', UserPreferencesController.getDismissedTips);

// Dismiss a specific tip
router.post('/tips/dismiss', UserPreferencesController.dismissTip);

// Mark onboarding as complete
router.post('/onboarding/complete', UserPreferencesController.completeOnboarding);

// Reset all tips (for testing)
router.post('/tips/reset', UserPreferencesController.resetTips);

export default router;
