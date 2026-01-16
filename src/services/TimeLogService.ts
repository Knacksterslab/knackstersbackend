/**
 * Time Log Service
 * Orchestrates time tracking operations
 */

import { TimeLogQueries } from './time/queries';
import { TimeLogMutations } from './time/mutations';

export class TimeLogService {
  async getUserTimeLogs(userId: string, filters?: { taskId?: string; projectId?: string; startDate?: Date; endDate?: Date }) {
    return TimeLogQueries.getUserTimeLogs(userId, filters);
  }

  async getTimeLogById(timeLogId: string, userId?: string) {
    return TimeLogQueries.getTimeLogById(timeLogId, userId);
  }

  async getTaskTimeLogs(taskId: string) {
    return TimeLogQueries.getTaskTimeLogs(taskId);
  }

  async getProjectTimeSummary(projectId: string) {
    return TimeLogQueries.getProjectTimeSummary(projectId);
  }

  async logTime(data: {
    taskId: string;
    projectId: string;
    clientId: string;
    userId: string;
    durationMinutes: number;
    startTime: Date;
    description?: string;
  }) {
    return TimeLogMutations.logTime(data);
  }

  async updateTimeLog(timeLogId: string, updates: any) {
    return TimeLogMutations.updateTimeLog(timeLogId, updates);
  }

  async deleteTimeLog(timeLogId: string) {
    return TimeLogMutations.deleteTimeLog(timeLogId);
  }
}

export default new TimeLogService();
