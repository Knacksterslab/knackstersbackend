/**
 * Content Service
 * Manages content storage for marketing pages using the database.
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export class ContentService {
  /**
   * Get content for a page. Returns null if no content has been saved yet.
   */
  async getContent(page: string): Promise<any> {
    try {
      const row = await prisma.siteContent.findUnique({ where: { page } });
      if (!row) return null;
      // Strip internal metadata key if present from old filesystem records
      const { _metadata, ...content } = row.content as any;
      return content;
    } catch (error: any) {
      logger.error(`Failed to get content for page: ${page}`, error);
      throw new Error(`Failed to load content for ${page}`);
    }
  }

  /**
   * Create or update content for a page.
   */
  async updateContent(page: string, content: any): Promise<void> {
    try {
      await prisma.siteContent.upsert({
        where: { page },
        update: { content },
        create: { page, content },
      });
      logger.info(`Content updated for page: ${page}`);
    } catch (error: any) {
      logger.error(`Failed to update content for page: ${page}`, error);
      throw new Error(`Failed to save content for ${page}`);
    }
  }

  /**
   * List all pages that have saved content.
   */
  async listPages(): Promise<string[]> {
    try {
      const rows = await prisma.siteContent.findMany({ select: { page: true } });
      return rows.map((r) => r.page);
    } catch (error: any) {
      logger.error('Failed to list content pages', error);
      return [];
    }
  }

  /**
   * Delete content for a page.
   */
  async deleteContent(page: string): Promise<void> {
    try {
      await prisma.siteContent.delete({ where: { page } });
      logger.info(`Content deleted for page: ${page}`);
    } catch (error: any) {
      if (error.code !== 'P2025') {
        logger.error(`Failed to delete content for page: ${page}`, error);
        throw new Error(`Failed to delete content for ${page}`);
      }
    }
  }
}

export default new ContentService();
