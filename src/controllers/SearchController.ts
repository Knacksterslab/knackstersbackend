import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SearchService from '../services/SearchService';
import { successResponse, errorResponse } from '../utils/response';

export class SearchController {
  /**
   * Search across projects, tasks, and meetings
   */
  static async search(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const { q: query, types } = req.query;

      if (!query || typeof query !== 'string') {
        return errorResponse(res, 'Search query is required', 400);
      }

      if (query.trim().length < 2) {
        return successResponse(res, {
          projects: [],
          tasks: [],
          meetings: [],
          total: 0,
        });
      }

      let searchTypes: ('projects' | 'tasks' | 'meetings')[] = ['projects', 'tasks', 'meetings'];
      if (types && typeof types === 'string') {
        searchTypes = types.split(',').filter(t => 
          ['projects', 'tasks', 'meetings'].includes(t)
        ) as ('projects' | 'tasks' | 'meetings')[];
      }

      const results = await SearchService.search({
        userId,
        query,
        types: searchTypes,
      });

      return successResponse(res, results);
    } catch (error: any) {
      console.error('Search error:', error);
      return errorResponse(res, error.message || 'Search failed');
    }
  }
}
