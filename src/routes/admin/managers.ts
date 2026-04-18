/**
 * Admin Manager Routes
 * /api/admin/managers/*
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import ManagerAssignmentService from '../../services/ManagerAssignmentService';
import { uploadToStorage } from '../../config/supabase-storage';

const router = Router();

// Multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (valid.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Use PNG, JPG, or WebP.'));
    }
  },
});

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
 * Upload / replace a manager's avatar (admin override)
 * POST /api/admin/managers/:managerId/avatar
 */
router.post('/:managerId/avatar', upload.single('file'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { managerId } = req.params;

    if (!req.file) {
      return ApiResponse.error(res, 'No file provided', 400);
    }

    const manager = await prisma.user.findUnique({
      where: { id: managerId, role: 'MANAGER' },
    });

    if (!manager) {
      return ApiResponse.error(res, 'Manager not found', 404);
    }

    const originalName = req.file.originalname.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const fileName = `${managerId}-${Date.now()}-${originalName}`;

    const publicUrl = await uploadToStorage(
      'manager-avatars',
      fileName,
      req.file.buffer,
      req.file.mimetype
    );

    await prisma.user.update({
      where: { id: managerId },
      data: { avatarUrl: publicUrl },
    });

    logger.info(`Admin updated avatar for manager ${managerId}`);
    return ApiResponse.success(res, { avatarUrl: publicUrl });
  } catch (error: any) {
    logger.error('Admin manager avatar upload failed', error);
    return ApiResponse.error(res, error.message || 'Failed to upload avatar');
  }
});

/**
 * Remove a manager's avatar (admin override)
 * DELETE /api/admin/managers/:managerId/avatar
 */
router.delete('/:managerId/avatar', async (req: Request, res: Response): Promise<any> => {
  try {
    const { managerId } = req.params;

    const manager = await prisma.user.findUnique({
      where: { id: managerId, role: 'MANAGER' },
    });

    if (!manager) {
      return ApiResponse.error(res, 'Manager not found', 404);
    }

    await prisma.user.update({
      where: { id: managerId },
      data: { avatarUrl: null },
    });

    logger.info(`Admin removed avatar for manager ${managerId}`);
    return ApiResponse.success(res, { message: 'Avatar removed' });
  } catch (error: any) {
    logger.error('Admin manager avatar removal failed', error);
    return ApiResponse.error(res, 'Failed to remove avatar');
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
