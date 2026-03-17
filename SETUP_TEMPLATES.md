# Task Templates Setup Guide

## 🚀 Quick Start

Follow these steps to enable task templates in your manager dashboard:

---

## Step 1: Run Database Migration

The task template models need to be added to your database.

```bash
# Navigate to backend directory
cd knackstersbackend

# Run the migration
npx prisma migrate dev

# When prompted, name it: add_task_templates
```

**What this does:**
- Creates `task_templates` table
- Creates `task_template_items` table
- Adds foreign keys and indexes
- Updates Prisma client

---

## Step 2: Seed Pre-Built Templates

We've included 5 professional templates ready to use.

```bash
# From backend directory
npx ts-node scripts/seed-templates.ts
```

**Templates that will be created:**
1. Website Development Project (9 tasks, 57h)
2. Mobile App Development (7 tasks, 54h)
3. Marketing Campaign Setup (6 tasks, 26h)
4. Client Onboarding Process (5 tasks, 7h)
5. API Integration Project (6 tasks, 24h)

**Output:**
```
🌱 Seeding task templates...
✅ Using manager: John Manager
✅ Created template: Website Development Project (9 tasks)
✅ Created template: Mobile App Development (7 tasks)
✅ Created template: Marketing Campaign Setup (6 tasks)
✅ Created template: Client Onboarding Process (5 tasks)
✅ Created template: API Integration Project (6 tasks)
🎉 Template seeding complete!
```

---

## Step 3: Restart Backend Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

---

## Step 4: Test Templates

### **In Manager Dashboard:**

1. Navigate to `/manager-dashboard/assignments`
2. Click **"Apply Template"** (blue button in header)
3. You should see 5 templates available
4. Select "Website Development Project"
5. Review the 9 tasks that will be created
6. Click "Apply Template"
7. ✅ Success! 9 tasks created instantly

---

## 🎯 Verify Installation

### **Check Database:**
```sql
-- Verify templates table exists
SELECT * FROM task_templates;

-- Should show 5 templates

-- Check template items
SELECT tt.name as template, tti.name as task, tti.estimated_minutes 
FROM task_templates tt
JOIN task_template_items tti ON tti.template_id = tt.id
ORDER BY tt.name, tti.order_index;

-- Should show ~40 tasks across 5 templates
```

### **Check API:**
```bash
# Test get templates endpoint (requires manager auth)
curl http://localhost:5000/api/manager/templates \
  -H "Cookie: [your-session-cookie]"

# Should return JSON with 5 templates
```

### **Check Frontend:**
1. Login as manager
2. Go to Assignments page
3. Click "Apply Template"
4. Should see:
   - Category filters
   - 5 templates displayed
   - Task counts shown
   - Can expand to see task details

---

## 🛠️ Troubleshooting

### **Issue: Migration Fails**
**Error:** `Table already exists`

**Solution:**
```bash
# Check if tables exist
npx prisma db pull

# If tables exist, just update Prisma client
npx prisma generate
```

### **Issue: Seed Script Fails**
**Error:** `No manager found`

**Solution:**
Create a manager user first from an existing admin account:
```bash
# Use Admin Dashboard -> Users -> Create User (Role: MANAGER)
```

### **Issue: Templates Don't Show in UI**
**Checklist:**
- [ ] Backend server restarted?
- [ ] Migration ran successfully?
- [ ] Seed script completed?
- [ ] Manager user exists?
- [ ] Browser cache cleared?

**Debug:**
```bash
# Check database directly
npx prisma studio
# Navigate to task_templates table
# Verify 5 records exist with isPublic=true
```

### **Issue: Can't Apply Template**
**Error:** "You do not have access to this template"

**Solution:**
- Template must be public OR created by you
- Check template.isPublic in database
- Verify you're logged in as manager

---

## 🎓 Creating Custom Templates

### **Via API (Postman/cURL):**

```bash
POST /api/manager/templates
Content-Type: application/json
Cookie: [manager-session]

{
  "name": "Custom Workflow",
  "description": "My custom task workflow",
  "category": "Custom",
  "isPublic": false,
  "tasks": [
    {
      "name": "Task 1",
      "description": "First task",
      "priority": "HIGH",
      "estimatedMinutes": 240
    },
    {
      "name": "Task 2",
      "description": "Second task",
      "priority": "MEDIUM",
      "estimatedMinutes": 360
    }
  ]
}
```

### **Via UI (Coming in Priority 4):**
We can add a template management page where managers can:
- Create new templates visually
- Edit existing templates
- Delete templates
- Toggle public/private
- Drag-and-drop task ordering

---

## 📊 Template Categories

Current categories in seed data:
- Web Development
- Mobile Development
- Marketing
- Onboarding
- Backend Development

**To add more categories:**
Just create templates with new category names. The UI will automatically show them in filters.

---

## 🎉 You're All Set!

Templates are now ready to use. Managers will save **15-20 minutes** every time they apply a template instead of creating tasks manually.

**Recommended Next:**
- Create 2-3 custom templates for your most common project types
- Train managers on template usage
- Monitor which templates are most popular
- Gather feedback for new templates to add

---

**Need Help?**
- Check logs: Backend console for errors
- Test endpoints: Use Postman to verify API
- Inspect database: `npx prisma studio`
- Check frontend console: Browser DevTools

🚀 **Happy templating!**
