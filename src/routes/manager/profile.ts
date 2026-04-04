/**
 * Manager Profile Routes
 * /api/manager/profile/*
 * Self-service profile management for authenticated managers
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { uploadToStorage } from '../../config/supabase-storage';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();

// All routes require authentication AND manager role
router.use(requireAuth);
router.use(requireRole(UserRole.MANAGER));

// Multer — in-memory storage, images only, max 5 MB
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

/**
 * GET /api/manager/profile
 * Return the authenticated manager's own profile data
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) {
      return ApiResponse.error(res, 'Unauthorized', 401);
    }

    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        specializations: true,
        status: true,
        createdAt: true,
        _count: {
          select: { managedClients: true },
        },
      },
    });

    if (!manager) {
      return ApiResponse.error(res, 'Manager not found', 404);
    }

    return ApiResponse.success(res, { manager });
  } catch (error: any) {
    logger.error('Get manager profile failed', error);
    return ApiResponse.error(res, 'Failed to retrieve profile');
  }
});

/**
 * POST /api/manager/profile/avatar
 * Upload and set the authenticated manager's profile photo
 */
router.post(
  '/avatar',
  upload.single('file'),
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const managerId = req.userId;
      if (!managerId) {
        return ApiResponse.error(res, 'Unauthorized', 401);
      }

      if (!req.file) {
        return ApiResponse.error(res, 'No file provided', 400);
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

      logger.info(`Manager ${managerId} updated avatar: ${fileName}`);
      return ApiResponse.success(res, { avatarUrl: publicUrl });
    } catch (error: any) {
      logger.error('Manager avatar upload failed', error);
      return ApiResponse.error(res, error.message || 'Failed to upload avatar');
    }
  }
);

/**
 * DELETE /api/manager/profile/avatar
 * Remove the authenticated manager's profile photo (resets to null)
 */
router.delete('/avatar', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) {
      return ApiResponse.error(res, 'Unauthorized', 401);
    }

    await prisma.user.update({
      where: { id: managerId },
      data: { avatarUrl: null },
    });

    logger.info(`Manager ${managerId} removed avatar`);
    return ApiResponse.success(res, { message: 'Avatar removed' });
  } catch (error: any) {
    logger.error('Manager avatar removal failed', error);
    return ApiResponse.error(res, 'Failed to remove avatar');
  }
});

export default router;
