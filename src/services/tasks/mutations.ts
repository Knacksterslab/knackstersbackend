/**
 * Task Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';
import { TaskStatus, PriorityLevel } from '@prisma/client';
import NotificationService from '../NotificationService';
import {
  sendTalentTaskAssignedEmail,
  sendClientTaskStartedEmail,
  sendClientTaskCompletedEmail,
  sendCSMTaskCompletedEmail,
} from '../EmailService';
import { logger } from '../../utils/logger';

export class TaskMutations {
  static async createTask(data: {
    projectId: string;
    name: string;
    description?: string;
    assignedToId?: string;
    priority?: PriorityLevel;
    dueDate?: Date;
    estimatedHours?: number;
    createdById: string;
  }) {
    const taskCount = await prisma.task.count({ where: { projectId: data.projectId } });
    const taskNumber = `TASK-${Date.now()}-${String(taskCount + 1).padStart(3, '0')}`;

    const task = await prisma.task.create({
      data: {
        ...data,
        taskNumber,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
      },
      include: {
        assignedTo: { select: { fullName: true, email: true } },
        project: { select: { title: true, clientId: true } },
      },
    });

    if (task.assignedToId) {
      await NotificationService.createNotification({
        userId: task.assignedToId,
        type: 'INFO',
        title: 'New Task Assigned',
        message: `You have been assigned to: ${task.name}`,
        actionUrl: `/tasks/${task.id}`,
        actionLabel: 'View Task',
      });
    }

    return task;
  }

  static async updateTask(taskId: string, updates: Partial<{
    name: string;
    description: string;
    status: TaskStatus;
    priority: PriorityLevel;
    assignedToId: string;
    dueDate: Date;
    estimatedHours: number;
  }>) {
    // Fetch current task state for status-transition side-effects
    const existing = updates.status
      ? await prisma.task.findUnique({
          where: { id: taskId },
          select: {
            status: true,
            name: true,
            taskNumber: true,
            loggedMinutes: true,
            project: {
              select: {
                title: true,
                projectNumber: true,
                clientId: true,
                client: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    accountManager: {
                      select: { email: true, fullName: true },
                    },
                  },
                },
              },
            },
            assignedTo: { select: { email: true, fullName: true } },
          },
        })
      : null;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updates,
    });

    if (
      existing &&
      updates.status &&
      existing.status !== updates.status
    ) {
      const project = existing.project;
      const client = project?.client;
      const csm = client?.accountManager;
      const talent = existing.assignedTo;

      if (updates.status === 'COMPLETED') {
        // Notify client in-app
        if (client?.id) {
          NotificationService.createNotification({
            userId: client.id,
            type: 'SUCCESS',
            title: 'Task Completed',
            message: `Your task "${existing.name}" has been completed.`,
            actionUrl: `/tasks-projects`,
            actionLabel: 'View Request',
          }).catch(err => logger.error('Failed to create client task-completed notification', err));
        }

        // Email client
        if (client?.email) {
          sendClientTaskCompletedEmail({
            clientName: client.fullName || client.email,
            clientEmail: client.email,
            taskName: existing.name,
            projectNumber: project?.projectNumber ?? existing.taskNumber,
            talentName: talent?.fullName || 'Your Knackster',
            loggedMinutes: existing.loggedMinutes ? Number(existing.loggedMinutes) : null,
          }).catch(err => logger.error('Failed to send client task-completed email', err));
        }

        // Email CSM
        if (csm?.email) {
          sendCSMTaskCompletedEmail({
            csmName: csm.fullName || csm.email,
            csmEmail: csm.email,
            clientName: client?.fullName || client?.email || 'Client',
            taskName: existing.name,
            projectNumber: project?.projectNumber ?? existing.taskNumber,
            talentName: talent?.fullName || 'Talent',
            loggedMinutes: existing.loggedMinutes ? Number(existing.loggedMinutes) : null,
          }).catch(err => logger.error('Failed to send CSM task-completed email', err));
        }
      }
    }

    return task;
  }

  static async assignTask(taskId: string, assignedToId: string) {
    // Fetch full context before updating for email side-effects
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        name: true,
        taskNumber: true,
        dueDate: true,
        estimatedMinutes: true,
        project: {
          select: {
            title: true,
            projectNumber: true,
            clientId: true,
            client: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    const talent = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { fullName: true, email: true },
    });

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { assignedToId, status: 'ACTIVE' },
      include: { assignedTo: { select: { fullName: true } } },
    });

    // Move parent project to IN_PROGRESS — clears the "Pending Review" banner on the client side
    await prisma.project.update({
      where: { id: task.projectId },
      data: { status: 'IN_PROGRESS' },
    });

    // In-app notification to talent
    await NotificationService.createNotification({
      userId: assignedToId,
      type: 'INFO',
      title: 'Task Assigned',
      message: `New task assigned: ${task.name}`,
      actionUrl: `/tasks/${task.id}`,
      actionLabel: 'View Task',
    });

    if (existing) {
      const project = existing.project;
      const client = project?.client;

      // In-app notification to client — work has started
      if (client?.id) {
        NotificationService.createNotification({
          userId: client.id,
          type: 'INFO',
          title: 'Work Has Started',
          message: `A Knackster has been assigned and started working on "${existing.name}".`,
          actionUrl: `/tasks-projects`,
          actionLabel: 'Track Request',
        }).catch(err => logger.error('Failed to create client work-started notification', err));
      }

      // Email talent
      if (talent?.email) {
        sendTalentTaskAssignedEmail({
          talentName: talent.fullName || talent.email,
          talentEmail: talent.email,
          taskName: existing.name,
          taskNumber: existing.taskNumber,
          projectTitle: project?.title || 'Project',
          clientName: client?.fullName || client?.email || 'Client',
          dueDate: existing.dueDate,
          estimatedMinutes: existing.estimatedMinutes,
        }).catch(err => logger.error('Failed to send talent task-assigned email', err));
      }

      // Email client — work has started
      if (client?.email) {
        sendClientTaskStartedEmail({
          clientName: client.fullName || client.email,
          clientEmail: client.email,
          taskName: existing.name,
          projectNumber: project?.projectNumber ?? existing.taskNumber,
          talentName: talent?.fullName || 'Your Knackster',
        }).catch(err => logger.error('Failed to send client work-started email', err));
      }
    }

    return task;
  }

  static async deleteTask(taskId: string) {
    return prisma.task.delete({ where: { id: taskId } });
  }
}
