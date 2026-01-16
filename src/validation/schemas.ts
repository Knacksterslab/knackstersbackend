/**
 * Zod validation schemas for request validation
 */

import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'TALENT', 'MANAGER']).default('CLIENT'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

// Subscription schemas
export const createSubscriptionSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE', 'CUSTOM']),
  billingInterval: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  paymentMethodId: z.string().uuid().optional(),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE', 'CUSTOM']).optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'PAUSED']).optional(),
});

// Hours purchase schema
export const purchaseHoursSchema = z.object({
  hours: z.number().int().min(1).max(1000),
  paymentMethodId: z.string().uuid(),
});

// Project schemas
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
});

// Task schemas
export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  taskType: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedToId: z.string().uuid().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
});

export const updateTaskSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  taskType: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  estimatedMinutes: z.number().int().positive().optional(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
});

// Time log schema
export const createTimeLogSchema = z.object({
  taskId: z.string().uuid(),
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()).optional(),
  durationMinutes: z.number().positive().optional(),
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
});

// Meeting schemas
export const createMeetingSchema = z.object({
  type: z.enum(['MEET_AND_GREET', 'PROJECT_KICKOFF', 'STATUS_UPDATE', 'REVIEW', 'SUPPORT']),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().or(z.date()),
  durationMinutes: z.number().int().positive().default(30),
  timezone: z.string().default('UTC'),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().or(z.date()).optional(),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
});

// Support ticket schema
export const createSupportTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
});

// Message schema
export const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, 'Message content is required'),
  type: z.enum(['TEXT', 'FILE', 'SYSTEM']).default('TEXT'),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  fileType: z.string().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Query params
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
});

// Invoice schema
export const createInvoiceSchema = z.object({
  userId: z.string().uuid(),
  transactionType: z.enum([
    'SUBSCRIPTION_RENEWAL',
    'ADDITIONAL_HOURS',
    'ONE_TIME_PURCHASE',
    'REFUND',
    'CREDIT_ADJUSTMENT',
  ]),
  description: z.string().optional(),
  subtotal: z.number().positive(),
  tax: z.number().nonnegative().default(0),
  hoursPurchased: z.number().int().positive().optional(),
  paymentMethodId: z.string().uuid().optional(),
});

// Talent Application schemas
export const TalentApplicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  primaryExpertise: z.string().min(10, 'Please describe your expertise (min 10 characters)'),
  additionalSkills: z.string().optional(),
  profileUrls: z.array(z.string().url()).optional(),
  currentEmploymentStatus: z.enum(['FULL_TIME_EMPLOYED', 'PART_TIME_EMPLOYED', 'SELF_EMPLOYED', 'BETWEEN_OPPORTUNITIES']),
  preferredWorkType: z.enum(['FULL_TIME', 'PART_TIME', 'FREELANCE_CONTRACT', 'FLEXIBLE']),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
});

export const TalentScheduleSchema = z.object({
  profileId: z.string().uuid(),
  preferredMeetingTime: z.string().min(1, 'Meeting time is required'),
  meetingNotes: z.string().optional(),
});

// Export type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type PurchaseHoursInput = z.infer<typeof purchaseHoursSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type TalentApplicationInput = z.infer<typeof TalentApplicationSchema>;
export type TalentScheduleInput = z.infer<typeof TalentScheduleSchema>;