# Supabase Storage Setup Guide

This document explains how to configure Supabase Storage for file uploads (talent images, partner logos, etc.)

## Prerequisites

- Supabase project created
- Admin access to Supabase Dashboard

## Setup Steps

### 1. Create Storage Buckets

Navigate to your Supabase Dashboard → Storage and create the following buckets:

#### Bucket 1: `talent-images`
- **Purpose**: Store talent profile images for the landing page carousel
- **Public Access**: Yes (required for public display)
- **File Types**: PNG, JPG, JPEG, WebP

#### Bucket 2: `partner-logos` (Optional)
- **Purpose**: Store partner company logos
- **Public Access**: Yes
- **File Types**: PNG, JPG, SVG, WebP

### 2. Make Buckets Public

For each bucket:
1. Go to Storage → Select the bucket
2. Click "Policies" tab
3. Click "New Policy"
4. Select "For full customization" → "Get started"
5. Add this policy:

**Policy Name**: `Public Read Access`
**Definition**: 
```sql
SELECT
```
**Target roles**: `public`

Or use the simple "Allow public read" template.

### 3. Configure Environment Variables

Add the following environment variables to your backend:

#### Local Development (.env)
```env
# Supabase Configuration
SUPABASE_URL=https://mfvlupdibigooihoiuew.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Production (Railway)
Add these variables in Railway dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ IMPORTANT**: Use the **Service Role Key**, not the anon key. The service role key bypasses Row Level Security (RLS) for admin operations.

### 4. Find Your Supabase Credentials

1. Go to Supabase Dashboard
2. Click on your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **service_role key** (secret) → Use as `SUPABASE_SERVICE_ROLE_KEY`

## Testing the Upload

1. Deploy the backend with the new environment variables
2. Log in to admin dashboard
3. Navigate to Content → Hero Section
4. Click on a talent card image to upload
5. Select an image file
6. Verify the image loads correctly

## File URLs

Uploaded files will have URLs in this format:
```
https://mfvlupdibigooihoiuew.supabase.co/storage/v1/object/public/talent-images/[filename]
```

## Troubleshooting

### Upload fails with "Upload failed" error
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify the bucket exists in Supabase
- Check backend logs for detailed error messages

### Image uploads but returns 404
- Ensure the bucket is set to **public**
- Check the bucket policies allow public SELECT

### "Bucket not found" error
- Verify bucket name matches exactly: `talent-images` (not `talent_images`)
- Bucket must be created in the correct Supabase project

## Security Notes

- Service Role Key bypasses RLS - keep it secret!
- Only admin users can upload (enforced by `requireRole(UserRole.ADMIN)`)
- File types are restricted (images only)
- File size limit: 10MB (configurable via `MAX_FILE_SIZE` env var)

## File Management

Files are stored permanently in Supabase Storage. To manage:
- View files: Supabase Dashboard → Storage → Select bucket
- Delete files: Select file → Delete (or use the API)
- Update policies: Storage → Bucket → Policies

## Cost Considerations

**Supabase Free Tier:**
- 1GB storage
- 2GB bandwidth per month

**Estimated Usage:**
- 6 talent images × ~500KB = 3MB
- Partner logos × ~100KB = minimal
- Well within free tier limits

For higher usage, check [Supabase Pricing](https://supabase.com/pricing).
