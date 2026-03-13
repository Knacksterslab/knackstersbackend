import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { SolutionType } from '@prisma/client';
import ManagerAssignmentService from '../services/ManagerAssignmentService';
import { sendClientWelcomeEmail, sendAdminNewClientAlert } from '../services/EmailService';

const router = Router();

router.get('/session', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.session) return ApiResponse.unauthorized(res);

    const userId = await req.session.getUserId();
    
    const [user, meetingCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true, avatarUrl: true, selectedSolution: true },
      }),
      prisma.meeting.count({ where: { clientId: userId } }),
    ]);

    if (!user) return ApiResponse.notFound(res, 'User');

    return ApiResponse.success(res, { ...user, hasMeeting: meetingCount > 0 });
  } catch (error: any) {
    logger.error('Session check failed', error);
    return ApiResponse.error(res, 'Failed to get session');
  }
});

// Save solution selection for Google sign-up users who skipped onboarding
router.patch('/onboarding', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.session) return ApiResponse.unauthorized(res);

    const userId = await req.session.getUserId();
    const { selectedSolution, solutionNotes } = req.body;

    if (!selectedSolution) {
      return ApiResponse.error(res, 'selectedSolution is required', 400);
    }

    // Read before updating so we can detect first-time Google onboarding.
    // Email/password users always have selectedSolution set at signup, so
    // previousSolution will only be null for Google users arriving here fresh.
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true, selectedSolution: true, accountManagerId: true },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        selectedSolution: selectedSolution as SolutionType,
        selectedSolutionNotes: solutionNotes || null,
      },
      select: { selectedSolution: true },
    });

    // Send welcome + admin alert only for Google users completing onboarding for
    // the first time (selectedSolution was null before this request).
    if (!existingUser?.selectedSolution && existingUser?.email) {
      sendClientWelcomeEmail({
        fullName: existingUser.fullName || 'there',
        email: existingUser.email,
        selectedSolution,
      }).catch((err) => logger.error('Welcome email failed during onboarding', err));

      sendAdminNewClientAlert({
        fullName: existingUser.fullName || 'Unknown',
        email: existingUser.email,
        selectedSolution,
      }).catch((err) => logger.error('Admin alert failed during onboarding', err));
    }

    // Assign manager if not already assigned
    if (!existingUser?.accountManagerId) {
      ManagerAssignmentService.assignManagerToClient(userId, selectedSolution as SolutionType)
        .then((managerId) => {
          if (managerId) logger.info(`Manager ${managerId} assigned after onboarding for ${userId}`);
        })
        .catch((err) => logger.error('Manager assignment failed during onboarding', err));
    }

    return ApiResponse.success(res, { selectedSolution: updatedUser.selectedSolution });
  } catch (error: any) {
    logger.error('Onboarding save failed', error);
    return ApiResponse.error(res, 'Failed to save onboarding data');
  }
});

export default router;
