/**
 * Project Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';
import { ProjectStatus } from '@prisma/client';
import NotificationService from '../NotificationService';

export class ProjectMutations {
  static async createProject(data: {
    clientId: string;
    title: string;
    description?: string;
    estimatedHours?: number;
    dueDate?: Date;
  }) {
    const projectCount = await prisma.project.count({ where: { clientId: data.clientId } });
    const projectNumber = `PROJ-${Date.now()}-${String(projectCount + 1).padStart(3, '0')}`;

    return prisma.project.create({
      data: {
        ...data,
        projectNumber,
        status: 'NOT_STARTED',
      },
    });
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

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true } });

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

    return assignees;
  }

  static async deleteProject(projectId: string) {
    return prisma.project.delete({ where: { id: projectId } });
  }
}
