/**
 * Project Service
 * Orchestrates project operations
 */

import { ProjectStatus } from '@prisma/client';
import { ProjectQueries } from './projects/queries';
import { ProjectMutations } from './projects/mutations';

export class ProjectService {
  async getClientProjects(clientId: string, status?: ProjectStatus) {
    return ProjectQueries.getClientProjects(clientId, status);
  }

  async getProjectById(projectId: string, clientId?: string) {
    return ProjectQueries.getProjectById(projectId, clientId);
  }

  async getProjectStats(projectId: string) {
    return ProjectQueries.getProjectStats(projectId);
  }

  async createProject(data: {
    clientId: string;
    title: string;
    description?: string;
    estimatedHours?: number;
    dueDate?: Date;
  }) {
    return ProjectMutations.createProject(data);
  }

  async updateProject(projectId: string, updates: any) {
    return ProjectMutations.updateProject(projectId, updates);
  }

  async assignTalent(projectId: string, talentIds: string[]) {
    return ProjectMutations.assignTalent(projectId, talentIds);
  }

  async deleteProject(projectId: string) {
    return ProjectMutations.deleteProject(projectId);
  }
}

export default new ProjectService();
