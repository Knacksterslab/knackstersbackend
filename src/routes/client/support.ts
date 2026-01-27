import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { SupportTicketController } from '../../controllers/SupportTicketController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   POST /api/client/support/tickets
 * @desc    Create a new support ticket
 * @access  Private (Client)
 */
router.post(
  '/tickets',
  requireRole(UserRole.CLIENT),
  SupportTicketController.createTicket
);

/**
 * @route   GET /api/client/support/tickets
 * @desc    Get user's support tickets
 * @access  Private (Client)
 */
router.get(
  '/tickets',
  requireRole(UserRole.CLIENT),
  SupportTicketController.getUserTickets
);

/**
 * @route   GET /api/client/support/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private (Client)
 */
router.get(
  '/tickets/:id',
  requireRole(UserRole.CLIENT),
  SupportTicketController.getTicketById
);

/**
 * @route   GET /api/client/support/stats
 * @desc    Get user's ticket statistics
 * @access  Private (Client)
 */
router.get(
  '/stats',
  requireRole(UserRole.CLIENT),
  SupportTicketController.getTicketStats
);

export default router;
