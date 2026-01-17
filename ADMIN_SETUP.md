# Admin User Setup Guide

## Overview

Admin authentication is handled through **SuperTokens** with proper user accounts that have the `ADMIN` role. This is more secure than simple password-based authentication.

## How It Works

1. **Admin users are stored in the database** with `role = 'ADMIN'`
2. **Admins sign in through SuperTokens** (same authentication flow as regular users)
3. **SuperTokens session includes the ADMIN role** from the database
4. **Protected admin routes** verify both SuperTokens session AND ADMIN role

## Creating Admin Users

### Method 1: Using the Admin Creation Script (Recommended)

Run the interactive script:

```bash
npm run create-admin
```

Or specify email via environment variable:

```bash
ADMIN_EMAIL=admin@example.com npm run create-admin
```

The script will:
- Create a new user with ADMIN role
- OR update an existing user to ADMIN role
- Guide you through next steps

### Method 2: Using Database Seed

The seed file automatically creates an admin user. Run:

```bash
npm run prisma:seed
```

This creates:
- Email: `admin@knacksters.com`
- Role: `ADMIN`
- Name: `Admin User`

### Method 3: Direct Database Insert (Production)

Connect to your production database and run:

```sql
INSERT INTO users (
  id, 
  email, 
  role, 
  "first_name", 
  "last_name", 
  "full_name", 
  status, 
  "created_at", 
  "updated_at"
)
VALUES (
  gen_random_uuid(),
  'your-admin@example.com',  -- Change this!
  'ADMIN',
  'Your',
  'Name',
  'Your Name',
  'ACTIVE',
  NOW(),
  NOW()
);
```

## Admin Login Flow

1. **Admin user must exist in database** with `role = 'ADMIN'`
2. **Admin signs up/logs in via SuperTokens**:
   - Use your app's signup/login page
   - Sign up with the admin email address
   - Complete SuperTokens authentication
3. **SuperTokens creates session with ADMIN role**
4. **Admin can now access admin endpoints**

## Admin Endpoints

All admin endpoints require:
- Valid SuperTokens session
- User role = ADMIN

### Example Admin Endpoints

```
GET  /api/admin/auth/status          - Check admin authentication status
GET  /api/admin/dashboard/...        - Admin dashboard data
POST /api/admin/partners/...         - Manage partners
PUT  /api/admin/content/...          - Update content
POST /api/admin/upload/...           - Upload files
```

## Verification

### Check if User is Admin

```bash
# Get user from database
npx prisma studio

# Or via SQL
SELECT email, role, status FROM users WHERE role = 'ADMIN';
```

### Test Admin Authentication

1. Sign up/log in with admin email
2. Get SuperTokens session cookie
3. Call admin endpoint:

```bash
curl https://your-api.com/api/admin/auth/status \
  -H "Cookie: sAccessToken=..." \
  -H "anti-csrf: ..."
```

Should return:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "role": "ADMIN",
      ...
    },
    "authenticated": true
  }
}
```

## Security Notes

### ✅ Secure Practices

- Admins authenticate through SuperTokens (OAuth, email/password, etc.)
- Admin role is stored in database and verified on each request
- SuperTokens handles session security, CSRF protection, etc.
- Role verification happens server-side on every admin request

### ⚠️ Important

- **Do not** share admin login credentials
- **Do not** create admin users with weak passwords
- **Always** use HTTPS in production
- **Monitor** admin actions via activity logs
- **Rotate** admin access regularly

## Troubleshooting

### "Forbidden: Insufficient permissions"

- User logged in but doesn't have ADMIN role
- Check database: `SELECT role FROM users WHERE email = 'admin@example.com'`
- Update role if needed: `UPDATE users SET role = 'ADMIN' WHERE email = '...'`

### "Unauthorized"

- No valid SuperTokens session
- User needs to log in via SuperTokens
- Check session cookies are being sent

### Admin user exists but can't log in

- Admin might not have completed SuperTokens signup
- Have them sign up via your app with their admin email
- SuperTokens will link to existing user record

## Production Deployment

### Railway / Render / Other Hosting

1. **Deploy your backend**
2. **Run migrations**: `npx prisma migrate deploy`
3. **Create admin user**:
   ```bash
   # SSH into your server or use platform terminal
   npm run create-admin
   ```
4. **Or use SQL** directly on your production database
5. **Admin signs up** via your frontend application
6. **Verify access** by calling `/api/admin/auth/status`

### Environment Variables

Remove `ADMIN_PASSWORD` from your environment variables - it's no longer needed!

Required environment variables:
- `DATABASE_URL` - Your database connection
- `SUPERTOKENS_CONNECTION_URI` - SuperTokens core URL
- `SUPERTOKENS_API_KEY` - SuperTokens API key
- All other standard app variables

## Migration from Old System

If you had the simple password-based admin auth:

1. ✅ **Updated**: `/api/admin/auth/*` now uses SuperTokens
2. ✅ **Removed**: `ADMIN_PASSWORD` environment variable
3. ✅ **Added**: Admin user creation script
4. ✅ **Updated**: All admin routes use `requireAuth` + `requireRole(ADMIN)`

### Frontend Changes Needed

Update admin login to use SuperTokens:

```typescript
// Before (old - password only)
POST /api/admin/auth/login
{ "password": "secret" }

// After (new - SuperTokens)
// Use SuperTokens SDK for login
import { signIn } from "supertokens-auth-react/recipe/emailpassword";

await signIn({
  formFields: [{
    id: "email",
    value: "admin@example.com"
  }, {
    id: "password", 
    value: "admin-password"
  }]
});

// Then call admin endpoints - session is handled automatically
fetch('/api/admin/auth/status');
```

## Support

For issues:
1. Check this guide
2. Verify database role is set correctly
3. Ensure SuperTokens is configured properly
4. Check browser console for session errors
5. Review server logs for authentication errors
