/**
 * Public Content Routes
 * /api/public/content/*
 * No authentication required
 */

import { Router, Request, Response } from 'express';
import ContentService from '../../services/ContentService';
import { ApiResponse, PUBLIC_CACHE_CONTROL } from '../../utils/response';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Get social proof metrics and testimonials (manually managed via admin dashboard)
 * Public endpoint - no auth required
 */
router.get('/social-proof', async (_req: Request, res: Response): Promise<any> => {
  try {
    const content = await ContentService.getContent('social-proof');
    if (!content) {
      return res.status(404).json({ error: 'Social proof content not configured' });
    }
    res.setHeader('Cache-Control', PUBLIC_CACHE_CONTROL);
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get social-proof content failed', error);
    return ApiResponse.error(res, 'Failed to load social proof content', 500);
  }
});

/**
 * Get landing page hero / talent cards
 * Public endpoint - no auth required
 */
router.get('/landing-hero', async (_req: Request, res: Response): Promise<any> => {
  const startedAt = Date.now();
  try {
    logger.info('Public landing-hero request started');
    const content = await ContentService.getContent('landing-hero');
    const hasTalentCards = Array.isArray(content?.talentCards);
    const talentCardsCount = hasTalentCards ? content.talentCards.length : 0;

    if (!content || !hasTalentCards || talentCardsCount === 0) {
      logger.warn('Public landing-hero content missing or invalid', {
        hasContent: !!content,
        hasTalentCards,
        talentCardsCount,
        durationMs: Date.now() - startedAt,
      });
      return ApiResponse.error(res, 'Landing hero content is not configured', 404);
    }

    logger.info('Public landing-hero request succeeded', {
      hasContent: !!content,
      hasTalentCards,
      talentCardsCount,
      durationMs: Date.now() - startedAt,
    });
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get landing hero content failed', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      durationMs: Date.now() - startedAt,
    });
    return ApiResponse.error(res, 'Failed to load landing hero content', 500);
  }
});

export default router;
