/**
 * Prisma Helper Utilities
 * Common Prisma query patterns (DRY)
 */

import { Prisma } from '@prisma/client';

export class PrismaHelpers {
  static pagination(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  static dateRange(startDate?: Date, endDate?: Date): Prisma.DateTimeFilter | undefined {
    if (!startDate && !endDate) return undefined;
    
    return {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  static buildWhereClause<T extends Record<string, any>>(filters: T): Partial<T> {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  }

  static selectUserBasic() {
    return {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      role: true,
    };
  }

  static selectTaskBasic() {
    return {
      id: true,
      taskNumber: true,
      name: true,
      status: true,
      priority: true,
      dueDate: true,
    };
  }

  static selectProjectBasic() {
    return {
      id: true,
      projectNumber: true,
      title: true,
      status: true,
      dueDate: true,
    };
  }
}
