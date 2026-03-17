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
