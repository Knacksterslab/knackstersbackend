# Admin Access Setup

## Security Model

Admin access is controlled by:

1. SuperTokens authentication (valid session required)
2. Database role check (`users.role = 'ADMIN'`)

Public signup is always forced to `CLIENT` server-side. Privileged roles are not assignable from public forms.

## Supported Admin Creation Flow

Only one bootstrap flow is supported:

1. Create or update the bootstrap admin directly in the database
2. Sign in via normal SuperTokens login using that email
3. Create additional admins/managers/talent from Admin Dashboard (`/api/admin/users`)

Bootstrap admin email for this project:

- `godmode@knacksters.co`

## Bootstrap SQL (one-time)

```sql
UPDATE users
SET role = 'ADMIN', status = 'ACTIVE'
WHERE email = 'godmode@knacksters.co';

INSERT INTO users (
  id,
  email,
  role,
  first_name,
  last_name,
  full_name,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'godmode@knacksters.co',
  'ADMIN',
  'God',
  'Mode',
  'God Mode',
  'ACTIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'godmode@knacksters.co'
);
```

## Verification

```sql
SELECT email, role, status
FROM users
WHERE email = 'godmode@knacksters.co';
```

Expected:

- role = `ADMIN`
- status = `ACTIVE`

Then verify API access after login:

```bash
GET /api/admin/auth/status
```

## Decommissioned Methods

These are intentionally removed from the supported setup:

- `scripts/create-admin.ts`
- `npm run create-admin`
- creating admin users via `prisma:seed`
- `ADMIN_PASSWORD` env-based admin auth
