# Environment Variables Setup

## Frontend Environment Variables

Create a `frontend/.env.local` file with the following variables:

### Required Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Cal.com Scheduling (Hosted Free Version)
# Replace 'yourusername' with your actual Cal.com username
NEXT_PUBLIC_CAL_CLIENT_URL=https://cal.com/yourusername/client-onboarding
NEXT_PUBLIC_CAL_TALENT_URL=https://cal.com/yourusername/talent-interview

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
```

### Optional Variables

```env
# Analytics & Monitoring (Optional)
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## Backend Environment Variables

Create a `backend/.env` file with the following variables:

### Required Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/knacksters?schema=public"

# SuperTokens Configuration
SUPERTOKENS_CONNECTION_URI=https://try.supertokens.com
SUPERTOKENS_API_KEY=your_supertokens_api_key

# Application
APP_NAME=Knacksters
API_DOMAIN=http://localhost:3001
WEBSITE_DOMAIN=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Admin Authentication
ADMIN_PASSWORD=your_secure_admin_password

# Cal.com Webhook (Optional - for booking integration)
CAL_COM_WEBHOOK_SECRET=your_calcom_webhook_secret
```

### Optional Variables

```env
# Email Configuration (Optional - for notifications)
# EMAIL_FROM=noreply@knacksters.com
# EMAIL_SERVER_HOST=smtp.gmail.com
# EMAIL_SERVER_PORT=587
# EMAIL_SERVER_USER=your-email@gmail.com
# EMAIL_SERVER_PASSWORD=your-app-password

# Google Calendar (Optional - currently not used, replaced by Cal.com)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

---

## Setup Instructions

### 1. Cal.com Scheduling Setup

**See [CAL_COM_SETUP.md](./CAL_COM_SETUP.md) for detailed instructions.**

Quick steps:
1. Sign up at https://app.cal.com/signup (FREE)
2. Create 2 event types: "Client Onboarding" and "Talent Interview"
3. Get your booking URLs
4. Update `NEXT_PUBLIC_CAL_CLIENT_URL` and `NEXT_PUBLIC_CAL_TALENT_URL` in `frontend/.env.local`

### 2. Database Setup

1. Install PostgreSQL locally or use a cloud provider (Supabase, Neon, etc.)
2. Create a database named `knacksters`
3. Update `DATABASE_URL` in `backend/.env`
4. Run migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

### 3. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the Stripe dashboard
3. Update `STRIPE_SECRET_KEY` (backend) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (frontend)

### 4. SuperTokens Setup

1. Sign up at https://supertokens.com
2. Create a new app
3. Get your Connection URI and API Key
4. Update `SUPERTOKENS_CONNECTION_URI` and `SUPERTOKENS_API_KEY` in `backend/.env`

### 5. Cal.com Webhook Setup (Optional)

For full booking integration where booking data is stored in your database:

1. Go to Cal.com → **Settings** → **Developer** → **Webhooks**
2. Click **New Webhook**
3. Configure:
   - **Subscriber URL**: `http://localhost:3001/api/webhooks/calcom` (development)
   - **Trigger Events**: Select "Booking Created"
   - **Secret**: Generate a secure secret (e.g., `openssl rand -hex 32`)
4. Add `CAL_COM_WEBHOOK_SECRET` to `backend/.env`
5. For local testing, use ngrok: `ngrok http 3001`
6. See [CAL_COM_WEBHOOK_INTEGRATION.md](./CAL_COM_WEBHOOK_INTEGRATION.md) for details

---

## Verification

After setting up environment variables:

### Check Frontend
```bash
cd frontend
npm run dev
# Visit http://localhost:3000
# Check browser console for any API URL errors
```

### Check Backend
```bash
cd backend
npm run dev
# Should see "Server running on port 3001"
# No database connection errors
```

### Check Integrations
1. **Cal.com**: Visit `/talent-network`, complete form, click "Schedule Interview" → should open Cal.com booking page
2. **Database**: Create a test user, check it appears in database
3. **Stripe**: Visit billing page (when logged in as client), should load without errors

---

## Security Notes

⚠️ **NEVER commit `.env` or `.env.local` files to git!**

- Both files are already in `.gitignore`
- Use strong passwords for production
- Rotate secrets regularly
- Use different keys for development and production

---

## Troubleshooting

### "Cal.com links not working"
- Verify URLs in `.env.local` match your Cal.com event URLs exactly
- Restart frontend dev server after changing env vars

### "Database connection failed"
- Check PostgreSQL is running: `psql -U your_user -d knacksters`
- Verify `DATABASE_URL` format and credentials
- Try connection URL without `?schema=public` suffix first

### "Stripe errors"
- Make sure you're using **test** keys (start with `pk_test_` and `sk_test_`)
- Check keys are copied fully without spaces
- Verify Stripe account is activated

### "SuperTokens errors"
- Verify Connection URI and API Key are correct
- Check `API_DOMAIN` and `WEBSITE_DOMAIN` match your actual URLs
- Ensure CORS is configured properly

---

## Production Checklist

Before deploying to production:

- [ ] Use production database URL
- [ ] Use production Stripe keys (live mode)
- [ ] Set `NODE_ENV=production`
- [ ] Generate new `ADMIN_PASSWORD` (strong password)
- [ ] Update `FRONTEND_URL`, `API_DOMAIN`, `WEBSITE_DOMAIN` to production URLs
- [ ] Update Cal.com URLs if using custom domain
- [ ] Set up email service (optional but recommended)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL certificates
- [ ] Set secure session cookies
