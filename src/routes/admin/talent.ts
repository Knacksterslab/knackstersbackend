/**
 * Admin Talent Routes
 * /api/admin/talent/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import TalentApplicationService from '../../services/TalentApplicationService';
import { ApiResponse } from '../../utils/response';
import { UserRole } from '../../config/supertokens';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { TalentApplicationStatus } from '@prisma/client';

const router = Router();

// Apply middleware
router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN));

/**
 * Get all talent applications
 * Supports filtering by status via query parameter
 */
router.get('/', async (req, res) => {
  try {
    const status = req.query.status as string;
    
    if (status && status !== 'ALL') {
      // Filter by specific status
      const applications = await prisma.talentProfile.findMany({
        where: { status: status as TalentApplicationStatus },
        orderBy: { createdAt: 'desc' },
      });
      return ApiResponse.success(res, applications);
    }
    
    // Get pending applications by default
    const applications = await TalentApplicationService.getPendingApplications();
    return ApiResponse.success(res, applications);
  } catch (error: any) {
    logger.error('Get talent applications failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch talent applications');
  }
});

/**
 * Get single talent application by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const profile = await prisma.talentProfile.findUnique({
      where: { id: req.params.id },
    });
    
    if (!profile) {
      return ApiResponse.error(res, 'Talent profile not found', 404);
    }
    
    return ApiResponse.success(res, profile);
  } catch (error: any) {
    logger.error('Get talent profile failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch talent profile');
  }
});

/**
 * Update talent application status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return ApiResponse.error(res, 'Status is required', 400);
    }
    
    const profile = await prisma.talentProfile.update({
      where: { id: req.params.id },
      data: { status: status as TalentApplicationStatus },
    });
    
    logger.info(`Talent profile ${req.params.id} status updated to ${status}`);
    return ApiResponse.success(res, profile);
  } catch (error: any) {
    logger.error('Update talent status failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update talent status');
  }
});

export default router;
