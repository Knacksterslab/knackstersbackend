-- AlterTable
ALTER TABLE "talent_profiles" ADD COLUMN     "google_calendar_event_id" TEXT,
ADD COLUMN     "meeting_link" TEXT,
ADD COLUMN     "scheduled_end_time" TIMESTAMP(3),
ADD COLUMN     "scheduled_start_time" TIMESTAMP(3);
