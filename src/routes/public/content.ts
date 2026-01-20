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
  // #region agent log
  const fs=require('fs');fs.appendFileSync('c:\\Users\\futur\\Projects\\Knacksters\\knackstersbackend\\.cursor\\debug.log',JSON.stringify({location:'content.ts:19',message:'landing-hero endpoint called',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})+'\n');
  // #endregion
  
  try {
    const content = await ContentService.getContent('landing-hero');
    
    // #region agent log
    const fs2=require('fs');fs2.appendFileSync('c:\\Users\\futur\\Projects\\Knacksters\\knackstersbackend\\.cursor\\debug.log',JSON.stringify({location:'content.ts:21',message:'Content retrieved from service',data:{content_is_null:content===null,has_talentCards:!!content?.talentCards,cards_count:content?.talentCards?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})+'\n');
    // #endregion
    
    return ApiResponse.success(res, { content });
  } catch (error: any) {
    // #region agent log
    const fs3=require('fs');fs3.appendFileSync('c:\\Users\\futur\\Projects\\Knacksters\\knackstersbackend\\.cursor\\debug.log',JSON.stringify({location:'content.ts:23',message:'Error getting content',data:{error_message:error.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})+'\n');
    // #endregion
    
    logger.error('Get landing hero content failed', error);
    // Return null content on error so frontend can use fallback
    return ApiResponse.success(res, { content: null });
  }
});

export default router;
