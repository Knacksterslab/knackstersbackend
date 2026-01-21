/**
 * Common TypeScript types and interfaces
 */

import { Request } from 'express';
import { UserRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// Extend Express Request to include user data from SuperTokens
export interface AuthRequest extends Request {
  userId?: string;
  role?: UserRole;
  session?: {
    userId: string;
    role: UserRole;
    sessionHandle: string;
  };
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

// Subscription types
export interface SubscriptionData {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthlyHours: number;
  priceAmount: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate?: Date | null;
}

// Hours balance types
export interface HoursBalanceData {
  periodStart: Date;
  periodEnd: Date;
  allocatedHours: number;
  bonusHours: number;
  extraPurchasedHours: number;
  totalAvailableHours: number;
  hoursUsed: number;
  hoursRemaining: number;
  usagePercentage: number;
}

// Dashboard overview types
export interface DashboardOverview {
  user: UserProfile;
  hoursBalance: HoursBalanceData | null;
  subscription: SubscriptionData | null;
  recentTasks: TaskSummary[];
  notifications: NotificationSummary[];
  accountManager?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    isAvailable: boolean;
  } | null;
  upcomingMeeting?: {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    videoRoomUrl?: string | null;
    title?: string;
    description?: string | null;
  } | null;
}

export interface TaskSummary {
  id: string;
  taskNumber: string;
  name: string;
  status: string;
  projectName: string;
  assignedTo?: {
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  dueDate?: Date | null;
  loggedMinutes: number;
}

export interface NotificationSummary {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// Error codes
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INSUFFICIENT_HOURS = 'INSUFFICIENT_HOURS',
  SUBSCRIPTION_INACTIVE = 'SUBSCRIPTION_INACTIVE',
}
