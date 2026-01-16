/**
 * User Service
 * Handles user-related business logic
 */

import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';
import { UpdateUserInput } from '../validation/schemas';

export class UserService {
  /**
   * Find user by ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by SuperTokens user ID
   */
  async findBySupertokensId(supertokensUserId: string) {
    return prisma.user.findUnique({
      where: { supertokensUserId },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Create user
   */
  async create(data: {
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    supertokensUserId?: string;
  }) {
    const fullName = data.firstName && data.lastName 
      ? `${data.firstName} ${data.lastName}` 
      : null;

    return prisma.user.create({
      data: {
        email: data.email,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        companyName: data.companyName,
        phone: data.phone,
        supertokensUserId: data.supertokensUserId,
      },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Update user profile
   */
  async update(userId: string, data: UpdateUserInput) {
    const updateData: any = { ...data };

    // Update fullName if firstName or lastName changed
    if (data.firstName || data.lastName) {
      const user = await this.findById(userId);
      if (user) {
        const firstName = data.firstName || user.firstName;
        const lastName = data.lastName || user.lastName;
        updateData.fullName = firstName && lastName ? `${firstName} ${lastName}` : null;
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Assign account manager to client
   */
  async assignAccountManager(clientId: string, managerId: string) {
    return prisma.user.update({
      where: { id: clientId },
      data: {
        accountManagerId: managerId,
      },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get all clients for a manager
   */
  async getManagerClients(managerId: string) {
    return prisma.user.findMany({
      where: {
        accountManagerId: managerId,
        role: UserRole.CLIENT,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        companyName: true,
        avatarUrl: true,
        createdAt: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: {
            plan: true,
            monthlyHours: true,
          },
        },
      },
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Get user with active subscription
   */
  async getUserWithSubscription(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}

export default new UserService();
