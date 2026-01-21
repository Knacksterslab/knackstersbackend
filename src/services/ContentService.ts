/**
 * Content Service
 * Manages content storage for marketing pages
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger';

const CONTENT_DIR = path.join(__dirname, '../../data/content');

export class ContentService {
  /**
   * Ensure content directory exists
   */
  private async ensureContentDir() {
    try {
      await fs.access(CONTENT_DIR);
    } catch {
      await fs.mkdir(CONTENT_DIR, { recursive: true });
    }
  }

  /**
   * Get content file path
   */
  private getContentPath(page: string): string {
    return path.join(CONTENT_DIR, `${page}.json`);
  }

  /**
   * Get content for a page
   */
  async getContent(page: string): Promise<any> {
    try {
      await this.ensureContentDir();
      const filePath = this.getContentPath(page);
      
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed;
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, return null
          return null;
        }
        throw error;
      }
    } catch (error: any) {
      logger.error(`Failed to get content for page: ${page}`, error);
      throw new Error(`Failed to load content for ${page}`);
    }
  }

  /**
   * Update content for a page
   */
  async updateContent(page: string, content: any): Promise<void> {
    try {
      await this.ensureContentDir();
      const filePath = this.getContentPath(page);
      
      // Add metadata
      const contentWithMeta = {
        ...content,
        _metadata: {
          page,
          lastUpdated: new Date().toISOString(),
          version: '1.0',
        },
      };
      
      await fs.writeFile(filePath, JSON.stringify(contentWithMeta, null, 2), 'utf-8');
      logger.info(`Content updated for page: ${page}`);
    } catch (error: any) {
      logger.error(`Failed to update content for page: ${page}`, error);
      throw new Error(`Failed to save content for ${page}`);
    }
  }

  /**
   * List all available content pages
   */
  async listPages(): Promise<string[]> {
    try {
      await this.ensureContentDir();
      const files = await fs.readdir(CONTENT_DIR);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error: any) {
      logger.error('Failed to list content pages', error);
      return [];
    }
  }

  /**
   * Delete content for a page
   */
  async deleteContent(page: string): Promise<void> {
    try {
      const filePath = this.getContentPath(page);
      await fs.unlink(filePath);
      logger.info(`Content deleted for page: ${page}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to delete content for page: ${page}`, error);
        throw new Error(`Failed to delete content for ${page}`);
      }
    }
  }
}

export default new ContentService();
