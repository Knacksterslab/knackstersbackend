# Project/Task Architecture

## Overview
This document describes the Project/Task hierarchy implemented in the Knacksters platform, establishing a clear single source of truth for work requests and their execution.

---

## Conceptual Model

### Projects = "Work Requests"
Projects represent client submissions - what the client needs done.

**Characteristics:**
- Created when client submits "Request New Task"
- Contains high-level request information
- Serves as the container for all related work items
- Status reflects overall progress

### Tasks = "Work Items"
Tasks represent the actual work to be done, created from project breakdown.

**Characteristics:**
- Always belongs to a Project (1 Project → Many Tasks)
- Created automatically (1 initial task) when project is created
- Manager can split into multiple tasks during review
- Can be assigned to specific Knacksters (Talent)
- Tracks time, status, and deliverables

---

## Data Flow

### Client Submits Request
```
1. Client fills out "Request New Task" form:
   - Title
   - Description
   - Priority (optional)
   - Estimated Complexity (optional)
   - Target Date (optional)

2. Backend creates:
   a) Project record
      - projectNumber (e.g., PROJ-1234567890-001)
      - title, description, priority
      - status: NOT_STARTED
      - estimatedHours (derived from complexity)
   
   b) Initial Task record
      - taskNumber (e.g., PROJ-1234567890-001-T001)
      - name = project.title
      - description = project.description
      - status: PENDING
      - priority = project.priority
      - estimatedMinutes (derived from estimatedHours)

3. Notification sent to Account Manager
```

### Manager Reviews Request
```
1. Manager sees Project with status "NOT_STARTED"
2. Manager can:
   - Review scope and complexity
   - Adjust estimates
   - Create additional Tasks if needed (breakdown)
   - Assign Talent to Tasks
   - Update Project status to "IN_PROGRESS"
```

### Dashboard Display
```
Client Dashboard shows:

┌─ Work Requests ─────────────────┐
│                                  │
│  [All Requests] [Pending] [Active]
│                                  │
│  ▼ Website Redesign              │
│    Request #PROJ-123-001         │
│    Status: Pending Review        │
│    3 tasks • 5h logged           │
│                                  │
│    Tasks:                        │
│    ├─ Design homepage (Pending)  │
│    ├─ Build contact form (Active)│
│    └─ Implement CMS (Pending)    │
│                                  │
└──────────────────────────────────┘
```

---

## Single Source of Truth

### ✅ Project Holds Master Data
- `title` - What the client wants
- `description` - Detailed requirements
- `priority` - Business priority
- `estimatedHours` - Total estimate
- `dueDate` - Client deadline
- `status` - Overall progress

### ✅ Tasks Reference Project
- `projectId` - Foreign key to Project
- `name` - Specific work item
- `status` - PENDING → ACTIVE → IN_REVIEW → COMPLETED
- `assignedToId` - Who's working on it
- `loggedMinutes` - Time tracking (rolls up to Project)

### ❌ No Redundancy
Tasks don't duplicate Project data. They only contain task-specific information:
- Assignment
- Specific due dates (if different from project)
- Time tracking
- Status (independent from project status)

---

## Status Management

### Project Status
- `NOT_STARTED` - New request, awaiting review
- `IN_PROGRESS` - Work has begun on one or more tasks
- `COMPLETED` - All tasks completed
- `ON_HOLD` - Temporarily paused
- `ARCHIVED` - Historical record

### Task Status
- `PENDING` - Created, awaiting assignment
- `ACTIVE` - Assigned and in progress
- `IN_REVIEW` - Work done, awaiting approval
- `COMPLETED` - Approved and done
- `CANCELLED` - No longer needed

---

## API Endpoints

### Client API
```
GET  /api/client/dashboard      → Returns recentProjects with tasks
POST /api/client/projects       → Creates Project + initial Task
GET  /api/client/projects       → Lists all Projects
GET  /api/client/projects/:id   → Get Project details with tasks
```

### Manager API
```
GET  /api/manager/projects      → Lists Projects needing review
POST /api/manager/projects/:id/tasks  → Create additional tasks
PUT  /api/manager/tasks/:id/assign    → Assign task to talent
```

---

## Database Schema

```prisma
model Project {
  id              String
  projectNumber   String @unique
  clientId        String
  title           String
  description     String?
  status          ProjectStatus
  priority        PriorityLevel
  estimatedHours  Decimal?
  dueDate         DateTime?
  
  tasks           Task[]
  client          User
}

model Task {
  id               String
  taskNumber       String @unique
  projectId        String
  name             String
  description      String?
  status           TaskStatus
  priority         PriorityLevel
  assignedToId     String?
  estimatedMinutes Int?
  loggedMinutes    Decimal
  dueDate          DateTime?
  
  project          Project
  assignedTo       User?
}
```

---

## Benefits of This Architecture

### 1. **Clear Hierarchy**
- Client thinks in "Requests"
- Managers think in "Projects and Tasks"
- Talent thinks in "Tasks"

### 2. **Single Source of Truth**
- Project holds request details
- Tasks only contain execution details
- No duplicate data to keep in sync

### 3. **Flexibility**
- Simple requests: 1 Project + 1 Task
- Complex projects: 1 Project + Many Tasks
- Manager decides breakdown

### 4. **Better UX**
- Client sees their request immediately
- Status is clear (Pending → Active → Complete)
- Can expand to see task breakdown
- Time tracking aggregates properly

### 5. **Scalability**
- Can add Project-level features (budgets, milestones)
- Can add Task-level features (subtasks, dependencies)
- Clean data model for reporting

---

## Migration Notes

### Changed:
- `recentTasks` → `recentProjects` in dashboard API
- `TaskSummary` → `RequestSummary` component
- Dashboard now shows Projects (expandable to Tasks)

### Maintained:
- Project/Task creation flow (already correct)
- Task assignment and time tracking
- Notification system

### Future Enhancements:
- Project templates for common request types
- Task dependencies and ordering
- Project-level budgets and invoicing
- Bulk task creation for managers

---

## Example Use Cases

### Simple Request
```
Client: "Fix login bug"
→ 1 Project + 1 Task
→ Manager assigns to developer
→ Developer completes task
→ Project marked complete
```

### Complex Request
```
Client: "Build mobile app"
→ 1 Project + 1 Initial Task
→ Manager reviews and splits:
  ├─ Task 1: UI Design (assigned to designer)
  ├─ Task 2: iOS Development (assigned to iOS dev)
  ├─ Task 3: Android Development (assigned to Android dev)
  └─ Task 4: Backend API (assigned to backend dev)
→ Each task progresses independently
→ Project completes when all tasks done
```

---

## Summary

This architecture establishes Projects as the **single source of truth** for client requests, while Tasks represent the **work breakdown** for execution. This eliminates redundancy, provides clarity, and supports both simple and complex workflows.
