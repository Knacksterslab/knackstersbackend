/*
  Warnings:

  - You are about to drop the column `google_calendar_event_id` on the `talent_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "talent_profiles" DROP COLUMN "google_calendar_event_id",
ADD COLUMN     "attendee_name" TEXT,
ADD COLUMN     "attendee_timezone" TEXT,
ADD COLUMN     "calendar_booking_id" TEXT;
