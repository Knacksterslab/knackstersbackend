/*
  Warnings:

  - You are about to drop the column `calendar_booking_id` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `reschedule_url` on the `meetings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meetings" DROP COLUMN "calendar_booking_id",
DROP COLUMN "reschedule_url";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_tips" JSONB DEFAULT '{}';
