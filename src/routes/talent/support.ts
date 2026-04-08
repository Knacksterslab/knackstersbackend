/**
 * Talent Support Ticket Routes
 * /api/talent/support/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { SupportTicketController } from '../../controllers/SupportTicketController';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.TALENT));

/**
 * @route   POST /api/talent/support/tickets
 * @desc    Create a new support ticket
 * @access  Private (Talent)
 */
router.post('/tickets', SupportTicketController.createTicket);

/**
 * @route   GET /api/talent/support/tickets
 * @desc    Get talent's support tickets
 * @access  Private (Talent)
 */
router.get('/tickets', SupportTicketController.getUserTickets);

/**
 * @route   GET /api/talent/support/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private (Talent)
 */
router.get('/tickets/:id', SupportTicketController.getTicketById);

/**
 * @route   GET /api/talent/support/stats
 * @desc    Get talent's ticket statistics
 * @access  Private (Talent)
 */
router.get('/stats', SupportTicketController.getTicketStats);

export default router;
