/**
 * Public Partner Routes
 * /api/partners — no auth required, landing page consumption
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { PUBLIC_CACHE_CONTROL } from '../../utils/response';

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

    res.setHeader('Cache-Control', PUBLIC_CACHE_CONTROL);

    return res.json({ partners });
  } catch (error: any) {
    logger.error('Failed to fetch public partners', error);
    return res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

export default router;
