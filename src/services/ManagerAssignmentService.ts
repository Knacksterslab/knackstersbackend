/**
 * Manager Assignment Service
 * Handles automatic assignment of account managers to clients based on solution selection
 */

import { PrismaClient, SolutionType, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class ManagerAssignmentService {
  /**
   * Assign a manager to a client based on their selected solution
   * Assignment priority:
   * 1. Find manager with matching specialization and lowest client count
   * 2. Find any manager with lowest client count (fallback)
   * 3. Return null if no managers available
   */
  async assignManagerToClient(
    clientId: string,
    selectedSolution?: SolutionType
  ): Promise<string | null> {
    try {
      logger.info(`Assigning manager to client ${clientId} for solution: ${selectedSolution}`);

      let assignedManagerId: string | null = null;

      // Priority 1: Try to find a specialized manager
      if (selectedSolution && selectedSolution !== SolutionType.OTHER) {
        assignedManagerId = await this.findSpecializedManager(selectedSolution);
      }

      // Priority 2: Find any available manager (fallback)
      if (!assignedManagerId) {
        assignedManagerId = await this.findAnyAvailableManager();
      }

      // Assign the manager to the client
      if (assignedManagerId) {
        await prisma.user.update({
          where: { id: clientId },
          data: { accountManagerId: assignedManagerId },
        });

        logger.info(`Manager ${assignedManagerId} assigned to client ${clientId}`);
        return assignedManagerId;
      }

      logger.warn(`No managers available to assign to client ${clientId}`);
      return null;
    } catch (error: any) {
      logger.error('Manager assignment failed', error);
      throw new Error('Failed to assign manager');
    }
  }

  /**
   * Find a manager specialized in the given solution with the lowest client count
   */
  private async findSpecializedManager(solution: SolutionType): Promise<string | null> {
    try {
      // Find all active managers with this specialization
      const managers = await prisma.user.findMany({
        where: {
          role: UserRole.MANAGER,
          status: 'ACTIVE',
          specializations: {
            has: solution,
          },
        },
        include: {
          _count: {
            select: {
              managedClients: true,
            },
          },
        },
      });

      if (managers.length === 0) {
        logger.info(`No specialized managers found for ${solution}`);
        return null;
      }

      // Sort by client count (ascending) and return the manager with the fewest clients
      const sortedManagers = managers.sort(
        (a, b) => a._count.managedClients - b._count.managedClients
      );

      logger.info(
        `Found ${managers.length} specialized managers for ${solution}, assigning one with ${sortedManagers[0]._count.managedClients} clients`
      );

      return sortedManagers[0].id;
    } catch (error: any) {
      logger.error('Failed to find specialized manager', error);
      return null;
    }
  }

  /**
   * Find any available manager with the lowest client count (fallback)
   */
  private async findAnyAvailableManager(): Promise<string | null> {
    try {
      const managers = await prisma.user.findMany({
        where: {
          role: UserRole.MANAGER,
          status: 'ACTIVE',
        },
        include: {
          _count: {
            select: {
              managedClients: true,
            },
          },
        },
      });

      if (managers.length === 0) {
        logger.warn('No managers available in the system');
        return null;
      }

      // Sort by client count (ascending)
      const sortedManagers = managers.sort(
        (a, b) => a._count.managedClients - b._count.managedClients
      );

      logger.info(
        `Assigning fallback manager with ${sortedManagers[0]._count.managedClients} clients`
      );

      return sortedManagers[0].id;
    } catch (error: any) {
      logger.error('Failed to find available manager', error);
      return null;
    }
  }

  /**
   * Get assignment statistics (for admin dashboard)
   */
  async getAssignmentStats(): Promise<{
    totalManagers: number;
    managersBySpecialization: Record<string, number>;
    averageClientsPerManager: number;
    unassignedClients: number;
  }> {
    try {
      // Get all managers with their client counts
      const managers = await prisma.user.findMany({
        where: { role: UserRole.MANAGER, status: 'ACTIVE' },
        select: {
          specializations: true,
          _count: {
            select: {
              managedClients: true,
            },
          },
        },
      });

      // Get count of clients without managers
      const unassignedClients = await prisma.user.count({
        where: {
          role: UserRole.CLIENT,
          accountManagerId: null,
        },
      });

      // Calculate stats
      const totalManagers = managers.length;
      const totalAssignedClients = managers.reduce(
        (sum, m) => sum + m._count.managedClients,
        0
      );
      const averageClientsPerManager =
        totalManagers > 0 ? totalAssignedClients / totalManagers : 0;

      // Count managers by specialization
      const managersBySpecialization: Record<string, number> = {};
      managers.forEach((manager) => {
        manager.specializations.forEach((spec) => {
          managersBySpecialization[spec] = (managersBySpecialization[spec] || 0) + 1;
        });
      });

      return {
        totalManagers,
        managersBySpecialization,
        averageClientsPerManager: Math.round(averageClientsPerManager * 10) / 10,
        unassignedClients,
      };
    } catch (error: any) {
      logger.error('Failed to get assignment stats', error);
      throw new Error('Failed to retrieve assignment statistics');
    }
  }

  /**
   * Reassign a client to a different manager
   */
  async reassignClient(clientId: string, newManagerId: string): Promise<void> {
    try {
      // Verify the new manager exists and is active
      const manager = await prisma.user.findFirst({
        where: {
          id: newManagerId,
          role: UserRole.MANAGER,
          status: 'ACTIVE',
        },
      });

      if (!manager) {
        throw new Error('Invalid manager ID or manager is not active');
      }

      await prisma.user.update({
        where: { id: clientId },
        data: { accountManagerId: newManagerId },
      });

      logger.info(`Client ${clientId} reassigned to manager ${newManagerId}`);
    } catch (error: any) {
      logger.error('Client reassignment failed', error);
      throw new Error('Failed to reassign client');
    }
  }

  /**
   * Bulk assign managers to unassigned clients
   */
  async bulkAssignUnassignedClients(): Promise<{
    assigned: number;
    failed: number;
  }> {
    try {
      const unassignedClients = await prisma.user.findMany({
        where: {
          role: UserRole.CLIENT,
          accountManagerId: null,
        },
        select: {
          id: true,
          selectedSolution: true,
        },
      });

      logger.info(`Found ${unassignedClients.length} unassigned clients`);

      let assigned = 0;
      let failed = 0;

      for (const client of unassignedClients) {
        try {
          const managerId = await this.assignManagerToClient(
            client.id,
            client.selectedSolution || undefined
          );

          if (managerId) {
            assigned++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          logger.error(`Failed to assign manager to client ${client.id}`, error);
        }
      }

      logger.info(`Bulk assignment complete: ${assigned} assigned, ${failed} failed`);

      return { assigned, failed };
    } catch (error: any) {
      logger.error('Bulk assignment failed', error);
      throw new Error('Failed to bulk assign managers');
    }
  }
}

export default new ManagerAssignmentService();
