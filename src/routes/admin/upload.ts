import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { uploadToStorage } from '../../config/supabase-storage';
import { logger } from '../../utils/logger';

const router = Router();

// Configure multer for file uploads (in-memory storage)
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
    
    // Determine bucket and path based on destination
    let bucketName: string;
    let filePath: string;
    
    if (destination === 'talent') {
      bucketName = 'talent-images';
      filePath = fileName;
    } else {
      // Default to partners
      bucketName = 'partner-logos';
      filePath = fileName;
    }
    
    // Upload to Supabase Storage
    const publicUrl = await uploadToStorage(
      bucketName,
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    logger.info(`File uploaded successfully: ${fileName} to ${bucketName}`);

    return res.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (error: any) {
    logger.error('Upload failed', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to upload file' 
    });
  }
});

export default router;
