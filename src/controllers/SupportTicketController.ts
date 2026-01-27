import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SupportTicketService from '../services/SupportTicketService';
import { successResponse, errorResponse } from '../utils/response';

export class SupportTicketController {
  /**
   * Create a new support ticket
   */
  static async createTicket(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const { subject, description, category, priority } = req.body;

      if (!subject || !description) {
        return errorResponse(res, 'Subject and description are required', 400);
      }

      // Validate priority if provided
      const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      if (priority && !validPriorities.includes(priority.toUpperCase())) {
        return errorResponse(res, 'Invalid priority value', 400);
      }

      const ticket = await SupportTicketService.createTicket({
        userId,
        subject,
        description,
        category,
        priority: priority?.toUpperCase(),
      });

      return successResponse(res, ticket, 'Support ticket created successfully', 201);
    } catch (error: any) {
      console.error('Create ticket error:', error);
      return errorResponse(res, error.message || 'Failed to create support ticket');
    }
  }

  /**
   * Get user's support tickets
   */
  static async getUserTickets(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const { status } = req.query;
      const tickets = await SupportTicketService.getUserTickets(
        userId,
        status as any
      );

      return successResponse(res, tickets);
    } catch (error: any) {
      console.error('Get tickets error:', error);
      return errorResponse(res, error.message || 'Failed to fetch support tickets');
    }
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const { id } = req.params;
      const ticket = await SupportTicketService.getTicketById(id, userId);

      if (!ticket) {
        return errorResponse(res, 'Ticket not found', 404);
      }

      return successResponse(res, ticket);
    } catch (error: any) {
      console.error('Get ticket error:', error);
      return errorResponse(res, error.message || 'Failed to fetch ticket');
    }
  }

  /**
   * Get user's ticket statistics
   */
  static async getTicketStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const stats = await SupportTicketService.getUserTicketStats(userId);
      return successResponse(res, stats);
    } catch (error: any) {
      console.error('Get ticket stats error:', error);
      return errorResponse(res, error.message || 'Failed to fetch ticket statistics');
    }
  }
}
