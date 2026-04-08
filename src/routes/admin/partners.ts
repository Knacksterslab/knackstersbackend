/**
 * Admin Partner Routes
 * /api/admin/partners — full CRUD, admin-only
 */
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { ApiResponse } from '../../utils/response';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

const router = Router();

// GET — list all partners (admin sees active + inactive)
router.get('/', requireAuth, requireRole(UserRole.ADMIN), async (_req: Request, res: Response): Promise<any> => {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return res.json({ partners });
  } catch (error: any) {
    logger.error('Failed to fetch partners', error);
    return ApiResponse.error(res, 'Failed to fetch partners');
  }
});

// POST — create a new partner
router.post('/', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: slug, name, logoUrl, active, category, website } = req.body;

    if (!slug || !name || !logoUrl) {
      return res.status(400).json({ error: 'Missing required fields: id, name, logoUrl' });
    }

    const existing = await prisma.partner.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: 'Partner with this ID already exists' });
    }

    const partner = await prisma.partner.create({
      data: {
        slug,
        name,
        logoUrl,
        active: active !== undefined ? active : true,
        category: category || 'client',
        websiteUrl: website || null,
      },
    });

    logger.info(`Admin created partner: ${slug}`);
    return res.status(201).json({ partner: formatPartner(partner) });
  } catch (error: any) {
    logger.error('Failed to create partner', error);
    return ApiResponse.error(res, 'Failed to add partner');
  }
});

// PUT — update a partner
router.put('/:id', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: slug } = req.params;
    const { name, logoUrl, active, category, website } = req.body;

    const existing = await prisma.partner.findUnique({ where: { slug } });
    if (!existing) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const partner = await prisma.partner.update({
      where: { slug },
      data: {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(active !== undefined && { active }),
        ...(category !== undefined && { category }),
        ...(website !== undefined && { websiteUrl: website || null }),
      },
    });

    logger.info(`Admin updated partner: ${slug}`);
    return res.json({ partner: formatPartner(partner) });
  } catch (error: any) {
    logger.error('Failed to update partner', error);
    return ApiResponse.error(res, 'Failed to update partner');
  }
});

// DELETE — remove a partner
router.delete('/:id', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: slug } = req.params;

    const existing = await prisma.partner.findUnique({ where: { slug } });
    if (!existing) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    await prisma.partner.delete({ where: { slug } });

    logger.info(`Admin deleted partner: ${slug}`);
    return res.json({ message: 'Partner deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete partner', error);
    return ApiResponse.error(res, 'Failed to delete partner');
  }
});

// Map DB record to the shape the admin UI expects (id = slug for backwards compat)
function formatPartner(p: {
  slug: string; name: string; logoUrl: string; logoUrlDark: string | null;
  websiteUrl: string | null; category: string; active: boolean; sortOrder: number;
}) {
  return {
    id: p.slug,
    name: p.name,
    logoUrl: p.logoUrl,
    logoUrlDark: p.logoUrlDark,
    website: p.websiteUrl,
    category: p.category,
    active: p.active,
    sortOrder: p.sortOrder,
  };
}

export default router;
