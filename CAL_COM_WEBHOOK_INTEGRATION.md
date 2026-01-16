# Cal.com Webhook & Redirect Integration

## Overview

This guide shows how to capture booking data from Cal.com and redirect users back to your site after they book a meeting.

---

## Method 1: Success Redirect URL (Quick Setup)

### Step 1: Configure Cal.com Event Type

1. Go to Cal.com → **Event Types** → Edit "Talent Interview"
2. Scroll to **Advanced Settings**
3. Find **"Redirect on Booking"**
4. Set redirect URL:
   ```
   http://localhost:3000/schedule?bookingConfirmed=true
   ```

5. Save changes

### Step 2: Update ScheduleFlow Component

The component will detect the `bookingConfirmed=true` query parameter and automatically show the confirmation message.

**Pros:**
- ✅ No backend changes needed
- ✅ Works immediately
- ✅ Simple to set up

**Cons:**
- ❌ No booking data stored in your database
- ❌ User can skip booking and manually add `?bookingConfirmed=true`

---

## Method 2: Webhooks (Recommended - Full Integration)

### Step 1: Create Webhook Endpoint

Your backend will receive booking notifications from Cal.com.

**Endpoint:** `POST /api/webhooks/cal-com`

This endpoint will:
1. Receive booking data from Cal.com
2. Store booking info in your database (linked to TalentProfile)
3. Return success response

### Step 2: Configure Cal.com Webhook

1. Go to Cal.com → **Settings** → **Developer** → **Webhooks**
2. Click **New Webhook**
3. Configure:
   - **Subscriber URL**: `http://your-backend-url/api/webhooks/cal-com`
   - **Trigger Events**: Select "Booking Created"
   - **Secret**: Generate a secure secret (save this!)

4. For local testing, use ngrok:
   ```bash
   ngrok http 3001
   # Use the ngrok URL: https://abc123.ngrok.io/api/webhooks/cal-com
   ```

### Step 3: Add Webhook Secret to Environment

Add to `backend/.env`:
```env
CAL_COM_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 4: Backend Implementation

The webhook endpoint will:
- Verify the webhook signature
- Extract booking details (date, time, attendee email)
- Update the TalentProfile with booking information
- Return success

### Step 5: Frontend Flow

1. User clicks "Open Booking Calendar" → Opens Cal.com
2. User books a time slot on Cal.com
3. Cal.com sends webhook to your backend
4. Backend stores booking data
5. Cal.com redirects user back to: `http://localhost:3000/schedule?bookingId=abc123`
6. ScheduleFlow component:
   - Detects `bookingId` parameter
   - Fetches booking details from your backend
   - Displays confirmation with meeting details
   - Shows "Complete" button

---

## Booking Data You'll Receive

Cal.com webhook payload includes:

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2026-01-11T...",
  "payload": {
    "type": "talent-interview",
    "title": "Talent Interview",
    "startTime": "2026-01-15T14:00:00Z",
    "endTime": "2026-01-15T14:30:00Z",
    "attendees": [
      {
        "email": "applicant@example.com",
        "name": "John Doe",
        "timeZone": "America/New_York"
      }
    ],
    "organizer": {
      "email": "you@knacksters.com",
      "name": "Your Name"
    },
    "location": "https://meet.google.com/abc-defg-hij",
    "uid": "booking-unique-id-123"
  }
}
```

---

## Implementation Summary

**What gets stored in your database:**
- ✅ Booking ID (from Cal.com)
- ✅ Meeting date & time
- ✅ Video link (Google Meet / Zoom)
- ✅ Attendee details
- ✅ Linked to TalentProfile

**User experience:**
1. User fills out talent application
2. User clicks "Schedule Interview" → Cal.com opens
3. User books meeting on Cal.com
4. **Cal.com redirects back** to your site
5. Your site shows: "✅ Interview booked for Jan 15 at 2:00 PM"
6. User clicks "Complete" to finish

---

## Security

**Webhook Verification:**
- Cal.com signs webhooks with HMAC-SHA256
- Your backend verifies the signature before processing
- Prevents fake booking submissions

**Redirect URL:**
- Only shows confirmation if booking exists in database
- Prevents users from faking completion

---

## Testing

### Test Webhook Locally

1. Start backend with ngrok:
   ```bash
   # Terminal 1
   cd backend
   npm run dev

   # Terminal 2
   ngrok http 3001
   ```

2. Copy ngrok URL to Cal.com webhook settings

3. Book a test meeting on Cal.com

4. Check backend logs for webhook payload

5. Verify booking appears in database

---

## Production Setup

1. Deploy backend to production
2. Update Cal.com webhook URL to production domain:
   ```
   https://api.knacksters.com/api/webhooks/cal-com
   ```

3. Update redirect URL in Cal.com event types:
   ```
   https://knacksters.com/schedule?bookingConfirmed=true
   ```

4. Add `CAL_COM_WEBHOOK_SECRET` to production env vars

---

## Next Steps

Want me to implement this? I can:

1. ✅ Create the webhook endpoint (`/api/webhooks/cal-com`)
2. ✅ Update database schema to store booking data
3. ✅ Update `ScheduleFlow.tsx` to detect redirects and show confirmation
4. ✅ Add booking verification API endpoint
5. ✅ Update environment setup docs

Just say "yes" and I'll implement the full webhook integration!
