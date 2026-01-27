import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { SearchController } from '../../controllers/SearchController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/client/search
 * @desc    Search across projects, tasks, and meetings
 * @access  Private (Client)
 * @query   q (required) - Search query string
 * @query   types (optional) - Comma-separated list: projects,tasks,meetings
 */
router.get(
  '/',
  requireRole(UserRole.CLIENT),
  SearchController.search
);

export default router;
