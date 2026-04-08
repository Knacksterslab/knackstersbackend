-- Add CANCELLED value to ProjectStatus enum
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
