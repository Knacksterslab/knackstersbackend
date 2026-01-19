/**
 * Client Billing Routes
 * /api/client/billing/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import BillingController from '../../controllers/BillingController';

const router = Router();

// All routes require authentication AND client role
router.use(requireAuth);
router.use(requireRole('CLIENT'));

router.get('/summary', (req, res) => BillingController.getBillingSummary(req as any, res));
router.get('/invoices', (req, res) => BillingController.getInvoices(req as any, res));
router.get('/invoices/:id', (req, res) => BillingController.getInvoice(req as any, res));
router.post('/extra-hours', (req, res) => BillingController.purchaseExtraHours(req as any, res));
router.get('/invoices/:id/download', (req, res) => BillingController.downloadInvoice(req as any, res));
router.get('/history', (req, res) => BillingController.getPaymentHistory(req as any, res));
router.get('/subscription', (req, res) => BillingController.getSubscription(req as any, res));
router.post('/subscription/upgrade', (req, res) => BillingController.upgradeSubscription(req as any, res));
router.post('/subscription/cancel', (req, res) => BillingController.cancelSubscription(req as any, res));

export default router;
