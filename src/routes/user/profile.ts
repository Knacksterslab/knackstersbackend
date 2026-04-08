/**
 * Shared User Profile Routes
 * /api/user/profile/*
 *
 * Works for any authenticated role (CLIENT, ADMIN, MANAGER, TALENT).
 * Single source of truth for profile read/write and avatar upload.
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth';
import { uploadToStorage } from '../../config/supabase-storage';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();

router.use(requireAuth);

// Multer — in-memory, images only, max 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    cb(null, valid.includes(file.mimetype) as any);
  },
});

/**
 * GET /api/user/profile
 * Returns the authenticated user's own profile.
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    if (!userId) return ApiResponse.error(res, 'Unauthorized', 401);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        avatarUrl: true,
        role: true,
        status: true,
        bio: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) return ApiResponse.error(res, 'User not found', 404);
    return ApiResponse.success(res, { profile: user });
  } catch (error: any) {
    logger.error('GET /api/user/profile failed', error);
    return ApiResponse.error(res, 'Failed to fetch profile');
  }
});

/**
 * PATCH /api/user/profile
 * Updates the authenticated user's editable profile fields.
 * Each role sees the same fields; role-specific fields (e.g. specializations)
 * are managed through their dedicated endpoints.
 */
router.patch('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    if (!userId) return ApiResponse.error(res, 'Unauthorized', 401);

    const { fullName, firstName, lastName, phone, companyName, bio, timezone } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(companyName !== undefined && { companyName }),
        ...(bio !== undefined && { bio }),
        ...(timezone !== undefined && { timezone }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        avatarUrl: true,
        role: true,
        bio: true,
        timezone: true,
      },
    });

    logger.info(`User ${userId} updated their profile`);
    return ApiResponse.success(res, { profile: updated, message: 'Profile updated successfully' });
  } catch (error: any) {
    logger.error('PATCH /api/user/profile failed', error);
    return ApiResponse.error(res, 'Failed to update profile');
  }
});

/**
 * POST /api/user/profile/avatar
 * Uploads the authenticated user's avatar (any role).
 * Uses the manager-avatars bucket (already public).
 */
router.post(
  '/avatar',
  upload.single('file'),
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.userId;
      if (!userId) return ApiResponse.error(res, 'Unauthorized', 401);
      if (!req.file) return ApiResponse.error(res, 'No file provided', 400);

      const fileName = `${userId}-${Date.now()}.jpg`;

      const publicUrl = await uploadToStorage(
        'manager-avatars',
        fileName,
        req.file.buffer,
        req.file.mimetype
      );

      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: publicUrl },
      });

      logger.info(`User ${userId} uploaded avatar`);
      return ApiResponse.success(res, { avatarUrl: publicUrl });
    } catch (error: any) {
      logger.error('POST /api/user/profile/avatar failed', error);
      return ApiResponse.error(res, error.message || 'Failed to upload avatar');
    }
  }
);

/**
 * DELETE /api/user/profile/avatar
 * Removes the authenticated user's avatar (sets to null).
 */
router.delete('/avatar', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    if (!userId) return ApiResponse.error(res, 'Unauthorized', 401);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    logger.info(`User ${userId} removed avatar`);
    return ApiResponse.success(res, { message: 'Avatar removed' });
  } catch (error: any) {
    logger.error('DELETE /api/user/profile/avatar failed', error);
    return ApiResponse.error(res, 'Failed to remove avatar');
  }
});

export default router;
