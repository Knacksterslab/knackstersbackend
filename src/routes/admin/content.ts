import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';

const router = Router();

const CONTENT_FILE_PATH = path.join(process.cwd(), '..', 'frontend', 'components', 'landing', 'landing-content.ts');

// Helper to read content
async function readContent() {
  try {
    const fileContent = await fs.readFile(CONTENT_FILE_PATH, 'utf-8');
    
    // Extract the content object from the file
    const contentMatch = fileContent.match(/export const defaultLandingContent: LandingContent = ({[\s\S]*?});[\s]*$/m);
    
    if (!contentMatch) {
      throw new Error('Could not parse landing content');
    }
    
    // Parse the JSON content
    const content = JSON.parse(contentMatch[1]);
    return content;
  } catch (error) {
    return null;
  }
}

// Helper to write content
async function writeContent(content: any) {
  try {
    const fileContent = `export interface LandingContent {
  hero: {
    headline: string;
    subheadline: string;
    ctaButtonText: string;
    talentCards: Array<{
      id: string;
      image: string;
      name: string;
      role: string;
    }>;
  };
  statistics: {
    professionals: string;
    professionalsLabel: string;
    hoursDelivered: string;
    hoursDeliveredLabel: string;
  };
  partners: {
    title: string;
    description: string;
  };
  solutions: {
    title: string;
    subtitle: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      buttonText: string;
      buttonLink: string;
      icon: 'calendar' | 'customer-service' | 'development' | 'design' | 'marketing' | 'ai-brain' | 'shield' | 'healthcare';
    }>;
    ctaCard: {
      title: string;
      buttonText: string;
      buttonLink: string;
    };
  };
  benefits: {
    title: string;
    subtitle: string;
  };
  useCases: {
    title: string;
    subtitle: string;
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
  };
  seo: {
    pageTitle: string;
    metaDescription: string;
  };
}

export const defaultLandingContent: LandingContent = ${JSON.stringify(content, null, 2)};
`;

    await fs.writeFile(CONTENT_FILE_PATH, fileContent, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing content:', error);
    return false;
  }
}

// GET - Fetch content (public access)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const content = await readContent();
    
    if (!content) {
      return res.status(500).json({ error: 'Failed to read content' });
    }
    
    return res.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// PUT - Update content (admin only)
router.put('/', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<any> => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const success = await writeContent(content);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to save content' });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

export default router;
