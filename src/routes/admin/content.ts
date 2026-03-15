import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import ContentService from '../../services/ContentService';

const router = Router();

// GET - Fetch content (admin view)
router.get('/', requireAuth, requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
  try {
    const content = await ContentService.getContent('landing-hero');
    if (!content) {
      return res.status(404).json({ error: 'No content saved yet' });
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

    await ContentService.updateContent('landing-hero', content);
    return res.json({ success: true, content });
  } catch (error) {
    console.error('Error updating content:', error);
    return res.status(500).json({ error: 'Failed to update content' });
  }
});

export default router;
