# Solution-Based Manager Assignment System

This document explains the solution-based manager assignment system that automatically assigns account managers to clients based on their selected solution during signup.

## Overview

When a client signs up, they select their primary need (AI, Cybersecurity, Development, etc.), and the system automatically assigns them an account manager who specializes in that area.

## Database Changes

### New Fields Added:

**User Model:**
- `selectedSolution` (SolutionType | null) - The solution the client selected during signup
- `selectedSolutionNotes` (Text | null) - Additional notes from the client about their needs
- `specializations` (SolutionType[]) - Array of solutions a manager specializes in

### Solution Types Enum:
```typescript
enum SolutionType {
  AI_MACHINE_LEARNING
  CYBERSECURITY
  SOFTWARE_DEVELOPMENT
  DESIGN_CREATIVE
  MARKETING_GROWTH
  HEALTHCARE_LIFE_SCIENCES
  MULTIPLE
  OTHER
}
```

## Database Migration

Run this SQL on your production database (Supabase):

```sql
-- Add Solution Type enum
CREATE TYPE "SolutionType" AS ENUM (
  'AI_MACHINE_LEARNING',
  'CYBERSECURITY',
  'SOFTWARE_DEVELOPMENT',
  'DESIGN_CREATIVE',
  'MARKETING_GROWTH',
  'HEALTHCARE_LIFE_SCIENCES',
  'MULTIPLE',
  'OTHER'
);

-- Add solution selection fields for clients
ALTER TABLE "users" ADD COLUMN "selected_solution" "SolutionType";
ALTER TABLE "users" ADD COLUMN "selected_solution_notes" TEXT;

-- Add specializations array for managers
ALTER TABLE "users" ADD COLUMN "specializations" "SolutionType"[] DEFAULT ARRAY[]::"SolutionType"[];

-- Create indexes for better query performance
CREATE INDEX "users_selected_solution_idx" ON "users"("selected_solution");
CREATE INDEX "users_specializations_idx" ON "users" USING GIN("specializations");
```

**Location:** `prisma/migrations/add_solutions_and_specializations.sql`

## How It Works

### 1. Client Signup Flow

**Step 1: Account Details**
- First name, last name
- Email, password
- Company (optional)

**Step 2: Solution Selection**
- Client selects their primary need from 7 options
- Can add optional notes about their needs
- System creates account and auto-assigns manager

### 2. Manager Assignment Logic

**Priority 1: Specialized Manager**
- Finds managers who specialize in the selected solution
- Assigns the one with the fewest clients

**Priority 2: Any Available Manager (Fallback)**
- If no specialized manager found
- Assigns any active manager with the fewest clients

**Priority 3: No Assignment**
- If no managers available
- Client is created but not assigned (can be assigned later)

### 3. Manager Specializations

Managers can specialize in one or multiple solutions:
- Set via Admin Panel → Manager Management
- Managers appear in assignment pool for their specializations
- Can be updated at any time

## API Endpoints

### Client-Facing (Automatic during signup):
- `POST /api/auth/signup` - Includes `selectedSolution` and `solutionNotes` fields

### Admin Routes:

**Manager Management:**
```
GET    /api/admin/managers                      - List all managers
PATCH  /api/admin/managers/:id/specializations  - Update manager specializations
GET    /api/admin/managers/stats                - Get assignment statistics
POST   /api/admin/managers/bulk-assign          - Bulk assign unassigned clients
POST   /api/admin/managers/reassign             - Reassign client to different manager
```

## Admin Panel Features

### Manager Specialization Management
(Located at `/admin-dashboard/managers`)

**Features:**
- View all managers and their specializations
- Edit manager specializations (multi-select)
- See client counts per manager
- View assignment distribution by solution

### Assignment Statistics
- Total managers by specialization
- Average clients per manager
- Count of unassigned clients
- Distribution of clients by solution

### Manual Management
- Reassign clients to different managers
- Bulk assign all unassigned clients
- View manager workload

## Setup Instructions

### 1. Run Database Migration

```bash
# Connect to your Supabase database via Prisma Studio or SQL Editor
# Run the migration SQL from prisma/migrations/add_solutions_and_specializations.sql
```

### 2. Set Manager Specializations

1. Go to Admin Dashboard → Manager Management
2. For each manager, select their specializations:
   - AI & Machine Learning
   - Cybersecurity
   - Software Development
   - Design & Creative
   - Marketing & Growth
   - Healthcare & Life Sciences

3. Save changes

### 3. Test the Flow

1. Sign up as a new client
2. Select a solution during signup
3. Check that manager is auto-assigned
4. Verify manager has specialization in that solution

### 4. Handle Existing Clients (Optional)

For clients created before this feature:

**Option A: Bulk Assign**
```bash
POST /api/admin/managers/bulk-assign
```

**Option B: Manual Assignment**
- Go to Admin Dashboard → User Management
- Select each unassigned client
- Manually assign appropriate manager

## Client Dashboard Update

Clients now see their assigned manager on their dashboard:
- Manager name
- Manager specialization (if matches their solution)
- Contact information
- Quick message button

## Notifications (Future Enhancement)

**Email to Client:**
- Welcome email with manager introduction
- Manager contact details
- Scheduling link for initial call

**Email to Manager:**
- New client assigned notification
- Client details and selected solution
- Client notes (if provided)

## Monitoring & Analytics

**Track:**
- Signup conversion by solution
- Most popular solutions
- Manager workload balance
- Client satisfaction by solution

**Dashboard Metrics:**
- Clients per solution
- Managers per solution
- Average assignment time
- Unassigned client count

## Troubleshooting

### No Manager Assigned After Signup
**Cause:** No active managers available
**Solution:** Add managers or activate existing ones

### Wrong Manager Assigned
**Cause:** Manager specializations not set
**Solution:** Update manager specializations in admin panel

### Uneven Distribution
**Cause:** One solution much more popular than others
**Solution:** 
- Add more managers for popular solutions
- Enable managers to handle multiple solutions

## Future Enhancements

1. **Multi-Solution Matching** - If client selects "MULTIPLE", assign manager with most overlapping specializations
2. **Manager Capacity Limits** - Set max clients per manager
3. **Manager Availability** - Track manager availability (on leave, etc.)
4. **Smart Reassignment** - Automatically rebalance when managers added/removed
5. **Client Preferences** - Allow clients to request manager change
6. **Manager Profiles** - Show manager bios to clients during assignment

## Code Locations

**Backend:**
- Service: `src/services/ManagerAssignmentService.ts`
- Routes: `src/routes/admin/managers.ts`
- Signup: `src/config/supertokens.ts` (signUpPOST override)
- Schema: `prisma/schema.prisma`

**Frontend:**
- Signup: `components/SignUpPage.tsx`
- Solution Selector: `components/signup/SolutionSelector.tsx`
- Admin Panel: `app/(admin)/admin-dashboard/managers/` (to be created)

## Support

For questions or issues:
1. Check logs: Railway backend logs for assignment errors
2. Run stats: `GET /api/admin/managers/stats`
3. Verify database: Check `users` table for correct data
