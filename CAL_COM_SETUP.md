# Cal.com Setup Guide (Hosted Free Version)

## Quick Setup (5 minutes) ✅

We're using **Cal.com's free hosted version** - no deployment needed!

---

## Step 1: Create Cal.com Account

1. **Sign up** at https://app.cal.com/signup
   - Use your work email
   - Free forever, no credit card required

2. **Complete your profile**
   - Add your name and timezone
   - Connect your Google Calendar (optional but recommended)

---

## Step 2: Create Event Types

You need to create **2 event types**:

### Event Type 1: Client Onboarding Call
1. Go to **Event Types** → **New Event Type**
2. Settings:
   - **Title**: "Client Onboarding Call"
   - **URL**: `client-onboarding` (or your choice)
   - **Duration**: 30 minutes
   - **Description**: "Welcome! Let's discuss your project needs and how we can help."
   - **Location**: Google Meet or Zoom (your preference)

3. Click **Save**

### Event Type 2: Talent Interview
1. Create another event type
2. Settings:
   - **Title**: "Talent Interview"
   - **URL**: `talent-interview` (or your choice)
   - **Duration**: 30 minutes
   - **Description**: "Great to meet you! Let's discuss your skills and how you can join our talent network."
   - **Location**: Google Meet or Zoom

3. **Advanced Settings** (Scroll down):
   - **Redirect on Booking**: `http://localhost:3000/schedule?bookingConfirmed=true`
   - This redirects users back to your site after booking

4. Click **Save**

---

## Step 3: Get Your Booking URLs

After creating both events, you'll see them in your dashboard. Click on each to get the booking link:

```
https://cal.com/yourusername/client-onboarding
https://cal.com/yourusername/talent-interview
```

(Replace `yourusername` with your actual Cal.com username)

---

## Step 4: Update Environment Variables

Add these to your `frontend/.env.local`:

```env
# Cal.com Booking URLs (Hosted Version)
NEXT_PUBLIC_CAL_CLIENT_URL=https://cal.com/yourusername/client-onboarding
NEXT_PUBLIC_CAL_TALENT_URL=https://cal.com/yourusername/talent-interview
```

**Replace `yourusername` with your actual Cal.com username!**

---

## Step 5: Restart Frontend

```bash
cd frontend
npm run dev
```

---

## That's It! 🎉

Your scheduling is now live:
- New clients will book via the client onboarding link
- Talent applicants will book via the talent interview link
- After booking, users are redirected back to your site
- All bookings appear in your Cal.com dashboard
- Automatic email notifications to you and the attendee

**For Full Integration** (webhook support to store booking data in your database):
- See [CAL_COM_WEBHOOK_INTEGRATION.md](./CAL_COM_WEBHOOK_INTEGRATION.md)

---

## Optional Enhancements

### Connect Video Conferencing
1. Go to **Settings** → **Apps**
2. Connect **Google Meet** or **Zoom**
3. Video links auto-generate for each booking

### Add Custom Questions
1. Edit an event type
2. Go to **Advanced** → **Additional Inputs**
3. Add questions like:
   - "What's your project timeline?"
   - "What skills are you most interested in showcasing?"

### Customize Availability
1. Go to **Availability** → **Edit**
2. Set your working hours
3. Add buffer time between meetings

### Email Reminders
- Already enabled by default!
- Automatic reminders 24 hours before
- Configurable in event type settings

---

## Cost Breakdown

- **Cal.com Hosted**: $0/month (free forever)
- **Unlimited Event Types**: Included
- **Unlimited Bookings**: Included
- **Calendar Integration**: Included
- **Video Conferencing**: Included
- **Email Notifications**: Included

**Total: $0/month** 🎉

---

## Troubleshooting

### "My links aren't working"
- Make sure you're using your actual Cal.com username
- Check that event types are published (toggle in dashboard)
- Verify URLs in your `.env.local` match exactly

### "Not receiving notifications"
- Check spam folder
- Verify email in Cal.com settings
- Ensure event type has notifications enabled

### "Wrong timezone showing"
- Update timezone in Cal.com profile settings
- Timezone is auto-detected for attendees

---

## Support

- Cal.com Docs: https://cal.com/docs
- Cal.com Community: https://github.com/calcom/cal.com/discussions
- Issues: Check your Cal.com dashboard settings first

---

## Next Steps

1. ✅ Create Cal.com account
2. ✅ Set up 2 event types
3. ✅ Add URLs to `.env.local`
4. ✅ Restart frontend
5. 🎯 Test booking flow:
   - Visit http://localhost:3000/talent-network
   - Complete application form
   - Click "Schedule Interview" → Opens Cal.com
   - Book a test slot

Done! Your scheduling is production-ready.
