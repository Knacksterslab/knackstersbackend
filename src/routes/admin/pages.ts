/**
 * Admin Pages Content Routes
 * /api/admin/pages/*
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import ContentService from '../../services/ContentService';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

const router = Router();

// All routes require authentication and ADMIN role
router.use(requireAuth, requireRole(UserRole.ADMIN));

/**
 * FAQ Content
 */
router.get('/faq', async (_req: Request, res: Response): Promise<any> => {
  try {
    const content = await ContentService.getContent('faq');
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get FAQ content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to load FAQ content');
  }
});

router.put('/faq', async (req: Request, res: Response): Promise<any> => {
  try {
    await ContentService.updateContent('faq', req.body);
    return ApiResponse.success(res, { message: 'FAQ content updated successfully' });
  } catch (error: any) {
    logger.error('Update FAQ content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update FAQ content');
  }
});

/**
 * How It Works Content
 */
router.get('/how-it-works', async (_req: Request, res: Response): Promise<any> => {
  try {
    const content = await ContentService.getContent('how-it-works');
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get How It Works content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to load How It Works content');
  }
});

router.put('/how-it-works', async (req: Request, res: Response): Promise<any> => {
  try {
    await ContentService.updateContent('how-it-works', req.body);
    return ApiResponse.success(res, { message: 'How It Works content updated successfully' });
  } catch (error: any) {
    logger.error('Update How It Works content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update How It Works content');
  }
});

/**
 * Solutions Content (dynamic by slug)
 */
router.get('/solutions/:slug', async (req: Request, res: Response): Promise<any> => {
  try {
    const { slug } = req.params;
    const content = await ContentService.getContent(`solutions-${slug}`);
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get solution content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to load solution content');
  }
});

router.put('/solutions/:slug', async (req: Request, res: Response): Promise<any> => {
  try {
    const { slug } = req.params;
    await ContentService.updateContent(`solutions-${slug}`, req.body);
    return ApiResponse.success(res, { message: 'Solution content updated successfully' });
  } catch (error: any) {
    logger.error('Update solution content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update solution content');
  }
});

/**
 * Privacy Policy Content
 */
router.get('/privacy', async (_req: Request, res: Response): Promise<any> => {
  try {
    const content = await ContentService.getContent('privacy');
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get privacy content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to load privacy content');
  }
});

router.put('/privacy', async (req: Request, res: Response): Promise<any> => {
  try {
    await ContentService.updateContent('privacy', req.body);
    return ApiResponse.success(res, { message: 'Privacy policy updated successfully' });
  } catch (error: any) {
    logger.error('Update privacy content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update privacy content');
  }
});

/**
 * Terms of Service Content
 */
router.get('/terms', async (_req: Request, res: Response): Promise<any> => {
  try {
    const content = await ContentService.getContent('terms');
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    logger.error('Get terms content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to load terms content');
  }
});

router.put('/terms', async (req: Request, res: Response): Promise<any> => {
  try {
    await ContentService.updateContent('terms', req.body);
    return ApiResponse.success(res, { message: 'Terms of service updated successfully' });
  } catch (error: any) {
    logger.error('Update terms content failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update terms content');
  }
});

/**
 * List all available content pages
 */
router.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pages = await ContentService.listPages();
    return ApiResponse.success(res, { pages });
  } catch (error: any) {
    logger.error('List content pages failed', error);
    return ApiResponse.error(res, 'Failed to list content pages');
  }
});

export default router;
