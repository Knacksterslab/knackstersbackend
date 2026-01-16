import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

router.get('/session', requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.session) return ApiResponse.unauthorized(res);

    const userId = await req.session.getUserId();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true, avatarUrl: true },
    });

    if (!user) return ApiResponse.notFound(res, 'User');

    return ApiResponse.success(res, user);
  } catch (error: any) {
    logger.error('Session check failed', error);
    return ApiResponse.error(res, 'Failed to get session');
  }
});

export default router;
