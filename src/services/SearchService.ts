import prisma from '../lib/prisma';

interface SearchParams {
  userId: string;
  query: string;
  types?: ('projects' | 'tasks' | 'meetings')[];
}

class SearchService {
  /**
   * Search across projects, tasks, and meetings
   */
  async search(params: SearchParams) {
    const { userId, query, types = ['projects', 'tasks', 'meetings'] } = params;
    
    if (!query || query.trim().length < 2) {
      return {
        projects: [],
        tasks: [],
        meetings: [],
        total: 0,
      };
    }

    const searchTerm = query.trim().toLowerCase();
    const results: any = {
      projects: [],
      tasks: [],
      meetings: [],
      total: 0,
    };

    // Search Projects
    if (types.includes('projects')) {
      results.projects = await prisma.project.findMany({
        where: {
          clientId: userId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { projectNumber: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          projectNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });
      results.total += results.projects.length;
    }

    // Search Tasks
    if (types.includes('tasks')) {
      results.tasks = await prisma.task.findMany({
        where: {
          project: {
            clientId: userId,
          },
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { taskNumber: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          taskNumber: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              title: true,
              projectNumber: true,
            },
          },
          assignedTo: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 15,
      });
      results.total += results.tasks.length;
    }

    // Search Meetings
    if (types.includes('meetings')) {
      results.meetings = await prisma.meeting.findMany({
        where: {
          clientId: userId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          scheduledAt: true,
          durationMinutes: true,
          type: true,
          status: true,
          accountManager: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
        take: 10,
      });
      results.total += results.meetings.length;
    }

    return results;
  }

  /**
   * Get recent searches for user (if we implement search history)
   */
  async getRecentSearches(_userId: string) {
    // Placeholder for future implementation
    return [];
  }
}

export default new SearchService();
