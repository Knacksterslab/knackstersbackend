/**
 * Hours Balance Service
 * Orchestrates hours balance operations
 */

import { HoursQueries } from './hours/queries';
import { HoursMutations } from './hours/mutations';

export class HoursBalanceService {
  async getCurrentBalance(userId: string) {
    return HoursQueries.getCurrentBalance(userId);
  }

  async getBalanceHistory(userId: string, limit = 12) {
    return HoursQueries.getBalanceHistory(userId, limit);
  }

  async getUsageByProject(userId: string, startDate: Date, endDate: Date) {
    return HoursQueries.getUsageByProject(userId, startDate, endDate);
  }

  async createMonthlyBalance(userId: string, subscriptionId: string, monthlyHours: number, startDate?: Date) {
    return HoursMutations.createMonthlyBalance(userId, subscriptionId, monthlyHours, startDate);
  }

  async addPurchasedHours(userId: string, hours: number) {
    return HoursMutations.addPurchasedHours(userId, hours);
  }

  async updateUsage(balanceId: string, minutesUsed: number) {
    return HoursMutations.updateUsage(balanceId, minutesUsed);
  }

  async resetMonthlyBalance(userId: string) {
    return HoursMutations.resetMonthlyBalance(userId);
  }
}

export default new HoursBalanceService();
