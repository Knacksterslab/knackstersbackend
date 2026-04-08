/**
 * Project Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';
import { ProjectStatus, PriorityLevel } from '@prisma/client';
import NotificationService from '../NotificationService';
import { sendClientTaskRequestEmail, sendCSMNewTaskRequestEmail } from '../EmailService';

export class ProjectMutations {
  /**
   * Generate a globally unique project number, retrying on collision.
   * Format: KN-YYMM-NNNN (global sequence, not per-client).
   */
  private static async generateProjectNumber(attempt = 0): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const total = await prisma.project.count();
    // Add the attempt offset so retries produce a different number immediately
    return `KN-${yy}${mm}-${String(total + 1 + attempt).padStart(4, '0')}`;
  }

  static async createProject(data: {
    clientId: string;
    title: string;
    description?: string;
    estimatedHours?: number;
    dueDate?: Date;
    priority?: PriorityLevel;
    taskType?: string;
    isTrialToHire?: boolean;
  }) {
    // Encode category + trial-to-hire into taskType:
    //   "TRIAL_DEVELOPMENT", "TRIAL_DESIGN", etc. — trial with category
    //   "TRIAL_HIRE"                               — trial, no category
    //   "DEVELOPMENT", "DESIGN", etc.              — category only
    const resolvedTaskType = data.isTrialToHire
      ? data.taskType
        ? `TRIAL_${data.taskType}`
        : 'TRIAL_HIRE'
      : data.taskType || undefined;

    // Retry loop — handles race conditions and deleted-project gaps
    let project: Awaited<ReturnType<typeof prisma.project.create>> | null = null;
    let projectNumber = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        projectNumber = await ProjectMutations.generateProjectNumber(attempt);
        project = await prisma.project.create({
          data: {
            clientId: data.clientId,
            title: data.title,
            description: data.description,
            priority: data.priority,
            estimatedHours: data.estimatedHours,
            dueDate: data.dueDate,
            projectNumber,
            status: 'NOT_STARTED',
          },
        });
        break; // success — exit retry loop
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target?.includes('project_number')) {
          // Collision — back off briefly and retry with a higher offset
          await new Promise(r => setTimeout(r, 30 * (attempt + 1)));
          continue;
        }
        throw err; // unrelated error — rethrow immediately
      }
    }

    if (!project) {
      throw new Error('Failed to generate a unique project number after multiple attempts');
    }

    // Auto-create initial task (PENDING until manager assigns talent)
    const taskCount = await prisma.task.count({ where: { projectId: project.id } });
    const taskNumber = `${projectNumber}-T${String(taskCount + 1).padStart(2, '0')}`;

    await prisma.task.create({
      data: {
        projectId: project.id,
        taskNumber,
        name: data.title,
        description: data.description,
        taskType: resolvedTaskType,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
        estimatedMinutes: data.estimatedHours ? data.estimatedHours * 60 : undefined,
        dueDate: data.dueDate,
        createdById: data.clientId,
      },
    });

    // Fetch client details for notifications and emails
    const client = await prisma.user.findUnique({
      where: { id: data.clientId },
      select: {
        email: true,
        fullName: true,
        accountManagerId: true,
        accountManager: {
          select: { email: true, fullName: true },
        },
      },
    });

    // In-app notification to CSM — flag trial tasks prominently
    if (client?.accountManagerId) {
      const notificationTitle = data.isTrialToHire
        ? '⭐ Trial to Hire — New Task Request'
        : 'New Task Request';
      const notificationMessage = data.isTrialToHire
        ? `${client.fullName || 'Client'} is evaluating for a longer-term engagement: ${data.title}`
        : `${client.fullName || 'Client'} requested: ${data.title}`;

      await NotificationService.createNotification({
        userId: client.accountManagerId,
        type: 'INFO',
        title: notificationTitle,
        message: notificationMessage,
        actionUrl: `/manager-dashboard/assignments`,
        actionLabel: 'Review Request',
      });
    }

    // Fire emails non-blocking
    const emailPromises: Promise<void>[] = [];

    if (client?.email) {
      emailPromises.push(
        sendClientTaskRequestEmail({
          clientName: client.fullName || 'Client',
          clientEmail: client.email,
          projectNumber,
          title: data.title,
          description: data.description || data.title,
          priority: data.priority || 'MEDIUM',
          estimatedHours: data.estimatedHours,
          dueDate: data.dueDate,
          taskType: data.taskType,
          isTrialToHire: data.isTrialToHire,
        })
      );
    }

    if (client?.accountManager?.email) {
      emailPromises.push(
        sendCSMNewTaskRequestEmail({
          csmName: client.accountManager.fullName || 'Manager',
          csmEmail: client.accountManager.email,
          clientName: client.fullName || 'Client',
          projectNumber,
          title: data.title,
          description: data.description || data.title,
          priority: data.priority || 'MEDIUM',
          estimatedHours: data.estimatedHours,
          dueDate: data.dueDate,
          taskType: data.taskType,
          isTrialToHire: data.isTrialToHire,
        })
      );
    }

    Promise.all(emailPromises).catch(() => {});

    return project;
  }

  static async updateProject(projectId: string, updates: Partial<{
    title: string;
    description: string;
    status: ProjectStatus;
    estimatedHours: number;
    dueDate: Date;
  }>) {
    return prisma.project.update({
      where: { id: projectId },
      data: updates,
    });
  }

  static async assignTalent(projectId: string, talentIds: string[]) {
    await prisma.projectAssignee.deleteMany({ where: { projectId } });

    const assignees = await Promise.all(
      talentIds.map(userId =>
        prisma.projectAssignee.create({
          data: { projectId, userId },
        })
      )
    );

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true, clientId: true },
    });

    // Notify each assigned talent
    await Promise.all(
      talentIds.map(userId =>
        NotificationService.createNotification({
          userId,
          type: 'INFO',
          title: 'Assigned to Project',
          message: `You have been assigned to: ${project?.title}`,
          actionUrl: `/projects/${projectId}`,
          actionLabel: 'View Project',
        })
      )
    );

    // Notify the client their task has been picked up
    if (project?.clientId) {
      await NotificationService.createNotification({
        userId: project.clientId,
        type: 'SUCCESS',
        title: 'Task Assigned',
        message: `An expert has been assigned to your request: "${project.title}". Work is starting soon.`,
        actionUrl: `/tasks-projects`,
        actionLabel: 'View Request',
      });
    }

    return assignees;
  }

  static async deleteProject(projectId: string) {
    return prisma.project.delete({ where: { id: projectId } });
  }
}
