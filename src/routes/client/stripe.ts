import { Router } from 'express';
import StripeController from '../../controllers/StripeController';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.CLIENT));

router.post('/setup-intent', (req, res) => StripeController.createSetupIntent(req as any, res));
router.post('/confirm-payment-method', (req, res) => StripeController.confirmPaymentMethod(req as any, res));
router.get('/payment-methods', (req, res) => StripeController.getPaymentMethods(req as any, res));
router.patch('/payment-methods/:paymentMethodId/default', (req, res) => StripeController.setDefaultPaymentMethod(req as any, res));
router.delete('/payment-methods/:paymentMethodId', (req, res) => StripeController.deletePaymentMethod(req as any, res));

// Subscription management
router.post('/subscribe', (req, res) => StripeController.subscribe(req as any, res));

export default router;
