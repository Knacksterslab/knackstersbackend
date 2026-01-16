import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only SVG, PNG, JPG, and WebP are allowed.'));
    }
  },
});

// POST - Upload file (admin only)
router.post('/', requireAuth, requireRole(UserRole.ADMIN), upload.single('file'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const destination = req.body.destination || 'partners'; // Default to partners

    // Generate safe filename
    const originalName = req.file.originalname.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const fileName = `${Date.now()}-${originalName}`;
    
    // Determine upload directory based on destination
    let uploadDir: string;
    let publicUrl: string;
    
    if (destination === 'talent') {
      uploadDir = path.join(process.cwd(), '..', 'frontend', 'public', 'images');
      publicUrl = `/images/${fileName}`;
    } else {
      // Default to partners
      uploadDir = path.join(process.cwd(), '..', 'frontend', 'public', 'images', 'partners');
      publicUrl = `/images/partners/${fileName}`;
    }
    
    const filePath = path.join(uploadDir, fileName);

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, req.file.buffer);

    return res.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

export default router;
