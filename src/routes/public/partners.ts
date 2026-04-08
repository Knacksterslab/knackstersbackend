/**
 * Public Partner Routes
 * /api/partners — no auth required, landing page consumption
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/partners — returns all active partners ordered by sortOrder
router.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    const partners = await prisma.partner.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        slug: true,
        name: true,
        logoUrl: true,
        logoUrlDark: true,
        websiteUrl: true,
        category: true,
      },
    });

    // Short cache header — CDN/browser can cache for 60s
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    return res.json({ partners });
  } catch (error: any) {
    logger.error('Failed to fetch public partners', error);
    return res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

export default router;
