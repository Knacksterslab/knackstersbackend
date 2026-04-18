/*
  Warnings:

  - The values [STARTER] on the enum `SubscriptionPlan` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SolutionType" AS ENUM ('AI_MACHINE_LEARNING', 'CYBERSECURITY', 'SOFTWARE_DEVELOPMENT', 'DESIGN_CREATIVE', 'MARKETING_GROWTH', 'HEALTHCARE_LIFE_SCIENCES', 'MULTIPLE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'TASK_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'MEETING_COMPLETED';

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('TRIAL', 'FLEX_RETAINER', 'PRO_RETAINER', 'GROWTH', 'ENTERPRISE', 'CUSTOM');
ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new" USING ("plan"::text::"SubscriptionPlan_new");
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";
DROP TYPE "SubscriptionPlan_old";
COMMIT;

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "action_items" JSONB,
ADD COLUMN     "agenda" TEXT,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "partners" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "selected_solution" "SolutionType",
ADD COLUMN     "selected_solution_notes" TEXT,
ADD COLUMN     "specializations" "SolutionType"[] DEFAULT ARRAY[]::"SolutionType"[],
ADD COLUMN     "trial_domain" "SolutionType",
ADD COLUMN     "trial_used" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "site_content" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_content_page_key" ON "site_content"("page");
