import { Router } from 'express';
import { ManagerController } from '../../controllers/ManagerController';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

// All routes require authentication and manager role
router.use(requireAuth);
router.use(requireRole('MANAGER' as any));

// Get pending onboarding clients
router.get('/pending-clients', ManagerController.getPendingOnboardingClients as any);

// Get client details for strategy call
router.get('/client/:userId', ManagerController.getClientDetails as any);

// Activate client subscription after strategy call
router.post('/activate-subscription', ManagerController.activateClientSubscription as any);

export default router;
