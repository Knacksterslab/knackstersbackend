/**
 * Public Content Routes
 * /api/public/content/*
 * No authentication required
 */

import { Router, Request, Response } from 'express';
import ContentService from '../../services/ContentService';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Get landing page hero / talent cards
 * Public endpoint - no auth required
 */
router.get('/landing-hero', async (_req: Request, res: Response): Promise<any> => {
  try {
    const content = await ContentService.getContent('landing-hero');
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get landing hero content failed', error);
    // Return null content on error so frontend can use fallback
    return ApiResponse.success(res, { content: null });
  }
});

export default router;
