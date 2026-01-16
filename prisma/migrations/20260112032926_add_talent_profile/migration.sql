/*
  Warnings:

  - A unique constraint covering the columns `[stripe_customer_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('FULL_TIME_EMPLOYED', 'PART_TIME_EMPLOYED', 'SELF_EMPLOYED', 'BETWEEN_OPPORTUNITIES');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('FULL_TIME', 'PART_TIME', 'FREELANCE_CONTRACT', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "TalentApplicationStatus" AS ENUM ('PENDING_REVIEW', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'ONBOARDING', 'ACTIVE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_customer_id" TEXT;

-- CreateTable
CREATE TABLE "talent_profiles" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "primary_expertise" TEXT NOT NULL,
    "additional_skills" TEXT,
    "profile_urls" JSONB,
    "current_employment_status" "EmploymentStatus" NOT NULL,
    "preferred_work_type" "WorkType" NOT NULL,
    "hourly_rate" DECIMAL(10,2) NOT NULL,
    "preferred_meeting_time" TEXT,
    "meeting_notes" TEXT,
    "status" "TalentApplicationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "talent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "talent_profiles_email_key" ON "talent_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "talent_profiles_user_id_key" ON "talent_profiles"("user_id");

-- CreateIndex
CREATE INDEX "talent_profiles_email_idx" ON "talent_profiles"("email");

-- CreateIndex
CREATE INDEX "talent_profiles_status_idx" ON "talent_profiles"("status");

-- CreateIndex
CREATE INDEX "talent_profiles_created_at_idx" ON "talent_profiles"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- AddForeignKey
ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
