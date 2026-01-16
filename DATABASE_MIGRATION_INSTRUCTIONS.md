# Database Migration Instructions

## Recent Schema Changes

We've updated the `TalentProfile` model to support Cal.com booking integration.

### Changes Made:

1. **Renamed field**: `googleCalendarEventId` → `calendarBookingId`
2. **Added fields**:
   - `attendeeName` - Name from Cal.com booking
   - `attendeeTimezone` - Timezone from Cal.com booking

---

## Apply Migration

Run the following command to update your database:

```bash
cd backend
npx prisma migrate dev --name add_calcom_booking_fields
```

This will:
- ✅ Create a new migration file
- ✅ Apply changes to your database
- ✅ Regenerate Prisma Client

---

## Manual Migration (if needed)

If automatic migration fails, run this SQL manually:

```sql
-- Rename column
ALTER TABLE "talent_profiles" 
RENAME COLUMN "google_calendar_event_id" TO "calendar_booking_id";

-- Add new columns
ALTER TABLE "talent_profiles" 
ADD COLUMN "attendee_name" TEXT,
ADD COLUMN "attendee_timezone" TEXT;
```

---

## Verify Migration

After migrating, verify the changes:

```bash
npx prisma studio
```

Check the `TalentProfile` table for the new fields.

---

## Rollback (if needed)

To rollback this migration:

```bash
npx prisma migrate reset
```

⚠️ **Warning**: This will delete all data! Only use in development.

---

## Production Deployment

For production, run:

```bash
npx prisma migrate deploy
```

This applies pending migrations without prompting.
