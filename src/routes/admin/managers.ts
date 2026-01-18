/**
 * Admin Manager Routes
 * /api/admin/managers/*
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';
import ManagerAssignmentService from '../../services/ManagerAssignmentService';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication and ADMIN role
router.use(requireAuth, requireRole(UserRole.ADMIN));

/**
 * Get all managers with their specializations and client counts
 */
router.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        specializations: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            managedClients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ApiResponse.success(res, { managers });
  } catch (error: any) {
    logger.error('Get managers failed', error);
    return ApiResponse.error(res, 'Failed to retrieve managers');
  }
});

/**
 * Update manager specializations
 */
router.patch('/:managerId/specializations', async (req: Request, res: Response): Promise<any> => {
  try {
    const { managerId } = req.params;
    const { specializations } = req.body;

    // Validate specializations
    if (!Array.isArray(specializations)) {
      return ApiResponse.error(res, 'Specializations must be an array', 400);
    }

    // Verify manager exists
    const manager = await prisma.user.findUnique({
      where: { id: managerId, role: 'MANAGER' },
    });

    if (!manager) {
      return ApiResponse.error(res, 'Manager not found', 404);
    }

    // Update specializations
    await prisma.user.update({
      where: { id: managerId },
      data: { specializations },
    });

    logger.info(`Manager ${managerId} specializations updated`);
    return ApiResponse.success(res, { message: 'Specializations updated successfully' });
  } catch (error: any) {
    logger.error('Update specializations failed', error);
    return ApiResponse.error(res, 'Failed to update specializations');
  }
});

/**
 * Get assignment statistics
 */
router.get('/stats', async (_req: Request, res: Response): Promise<any> => {
  try {
    const stats = await ManagerAssignmentService.getAssignmentStats();
    return ApiResponse.success(res, { stats });
  } catch (error: any) {
    logger.error('Get assignment stats failed', error);
    return ApiResponse.error(res, 'Failed to retrieve assignment statistics');
  }
});

/**
 * Bulk assign managers to unassigned clients
 */
router.post('/bulk-assign', async (_req: Request, res: Response): Promise<any> => {
  try {
    const result = await ManagerAssignmentService.bulkAssignUnassignedClients();
    return ApiResponse.success(res, result);
  } catch (error: any) {
    logger.error('Bulk assign failed', error);
    return ApiResponse.error(res, 'Failed to bulk assign managers');
  }
});

/**
 * Reassign client to different manager
 */
router.post('/reassign', async (req: Request, res: Response): Promise<any> => {
  try {
    const { clientId, newManagerId } = req.body;

    if (!clientId || !newManagerId) {
      return ApiResponse.error(res, 'clientId and newManagerId are required', 400);
    }

    await ManagerAssignmentService.reassignClient(clientId, newManagerId);
    return ApiResponse.success(res, { message: 'Client reassigned successfully' });
  } catch (error: any) {
    logger.error('Reassign client failed', error);
    return ApiResponse.error(res, error.message || 'Failed to reassign client');
  }
});

export default router;
