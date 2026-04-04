/**
 * Admin User Service
 * Admin operations for user management
 */

import { prisma } from '../lib/prisma';
import { UserRole, UserStatus, SolutionType } from '@prisma/client';
import { signUp, createResetPasswordToken } from 'supertokens-node/recipe/emailpassword';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { sendAdminInviteEmail } from './EmailService';

export class AdminUserService {
  /**
   * Get all users with filters
   */
  async getAllUsers(filters?: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            select: {
              plan: true,
              status: true,
            },
            take: 1,
          },
          _count: {
            select: {
              clientProjects: true,
              assignedTasks: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      hasMore: total > (filters?.offset || 0) + users.length,
    };
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        hoursBalances: {
          where: {
            periodEnd: {
              gte: new Date(),
            },
          },
          take: 1,
        },
        clientProjects: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        assignedTasks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            clientProjects: true,
            assignedTasks: true,
            notifications: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: {
      fullName?: string;
      companyName?: string;
      phone?: string;
      status?: UserStatus;
      role?: UserRole;
      accountManagerId?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Delete user (soft delete by setting status)
   */
  async deleteUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
      },
    });
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
    ]);

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole.map((item) => ({
          role: item.role,
          count: item._count.role,
        })),
        recentSignups,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
      },
      revenue: {
        total: Number(totalRevenue._sum?.total || 0),
      },
    };
  }

  /**
   * Create new user (ADMIN, MANAGER, or TALENT only).
   * No password is set by the admin — a secure invite link is emailed to the
   * new user so they set their own password on first login.
   */
  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MANAGER' | 'TALENT';
    specializations?: string[];
  }) {
    // Validate role - only allow ADMIN, MANAGER, TALENT creation
    if (!['ADMIN', 'MANAGER', 'TALENT'].includes(data.role)) {
      throw new Error('Invalid role. Only ADMIN, MANAGER, and TALENT users can be created by admins.');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // STEP 1: Create SuperTokens account with a random temp password the user
    //         will never know — they'll set their own via the invite link.
    const tempPassword = crypto.randomBytes(32).toString('hex');
    let supertokensUserId: string;

    try {
      const supertokensResponse = await signUp('public', data.email.toLowerCase(), tempPassword);

      if (supertokensResponse.status !== 'OK') {
        if (supertokensResponse.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
          throw new Error('Email already exists in authentication system');
        }
        throw new Error('Failed to create authentication account');
      }

      supertokensUserId = supertokensResponse.user.id;
      logger.info(`SuperTokens account created with ID: ${supertokensUserId} for ${data.email}`);
    } catch (error: any) {
      logger.error('Failed to create SuperTokens account', error);
      throw new Error(`Authentication account creation failed: ${error.message}`);
    }

    // STEP 2: Create Prisma user with the SuperTokens ID
    let user;
    try {
      user = await prisma.user.create({
        data: {
          id: supertokensUserId,
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName} ${data.lastName}`,
          role: data.role as UserRole,
          status: 'ACTIVE',
          specializations: (data.specializations || []) as SolutionType[],
          avatarUrl: null,
        },
      });

      logger.info(`Prisma user created with matching ID: ${user.id} for ${data.email}`);
    } catch (error: any) {
      logger.error('Failed to create Prisma user', error);
      throw new Error(`Database user creation failed: ${error.message}`);
    }

    // STEP 3: Generate a password-reset token and send it as an invite email.
    //         The new user clicks "Set Your Password" and never needs to know
    //         the random temp password created above.
    try {
      const tokenResponse = await createResetPasswordToken('public', supertokensUserId, data.email.toLowerCase());

      if (tokenResponse.status !== 'OK') {
        throw new Error('Failed to generate invite token');
      }

      const websiteDomain = process.env.WEBSITE_DOMAIN || 'https://www.knacksters.co';
      const inviteLink = `${websiteDomain}/auth/reset-password?token=${tokenResponse.token}&rid=emailpassword`;

      await sendAdminInviteEmail({
        firstName: data.firstName,
        email: data.email.toLowerCase(),
        role: data.role,
        inviteLink,
      });
    } catch (error: any) {
      // Don't fail the whole creation if the email send fails — the admin can
      // trigger a password reset manually as a fallback.
      logger.error('Failed to send invite email', error);
    }

    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  async toggleUserStatus(userId: string, active: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        status: active ? 'ACTIVE' : 'INACTIVE',
      },
    });
  }

  /**
   * Assign account manager to client
   */
  async assignAccountManager(clientId: string, managerId: string) {
    // Verify manager role
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { role: true },
    });

    if (!manager || manager.role !== 'MANAGER') {
      throw new Error('Invalid manager ID');
    }

    return prisma.user.update({
      where: { id: clientId },
      data: {
        accountManagerId: managerId,
      },
    });
  }
}

export default new AdminUserService();
