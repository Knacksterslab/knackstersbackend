-- AlterTable: Add talent profile enrichment fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weekly_capacity_hours" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portfolio_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linkedin_url" TEXT;
