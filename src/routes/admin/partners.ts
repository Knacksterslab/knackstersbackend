import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { ApiResponse } from '../../utils/response';

const router = Router();

const PARTNERS_CONFIG_PATH = path.join(process.cwd(), '..', 'frontend', 'components', 'partners', 'partner-config.ts');

// Helper to read partner config
async function readPartnersConfig() {
  try {
    const content = await fs.readFile(PARTNERS_CONFIG_PATH, 'utf-8');
    
    // Extract the partners array from the file
    const arrayMatch = content.match(/export const partners: Partner\[\] = (\[[\s\S]*?\]);/);
    
    if (!arrayMatch) {
      throw new Error('Could not find partners array in config');
    }
    
    // Parse the array content
    const partners = eval(`(${arrayMatch[1]})`);
    return partners;
  } catch (error) {
    console.error('Error reading partners config:', error);
    return [];
  }
}

// Helper to write partner config
async function writePartnersConfig(partners: any[]) {
  try {
    const partnersString = partners.map(p => {
      const fields = [];
      fields.push(`    id: '${p.id}'`);
      fields.push(`    name: '${p.name}'`);
      fields.push(`    logoUrl: '${p.logoUrl}'`);
      fields.push(`    active: ${p.active}`);
      if (p.category) fields.push(`    category: '${p.category}'`);
      if (p.website) fields.push(`    website: '${p.website}'`);
      
      return `  {\n${fields.join(',\n')}\n  }`;
    }).join(',\n');

    const fileContent = `export interface Partner {
  id: string;
  name: string;
  logoUrl: string; // Path to logo in /public/images/partners/
  logoUrlDark?: string; // Optional dark mode logo
  active: boolean;
  website?: string; // Optional link to partner site
  category?: 'client' | 'technology'; // Optional categorization
}

export const partners: Partner[] = [
${partnersString}
];

// Helper functions
export const getActivePartners = () => partners.filter(p => p.active);
export const getPartnersByCategory = (category: 'client' | 'technology') => 
  partners.filter(p => p.active && p.category === category);
`;

    await fs.writeFile(PARTNERS_CONFIG_PATH, fileContent, 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

// GET - Fetch all partners (public access)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const partners = await readPartnersConfig();
    return res.json({ partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// POST - Add new partner (admin only)
router.post('/', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, name, logoUrl, active, category, website } = req.body;

    if (!id || !name || !logoUrl) {
      return res.status(400).json({ error: 'Missing required fields: id, name, logoUrl' });
    }

    const partners = await readPartnersConfig();
    
    // Check if ID already exists
    if (partners.some((p: any) => p.id === id)) {
      return res.status(400).json({ error: 'Partner with this ID already exists' });
    }

    const newPartner = {
      id,
      name,
      logoUrl,
      active: active !== undefined ? active : true,
      category: category || 'client',
      ...(website && { website }),
    };

    partners.push(newPartner);
    
    const success = await writePartnersConfig(partners);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to save partner' });
    }

    res.status(201).json({ partner: newPartner });
  } catch (error) {
    return ApiResponse.error(res, 'Failed to add partner');
  }
});

// PUT - Update partner (admin only)
router.put('/:id', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Partner ID is required' });
    }

    const partners = await readPartnersConfig();
    const index = partners.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    partners[index] = { ...partners[index], ...updates };
    
    const success = await writePartnersConfig(partners);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update partner' });
    }

    res.json({ partner: partners[index] });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
});

// DELETE - Remove partner (admin only)
router.delete('/:id', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Partner ID is required' });
    }

    const partners = await readPartnersConfig();
    const filteredPartners = partners.filter((p: any) => p.id !== id);

    if (filteredPartners.length === partners.length) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const success = await writePartnersConfig(filteredPartners);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete partner' });
    }

    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    return ApiResponse.error(res, 'Failed to delete partner');
  }
});

export default router;
