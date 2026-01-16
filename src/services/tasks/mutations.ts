/**
 * Task Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';
import { TaskStatus, PriorityLevel } from '@prisma/client';
import NotificationService from '../NotificationService';

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
    return prisma.task.update({
      where: { id: taskId },
      data: updates,
    });
  }

  static async assignTask(taskId: string, assignedToId: string) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { assignedToId, status: 'ACTIVE' },
      include: { assignedTo: { select: { fullName: true } } },
    });

    await NotificationService.createNotification({
      userId: assignedToId,
      type: 'INFO',
      title: 'Task Assigned',
      message: `New task assigned: ${task.name}`,
      actionUrl: `/tasks/${task.id}`,
      actionLabel: 'View Task',
    });

    return task;
  }

  static async deleteTask(taskId: string) {
    return prisma.task.delete({ where: { id: taskId } });
  }
}
