/**
 * Manager Support Ticket Routes
 * /api/manager/support/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { SupportTicketController } from '../../controllers/SupportTicketController';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.MANAGER));

/**
 * @route   POST /api/manager/support/tickets
 * @desc    Create a new support ticket
 * @access  Private (Manager)
 */
router.post('/tickets', SupportTicketController.createTicket);

/**
 * @route   GET /api/manager/support/tickets
 * @desc    Get manager's support tickets
 * @access  Private (Manager)
 */
router.get('/tickets', SupportTicketController.getUserTickets);

/**
 * @route   GET /api/manager/support/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private (Manager)
 */
router.get('/tickets/:id', SupportTicketController.getTicketById);

/**
 * @route   GET /api/manager/support/stats
 * @desc    Get manager's ticket statistics
 * @access  Private (Manager)
 */
router.get('/stats', SupportTicketController.getTicketStats);

export default router;
