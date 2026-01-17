/**
 * Supabase Storage Configuration
 * For file uploads (images, documents, etc.)
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn('Supabase Storage not configured. File uploads will fail.');
}

// Create Supabase client with service role key (bypasses RLS for admin operations)
export const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Upload file to Supabase Storage
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path within the bucket (e.g., 'folder/filename.jpg')
 * @param fileBuffer - File buffer to upload
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToStorage(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    const { error } = await supabaseStorage.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if file exists
      });

    if (error) {
      logger.error('Supabase upload error', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseStorage.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error: any) {
    logger.error('Failed to upload to Supabase Storage', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path within the bucket
 */
export async function deleteFromStorage(
  bucketName: string,
  filePath: string
): Promise<void> {
  try {
    const { error } = await supabaseStorage.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      logger.error('Supabase delete error', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error: any) {
    logger.error('Failed to delete from Supabase Storage', error);
    throw error;
  }
}

/**
 * List files in a bucket
 * @param bucketName - Name of the storage bucket
 * @param folder - Optional folder path
 */
export async function listStorageFiles(
  bucketName: string,
  folder?: string
): Promise<any[]> {
  try {
    const { data, error } = await supabaseStorage.storage
      .from(bucketName)
      .list(folder);

    if (error) {
      logger.error('Supabase list error', error);
      throw new Error(`List failed: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    logger.error('Failed to list files from Supabase Storage', error);
    throw error;
  }
}
