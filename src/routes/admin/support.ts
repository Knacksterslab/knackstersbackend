/**
 * Admin Support Ticket Routes
 * /api/admin/support/*
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { prisma } from '../../lib/prisma';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN));

// GET /api/admin/support/tickets — list all tickets
router.get('/tickets', async (req, res) => {
  try {
    const { status, priority, search } = req.query as Record<string, string>;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ApiResponse.success(res, { tickets });
  } catch (error: any) {
    logger.error('Admin getTickets failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch tickets');
  }
});

// GET /api/admin/support/tickets/:id — get single ticket
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true, companyName: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, title: true, projectNumber: true } },
        task: { select: { id: true, name: true, taskNumber: true } },
      },
    });

    if (!ticket) return ApiResponse.notFound(res, 'Ticket');
    return ApiResponse.success(res, { ticket });
  } catch (error: any) {
    logger.error('Admin getTicket failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch ticket');
  }
});

// PATCH /api/admin/support/tickets/:id — update status / assign / add notes
router.patch('/tickets/:id', async (req, res) => {
  try {
    const { status, assignedToId, resolutionNotes } = req.body;
    const updateData: any = {};

    if (status) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = (req as any).userId;
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    return ApiResponse.success(res, { ticket });
  } catch (error: any) {
    logger.error('Admin updateTicket failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update ticket');
  }
});

// GET /api/admin/support/stats — aggregate counts
router.get('/stats', async (_req, res) => {
  try {
    const [total, open, inProgress, resolved, urgent] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    return ApiResponse.success(res, { total, open, inProgress, resolved, urgent });
  } catch (error: any) {
    logger.error('Admin support stats failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch stats');
  }
});

export default router;
