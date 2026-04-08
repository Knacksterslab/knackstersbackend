import prisma from '../lib/prisma';
import { TicketStatus } from '@prisma/client';
import { sendAdminNewSupportTicketEmail, sendClientTicketReplyEmail } from './EmailService';
import NotificationService from './NotificationService';
import { logger } from '../utils/logger';

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

    // Fire-and-forget: email admin + notify all admins + notify CSM in-app
    try {
      // Notify the client's assigned CSM (account manager) if they have one
      if (ticket.user) {
        prisma.user.findUnique({
          where: { id: data.userId },
          select: { accountManagerId: true, fullName: true, email: true },
        }).then(client => {
          if (client?.accountManagerId) {
            NotificationService.createNotification({
              userId: client.accountManagerId,
              type: 'INFO',
              title: `Support ticket from ${client.fullName || client.email}`,
              message: `Your client "${client.fullName || client.email}" submitted a support ticket: "${data.subject}"`,
              actionUrl: `/admin-dashboard/support`,
              actionLabel: 'View Ticket',
            }).catch(err => logger.error('CSM support ticket notification failed', err));
          }
        }).catch(err => logger.error('Failed to fetch client for CSM notification', err));
      }

      sendAdminNewSupportTicketEmail({
        ticketNumber,
        clientName: ticket.user.fullName || ticket.user.email,
        clientEmail: ticket.user.email,
        subject: data.subject,
        category: data.category,
        priority: data.priority || 'NORMAL',
        description: data.description,
      }).catch(err => logger.error('Admin support ticket email failed', err));

      prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
        .then(admins =>
          Promise.all(admins.map(admin =>
            NotificationService.createNotification({
              userId: admin.id,
              type: 'WARNING',
              title: `New Support Ticket: ${ticketNumber}`,
              message: `${ticket.user.fullName || ticket.user.email} submitted: "${data.subject}"`,
              actionUrl: `/admin-dashboard/support/${ticket.id}`,
              actionLabel: 'View Ticket',
            })
          ))
        )
        .catch(err => logger.error('Admin support ticket notification failed', err));
    } catch (err) {
      logger.error('Post-ticket notification setup failed', err);
    }

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
   * Send a reply to the client and optionally update ticket status
   */
  async replyToTicket(ticketId: string, adminId: string, replyMessage: string, status?: TicketStatus) {
    const updateData: any = {
      lastReply: replyMessage,
      repliedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = adminId;
      }
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    // Email the client
    sendClientTicketReplyEmail({
      ticketNumber: ticket.ticketNumber,
      clientName: ticket.user.fullName || ticket.user.email,
      clientEmail: ticket.user.email,
      subject: ticket.subject,
      replyMessage,
      status: ticket.status,
    }).catch(err => logger.error('Client ticket reply email failed', err));

    // In-app notification to client
    NotificationService.createNotification({
      userId: ticket.user.id,
      type: 'INFO',
      title: `Support reply: ${ticket.ticketNumber}`,
      message: `Your support ticket "${ticket.subject}" has a new reply.`,
      actionUrl: '/support',
      actionLabel: 'View Ticket',
    }).catch(err => logger.error('Client ticket reply notification failed', err));

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
