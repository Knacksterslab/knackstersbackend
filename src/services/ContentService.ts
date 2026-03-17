/**
 * Content Service
 * Manages content storage for marketing pages using the database.
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

type TalentCard = {
  id: string;
  image: string;
  name: string;
  role: string;
};

export class ContentService {
  private toObject(value: any): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, any>;
  }

  private normalizeTalentCards(value: any): TalentCard[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((card) => card && typeof card === 'object')
      .map((card: any) => ({
        id: String(card.id ?? '').trim(),
        image: String(card.image ?? '').trim(),
        name: String(card.name ?? '').trim(),
        role: String(card.role ?? '').trim(),
      }))
      .filter((card) => card.id && card.image && card.name && card.role);
  }

  private normalizeLandingHeroContent(rawContent: any): { talentCards: TalentCard[] } {
    const topLevel = this.toObject(rawContent);
    const topWithoutMetadata = this.toObject(topLevel);
    delete topWithoutMetadata._metadata;

    const nested = this.toObject(topWithoutMetadata.content);
    const nestedWithoutMetadata = this.toObject(nested);
    delete nestedWithoutMetadata._metadata;

    // Canonical preference:
    // 1) top-level talentCards
    // 2) nested content.talentCards (legacy shape)
    const topLevelCards = this.normalizeTalentCards(topWithoutMetadata.talentCards);
    const nestedCards = this.normalizeTalentCards(nestedWithoutMetadata.talentCards);
    const talentCards = topLevelCards.length > 0 ? topLevelCards : nestedCards;

    return { talentCards };
  }

  /**
   * Get content for a page. Returns null if no content has been saved yet.
   */
  async getContent(page: string): Promise<any> {
    const startedAt = Date.now();
    try {
      const row = await prisma.siteContent.findUnique({ where: { page } });
      if (!row) {
        logger.warn('Content row not found', { page, durationMs: Date.now() - startedAt });
        return null;
      }

      const rawContent = row.content as any;
      const rawContentKeys = Object.keys(this.toObject(rawContent));

      let content: any;
      if (page === 'landing-hero') {
        content = this.normalizeLandingHeroContent(rawContent);
      } else {
        // Strip internal metadata key if present from old filesystem records
        const { _metadata, ...normalized } = this.toObject(rawContent);
        content = normalized;
      }

      const hasTalentCards = Array.isArray(content?.talentCards);

      logger.info('Content row loaded', {
        page,
        hasMetadata: typeof this.toObject(rawContent)._metadata !== 'undefined',
        rawContentKeys,
        hasTalentCards,
        talentCardsCount: hasTalentCards ? content.talentCards.length : 0,
        durationMs: Date.now() - startedAt,
      });

      return content;
    } catch (error: any) {
      logger.error(`Failed to get content for page: ${page}`, {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        stack: error?.stack,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(`Failed to load content for ${page}`);
    }
  }

  /**
   * Create or update content for a page.
   */
  async updateContent(page: string, content: any): Promise<void> {
    const startedAt = Date.now();
    try {
      const contentToPersist =
        page === 'landing-hero' ? this.normalizeLandingHeroContent(content) : content;

      await prisma.siteContent.upsert({
        where: { page },
        update: { content: contentToPersist },
        create: { page, content: contentToPersist },
      });
      logger.info(`Content updated for page: ${page}`, {
        hasTalentCards: Array.isArray(contentToPersist?.talentCards),
        talentCardsCount: Array.isArray(contentToPersist?.talentCards) ? contentToPersist.talentCards.length : 0,
        contentKeys:
          contentToPersist && typeof contentToPersist === 'object' && !Array.isArray(contentToPersist)
            ? Object.keys(contentToPersist)
            : [],
        durationMs: Date.now() - startedAt,
      });
    } catch (error: any) {
      logger.error(`Failed to update content for page: ${page}`, {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        stack: error?.stack,
        durationMs: Date.now() - startedAt,
      });
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
