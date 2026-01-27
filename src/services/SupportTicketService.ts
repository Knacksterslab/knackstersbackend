import prisma from '../lib/prisma';
import { TicketStatus } from '@prisma/client';

interface CreateTicketData {
  userId: string;
  subject: string;
  description: string;
  category?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface UpdateTicketData {
  status?: TicketStatus;
  assignedToId?: string;
  resolutionNotes?: string;
}

class SupportTicketService {
  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateTicketData) {
    // Generate ticket number
    const count = await prisma.supportTicket.count();
    const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;

    // Add category to description if provided
    const fullDescription = data.category
      ? `[Category: ${data.category.toUpperCase()}]\n\n${data.description}`
      : data.description;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: data.userId,
        subject: data.subject,
        description: fullDescription,
        priority: data.priority || 'NORMAL',
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return ticket;
  }

  /**
   * Get user's support tickets
   */
  async getUserTickets(userId: string, status?: TicketStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets;
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string, userId: string) {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId, // Ensure user can only access their own tickets
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            projectNumber: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
            taskNumber: true,
          },
        },
      },
    });

    return ticket;
  }

  /**
   * Update ticket (for admin/manager use)
   */
  async updateTicket(ticketId: string, data: UpdateTicketData) {
    const updateData: any = { ...data };

    if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return ticket;
  }

  /**
   * Get ticket statistics for user
   */
  async getUserTicketStats(userId: string) {
    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.supportTicket.count({ where: { userId } }),
      prisma.supportTicket.count({ where: { userId, status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { userId, status: 'RESOLVED' } }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
    };
  }
}

export default new SupportTicketService();
