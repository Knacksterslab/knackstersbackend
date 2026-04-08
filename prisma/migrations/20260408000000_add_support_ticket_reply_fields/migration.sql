-- Add admin reply fields to support_tickets
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "last_reply" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "replied_at" TIMESTAMP(3);
