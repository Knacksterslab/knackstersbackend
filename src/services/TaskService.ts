/**
 * Task Service
 * Orchestrates task operations
 */

import { TaskStatus, PriorityLevel } from '@prisma/client';
import { TaskQueries } from './tasks/queries';
import { TaskMutations } from './tasks/mutations';

export class TaskService {
  async getUserTasks(userId: string, filters?: { status?: TaskStatus; projectId?: string }) {
    return TaskQueries.getUserTasks(userId, filters);
  }

  async getTaskById(taskId: string, userId?: string) {
    return TaskQueries.getTaskById(taskId, userId);
  }

  async getProjectTasks(projectId: string, status?: TaskStatus) {
    return TaskQueries.getProjectTasks(projectId, status);
  }

  async getTaskStats(projectId: string) {
    return TaskQueries.getTaskStats(projectId);
  }

  async createTask(data: {
    projectId: string;
    name: string;
    description?: string;
    assignedToId?: string;
    priority?: PriorityLevel;
    dueDate?: Date;
    estimatedHours?: number;
    createdById: string;
  }) {
    return TaskMutations.createTask(data);
  }

  async updateTask(taskId: string, updates: any) {
    return TaskMutations.updateTask(taskId, updates);
  }

  async assignTask(taskId: string, assignedToId: string) {
    return TaskMutations.assignTask(taskId, assignedToId);
  }

  async deleteTask(taskId: string) {
    return TaskMutations.deleteTask(taskId);
  }
}

export default new TaskService();
