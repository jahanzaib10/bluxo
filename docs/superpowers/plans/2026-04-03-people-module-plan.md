# People Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full HR system under the People module — Directory (employees/contractors), Payroll, Leave & Time-off, Onboarding, Performance, Benefits, and Person Documents.

**Architecture:** Extend the `people` table with all HR-specific fields. Create 14 new tables across 4 schema modules. Build a `people` backend module with sub-routes for each domain. Replace the old Employees UI with a modern People module featuring a directory page with type tabs, a person detail page with sub-tabs, and dedicated pages for Payroll, Leave, Onboarding, Performance, and Benefits.

**Tech Stack:** Drizzle ORM, Express.js, React 18, TanStack React Query, Radix UI/shadcn, Tailwind CSS, Zod

**Spec:** `docs/superpowers/specs/2026-04-03-bluxo-multi-org-platform-design.md` — Section 5

**Depends on:** Plan 1 (Foundation) and Plan 2 (Roles & Finance) — both completed.

---

## File Structure

### New files to create

```
shared/schema/
  people-hr.ts            — payroll, leave, onboarding, performance, benefits, documents tables

server/modules/people/
  routes.ts               — People directory CRUD + enhanced fields
  storage.ts              — People DB queries
  payroll-routes.ts       — Payroll runs and items
  payroll-storage.ts      — Payroll DB queries
  leave-routes.ts         — Leave policies, balances, requests
  leave-storage.ts        — Leave DB queries
  onboarding-routes.ts    — Onboarding templates, steps, progress
  onboarding-storage.ts   — Onboarding DB queries
  performance-routes.ts   — Performance reviews and goals
  performance-storage.ts  — Performance DB queries
  benefits-routes.ts      — Benefit plans and enrollments
  benefits-storage.ts     — Benefits DB queries

client/src/modules/people/
  pages/
    PeopleDirectory.tsx   — Directory with All/Employees/Contractors tabs
    PersonDetail.tsx      — Detail page with Profile/Documents/Payroll/Leave/Performance tabs
    PayrollPage.tsx       — Payroll runs list + create run
    LeavePage.tsx         — Leave policies, balances, requests
    OnboardingPage.tsx    — Onboarding templates + person progress
    PerformancePage.tsx   — Performance reviews and goals
    BenefitsPage.tsx      — Benefit plans and enrollments
```

### Files to modify

```
shared/schema.ts              — Extend people table fields, re-export new schema module
server/index.ts               — Register people module routes
client/src/App.tsx             — Add People sub-routes
client/src/components/layout/Layout.tsx — Update People nav with sub-items
```

---

## Task 1: Extend people table with all HR fields

**Files:**
- Modify: `shared/schema.ts`

- [ ] **Step 1: Read the current people table definition**

Read `shared/schema.ts` and find the `people` table.

- [ ] **Step 2: Add missing HR fields to the people table**

Add these columns to the `people` table (after the existing fields, before `organizationId`):

```typescript
// Personal info (missing)
dateOfBirth: date("date_of_birth"),
nationality: varchar("nationality"),
address: text("address"),

// Employee-specific (null for contractors)
employmentType: varchar("employment_type", { enum: ["full_time", "part_time"] }),
salary: decimal("salary", { precision: 12, scale: 2 }),
salaryFrequency: varchar("salary_frequency", { enum: ["monthly", "bi_weekly", "weekly", "annually"] }),
salaryCurrency: varchar("salary_currency", { length: 3 }),

// Contractor-specific (null for employees)
hourlyRate: decimal("hourly_rate", { precision: 12, scale: 2 }),
contractRate: decimal("contract_rate", { precision: 12, scale: 2 }),
rateCurrency: varchar("rate_currency", { length: 3 }),
contractStartDate: date("contract_start_date"),
contractEndDate: date("contract_end_date"),

// Shared
paymentSourceId: uuid("payment_source_id"),
```

Also add `updatedAt: timestamp("updated_at").defaultNow()` if not already present.

- [ ] **Step 3: Update insertPersonSchema**

Replace the existing `insertPersonSchema` with a more complete version:

```typescript
export const insertPersonSchema = z.object({
  type: z.enum(["employee", "contractor"]).default("employee"),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  country: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  seniorityLevel: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time"]).optional().nullable(),
  salary: z.string().optional().nullable(),
  salaryFrequency: z.enum(["monthly", "bi_weekly", "weekly", "annually"]).optional().nullable(),
  salaryCurrency: z.string().max(3).optional().nullable(),
  hourlyRate: z.string().optional().nullable(),
  contractRate: z.string().optional().nullable(),
  rateCurrency: z.string().max(3).optional().nullable(),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  paymentSourceId: z.string().uuid().optional().nullable(),
  directManagerId: z.string().uuid().optional().nullable(),
  groupName: z.string().optional(),
});
```

- [ ] **Step 4: Push schema and commit**

```bash
npx drizzle-kit push
git add shared/schema.ts
git commit -m "feat: extend people table with full HR fields — personal, salary, contractor rates"
```

---

## Task 2: Create HR schema tables (payroll, leave, onboarding, performance, benefits, documents)

**Files:**
- Create: `shared/schema/people-hr.ts`
- Modify: `shared/schema.ts` (re-export)

- [ ] **Step 1: Create the HR schema module**

Create `shared/schema/people-hr.ts` with ALL 14 tables: `payrollRuns`, `payrollItems`, `leavePolicies`, `leaveBalances`, `leaveRequests`, `onboardingTemplates`, `onboardingSteps`, `onboardingProgress`, `performanceReviews`, `performanceGoals`, `benefitPlans`, `benefitEnrollments`, `personDocuments`.

Each table needs:
- Proper Drizzle column definitions matching the spec
- `organizationId` FK where specified
- Relations
- Zod insert schemas
- Type exports

Key imports needed:
```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, date, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { organizations, people, users } from "../schema";
```

Include ALL tables from the spec Section 5: payroll_runs, payroll_items, leave_policies, leave_balances, leave_requests, onboarding_templates, onboarding_steps, onboarding_progress, performance_reviews, performance_goals, benefit_plans, benefit_enrollments, person_documents.

Include Zod schemas for each: `insertPayrollRunSchema`, `insertPayrollItemSchema`, `insertLeavePolicySchema`, `insertLeaveRequestSchema`, `insertOnboardingTemplateSchema`, `insertOnboardingStepSchema`, `insertPerformanceReviewSchema`, `insertPerformanceGoalSchema`, `insertBenefitPlanSchema`, `insertBenefitEnrollmentSchema`, `insertPersonDocumentSchema`.

- [ ] **Step 2: Re-export from main schema**

Add to `shared/schema.ts`:
```typescript
export * from "./schema/people-hr";
```

- [ ] **Step 3: Push schema and commit**

```bash
npx drizzle-kit push
git add shared/schema/people-hr.ts shared/schema.ts
git commit -m "feat: add 13 HR tables — payroll, leave, onboarding, performance, benefits, documents"
```

---

## Task 3: Create people backend module (directory CRUD)

**Files:**
- Create: `server/modules/people/routes.ts`
- Create: `server/modules/people/storage.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create people storage**

The storage should have methods for:
- `getPeopleByOrg(organizationId)` — all people, ordered by firstName
- `getPeopleByType(organizationId, type)` — filtered by employee/contractor
- `getPersonById(id, organizationId)` — single person with full details
- `createPerson(data, organizationId)` — insert with all new fields
- `updatePerson(id, data, organizationId)` — update
- `deletePerson(id, organizationId)` — delete
- `getPeopleCount(organizationId)` — count by type for dashboard

All queries org-scoped. Import from `@shared/schema`: `people`, `organizations`. Import `eq, and, desc, sql` from `drizzle-orm`.

- [ ] **Step 2: Create people routes**

Express Router with `router.use("/api", requireOrg)`:

```
GET    /api/people                — list all (optional ?type=employee|contractor filter)
GET    /api/people/:id            — get person detail
POST   /api/people                — create person
PUT    /api/people/:id            — update person
DELETE /api/people/:id            — delete person
GET    /api/people/stats          — count by type
```

Use `insertPersonSchema` for validation on create.

- [ ] **Step 3: Register in server/index.ts**

```typescript
import peopleRoutes from "./modules/people/routes";
app.use(peopleRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add server/modules/people/routes.ts server/modules/people/storage.ts server/index.ts
git commit -m "feat: add people directory backend — CRUD with type filtering and stats"
```

---

## Task 4: Create payroll backend

**Files:**
- Create: `server/modules/people/payroll-routes.ts`
- Create: `server/modules/people/payroll-storage.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create payroll storage**

Methods:
- `getPayrollRunsByOrg(organizationId)` — list runs ordered by period desc
- `getPayrollRunById(id, organizationId)` — run with items
- `createPayrollRun(data, organizationId)` — create run
- `addPayrollItem(data)` — add item to a run
- `updatePayrollRun(id, data, organizationId)` — update status, totals
- `deletePayrollRun(id, organizationId)` — delete run (cascade items)
- `getPayrollItemsByRun(runId)` — items for a run with person names

- [ ] **Step 2: Create payroll routes**

```
GET    /api/payroll               — list payroll runs
GET    /api/payroll/:id           — get run with items
POST   /api/payroll               — create payroll run
POST   /api/payroll/:id/items     — add item to run
PUT    /api/payroll/:id           — update run (status, finalize)
DELETE /api/payroll/:id           — delete run
```

- [ ] **Step 3: Register and commit**

```bash
git add server/modules/people/payroll-*
git commit -m "feat: add payroll backend — runs, items, status management"
```

---

## Task 5: Create leave management backend

**Files:**
- Create: `server/modules/people/leave-routes.ts`
- Create: `server/modules/people/leave-storage.ts`

- [ ] **Step 1: Create leave storage**

Methods:
- `getLeavePolicies(organizationId)` — list policies
- `createLeavePolicy(data, organizationId)` — create policy
- `deleteLeavePolicy(id, organizationId)` — delete
- `getLeaveBalances(personId, organizationId)` — balances for a person
- `initializeLeaveBalances(personId, organizationId, year)` — create balance rows from policies
- `getLeaveRequests(organizationId)` — all requests with person names
- `getLeaveRequestsByPerson(personId, organizationId)` — for a specific person
- `createLeaveRequest(data, organizationId)` — create request
- `approveLeaveRequest(id, reviewerId, organizationId)` — approve and update balance
- `rejectLeaveRequest(id, reviewerId, organizationId)` — reject

- [ ] **Step 2: Create leave routes**

```
GET    /api/leave-policies         — list policies
POST   /api/leave-policies         — create policy
DELETE /api/leave-policies/:id     — delete policy
GET    /api/leave-requests          — all requests
GET    /api/leave-requests/person/:personId — requests for person
POST   /api/leave-requests          — submit request
PUT    /api/leave-requests/:id/approve — approve
PUT    /api/leave-requests/:id/reject  — reject
GET    /api/leave-balances/:personId   — balances for person
```

- [ ] **Step 3: Register and commit**

```bash
git add server/modules/people/leave-*
git commit -m "feat: add leave management backend — policies, requests, approval, balances"
```

---

## Task 6: Create onboarding and performance backends

**Files:**
- Create: `server/modules/people/onboarding-routes.ts`
- Create: `server/modules/people/onboarding-storage.ts`
- Create: `server/modules/people/performance-routes.ts`
- Create: `server/modules/people/performance-storage.ts`

- [ ] **Step 1: Create onboarding storage and routes**

Storage methods: CRUD for templates, steps, progress. `assignTemplate(personId, templateId)` auto-creates progress rows.

Routes:
```
GET    /api/onboarding/templates           — list templates
POST   /api/onboarding/templates           — create template
DELETE /api/onboarding/templates/:id       — delete template
POST   /api/onboarding/templates/:id/steps — add step
GET    /api/onboarding/person/:personId    — progress for a person
POST   /api/onboarding/assign              — assign template to person
PUT    /api/onboarding/progress/:id        — update step status
```

- [ ] **Step 2: Create performance storage and routes**

Storage methods: CRUD for reviews and goals.

Routes:
```
GET    /api/performance/reviews              — list reviews
GET    /api/performance/reviews/person/:personId — for a person
POST   /api/performance/reviews              — create review
PUT    /api/performance/reviews/:id          — update review
GET    /api/performance/goals/person/:personId — goals for person
POST   /api/performance/goals               — create goal
PUT    /api/performance/goals/:id           — update goal status
```

- [ ] **Step 3: Register both and commit**

Register both route modules in `server/index.ts`:
```typescript
import onboardingRoutes from "./modules/people/onboarding-routes";
import performanceRoutes from "./modules/people/performance-routes";
app.use(onboardingRoutes);
app.use(performanceRoutes);
```

```bash
git add server/modules/people/onboarding-* server/modules/people/performance-* server/index.ts
git commit -m "feat: add onboarding and performance backends — templates, reviews, goals"
```

---

## Task 7: Create benefits backend

**Files:**
- Create: `server/modules/people/benefits-routes.ts`
- Create: `server/modules/people/benefits-storage.ts`

- [ ] **Step 1: Create benefits storage and routes**

Storage: CRUD for benefit_plans and benefit_enrollments. `enrollPerson(personId, planId, organizationId)` creates enrollment. `getEnrollmentsByPerson(personId)` returns enrolled plans.

Routes:
```
GET    /api/benefits/plans                     — list plans
POST   /api/benefits/plans                     — create plan
PUT    /api/benefits/plans/:id                 — update plan
DELETE /api/benefits/plans/:id                 — delete plan
GET    /api/benefits/enrollments/person/:personId — enrollments for person
POST   /api/benefits/enrollments               — enroll person in plan
PUT    /api/benefits/enrollments/:id           — update enrollment (cancel, etc.)
```

- [ ] **Step 2: Register and commit**

```bash
git add server/modules/people/benefits-* server/index.ts
git commit -m "feat: add benefits backend — plans, enrollments, person enrollment management"
```

---

## Task 8: Create person documents backend

**Files:**
- Modify: `server/modules/people/routes.ts` (add document endpoints to existing people routes)

- [ ] **Step 1: Add document endpoints to people routes**

Add these routes to the existing people routes file:

```
GET    /api/people/:personId/documents    — list documents for person
POST   /api/people/:personId/documents    — upload document metadata (URL from Supabase Storage)
DELETE /api/people/:personId/documents/:docId — delete document
```

Storage methods: `getDocumentsByPerson`, `createDocument`, `deleteDocument`.

For now, documents store a `fileUrl` (manually entered or from Supabase Storage integration in Plan 4). No actual file upload handling in this task — just the metadata CRUD.

- [ ] **Step 2: Commit**

```bash
git add server/modules/people/
git commit -m "feat: add person documents backend — metadata CRUD for contracts, tax forms, IDs"
```

---

## Task 9: Build People Directory page

**Files:**
- Create: `client/src/modules/people/pages/PeopleDirectory.tsx`

- [ ] **Step 1: Build the directory page**

A modern directory page replacing the old EmployeesTab:

**Layout:**
- Title: "People" with subtitle "Manage employees and contractors"
- Filter tabs: All | Employees | Contractors (with counts from `/api/people/stats`)
- "+ Add Person" button → dialog with full form
- Search bar

**Table columns:** Avatar/Initials, Name, Type (badge), Position, Department, Country, Start Date, Status (badge), Actions (view, edit, delete)

**Add/Edit dialog:** Two-section form:
- **Basic info:** Type (employee/contractor toggle), First Name, Last Name, Email, Phone, Position, Department, Country, Start Date
- **Compensation (conditional):**
  - If employee: Employment Type, Salary, Frequency, Currency
  - If contractor: Hourly Rate, Contract Rate, Currency, Contract Start/End

Fetch from `GET /api/people` (with `?type=` filter).
Create via `POST /api/people`.
Delete via `DELETE /api/people/:id`.

Click a person row → navigate to `/people/:id` (person detail page, built in next task).

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/people/
git commit -m "feat: build People Directory page — filterable table with employee/contractor tabs"
```

---

## Task 10: Build Person Detail page

**Files:**
- Create: `client/src/modules/people/pages/PersonDetail.tsx`

- [ ] **Step 1: Build the person detail page**

A detail page accessed via `/people/:id` showing everything about one person.

**Header:** Avatar, Name, Position, Department, Type badge, Status badge, Edit button

**Tabs:**
- **Profile:** Personal info (DOB, nationality, address, phone, email), Employment info (start date, seniority, manager, group), Compensation (salary or rates)
- **Documents:** List from `/api/people/:id/documents` with add/delete
- **Leave:** Leave balances and request history from `/api/leave-balances/:id` and `/api/leave-requests/person/:id`
- **Performance:** Reviews and goals from `/api/performance/reviews/person/:id` and `/api/performance/goals/person/:id`
- **Onboarding:** Checklist from `/api/onboarding/person/:id`

Fetch person from `GET /api/people/:id`.

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/people/pages/PersonDetail.tsx
git commit -m "feat: build Person Detail page — profile, documents, leave, performance, onboarding tabs"
```

---

## Task 11: Build Payroll page

**Files:**
- Create: `client/src/modules/people/pages/PayrollPage.tsx`

- [ ] **Step 1: Build the payroll page**

**Layout:**
- Title: "Payroll" with subtitle "Manage salary and contractor payments"
- List of payroll runs (Period, Run Date, Status badge, Total Gross, Total Net, Actions)
- "+ New Payroll Run" button → dialog: Period (YYYY-MM), Run Date
- Click a run → expand to show items table (Person Name, Gross, Tax, Benefits, Other, Net)
- "+ Add Item" within a run → dialog: Select Person, Gross Amount, Tax Deduction, Benefit Deductions, Other Deductions, Currency, Notes. Net auto-calculated.
- Status transitions: Draft → Processing → Completed

Fetch from `GET /api/payroll`.
Create run: `POST /api/payroll`.
Add item: `POST /api/payroll/:id/items`.
Update status: `PUT /api/payroll/:id`.

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/people/pages/PayrollPage.tsx
git commit -m "feat: build Payroll page — runs, items, status management"
```

---

## Task 12: Build Leave Management page

**Files:**
- Create: `client/src/modules/people/pages/LeavePage.tsx`

- [ ] **Step 1: Build the leave page**

**Two sections (tabs or side-by-side):**

**Policies tab:**
- List of leave policies: Name, Days/Year, Carry Over Limit, Applies To (badge), Actions
- "+ Add Policy" dialog: Name, Days Per Year, Carry Over Limit, Applies To (employee/contractor/all)

**Requests tab:**
- List of all leave requests: Person Name, Policy, Dates, Days, Status (badge), Actions
- Status badges: pending (yellow), approved (green), rejected (red), cancelled (gray)
- Approve/Reject buttons for pending requests
- "+ New Request" dialog: Select Person, Select Policy, Start Date, End Date, Days, Reason

Fetch policies: `GET /api/leave-policies`
Fetch requests: `GET /api/leave-requests`
Create: `POST /api/leave-policies`, `POST /api/leave-requests`
Approve: `PUT /api/leave-requests/:id/approve`
Reject: `PUT /api/leave-requests/:id/reject`

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/people/pages/LeavePage.tsx
git commit -m "feat: build Leave Management page — policies, requests, approval workflow"
```

---

## Task 13: Build Onboarding page

**Files:**
- Create: `client/src/modules/people/pages/OnboardingPage.tsx`

- [ ] **Step 1: Build the onboarding page**

**Templates section:**
- List of onboarding templates: Name, Applies To, Step Count, Actions
- "+ New Template" dialog: Name, Applies To
- Click template → expand to show steps (ordered list with Title, Description, Assigned Role, Due Days)
- "+ Add Step" within template

**Active Onboarding section:**
- List of people currently being onboarded with progress bars
- Click person → shows checklist of steps with status toggles

Fetch templates: `GET /api/onboarding/templates`
Assign: `POST /api/onboarding/assign`
Update progress: `PUT /api/onboarding/progress/:id`

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/people/pages/OnboardingPage.tsx
git commit -m "feat: build Onboarding page — templates, steps, person progress tracking"
```

---

## Task 14: Build Performance page

**Files:**
- Create: `client/src/modules/people/pages/PerformancePage.tsx`

- [ ] **Step 1: Build the performance page**

**Reviews tab:**
- List: Person Name, Period, Rating (star display), Status, Actions
- "+ New Review" dialog: Select Person, Period (e.g., "2026-Q1"), Rating (1-5), Strengths, Improvements, Goals
- Edit review, update status (draft → submitted → acknowledged)

**Goals tab:**
- List: Person Name, Title, Target Date, Status (badge), Actions
- "+ New Goal" dialog: Select Person, Title, Description, Target Date
- Status transitions: not_started → in_progress → completed/missed

Fetch reviews: `GET /api/performance/reviews`
Fetch goals: `GET /api/performance/goals/person/:id` (or a list-all endpoint)

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/people/pages/PerformancePage.tsx
git commit -m "feat: build Performance page — reviews with ratings, goals with status tracking"
```

---

## Task 15: Build Benefits page

**Files:**
- Create: `client/src/modules/people/pages/BenefitsPage.tsx`

- [ ] **Step 1: Build the benefits page**

**Plans tab:**
- List: Name, Type (badge), Provider, Cost to Company, Cost to Employee, Currency, Enrolled Count, Actions
- "+ New Plan" dialog: Name, Type (insurance/retirement/wellness/other), Provider, Cost to Company, Cost to Employee, Currency, Description

**Enrollments tab:**
- List: Person Name, Plan Name, Enrolled Date, Status (badge), Expiry Date, Actions
- "+ Enroll Person" dialog: Select Person, Select Plan, Enrolled Date

Fetch plans: `GET /api/benefits/plans`
Fetch enrollments per person or all (add a list-all endpoint if needed)

- [ ] **Step 2: Commit**

```bash
git add client/src/modules/people/pages/BenefitsPage.tsx
git commit -m "feat: build Benefits page — plans, enrollments, person enrollment management"
```

---

## Task 16: Wire up routing and update sidebar

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/layout/Layout.tsx`
- Modify: `client/src/pages/Employees.tsx` (redirect to new page)

- [ ] **Step 1: Read current App.tsx and Layout.tsx**

Read both files.

- [ ] **Step 2: Update App.tsx with People routes**

Add imports for all new pages and add routes:

```tsx
// People module
import PeopleDirectory from "./modules/people/pages/PeopleDirectory";
import PersonDetail from "./modules/people/pages/PersonDetail";
import PayrollPage from "./modules/people/pages/PayrollPage";
import LeavePage from "./modules/people/pages/LeavePage";
import OnboardingPage from "./modules/people/pages/OnboardingPage";
import PerformancePage from "./modules/people/pages/PerformancePage";
import BenefitsPage from "./modules/people/pages/BenefitsPage";
```

Add these routes inside the OrgRouter Switch (replace the old `/employees` route):

```tsx
<Route path="/people" component={PeopleDirectory} />
<Route path="/people/:id" component={PersonDetail} />
<Route path="/payroll" component={PayrollPage} />
<Route path="/leave" component={LeavePage} />
<Route path="/onboarding" component={OnboardingPage} />
<Route path="/performance" component={PerformancePage} />
<Route path="/benefits" component={BenefitsPage} />
```

Keep the old `/employees` route as a redirect to `/people` for backwards compatibility.

- [ ] **Step 3: Update sidebar with People sub-items**

In Layout.tsx, replace the single "People" nav item with a collapsible group:

The main "People" link should go to `/people`. Add sub-items visible when the People section is expanded:
- Directory → `/people`
- Payroll → `/payroll`
- Leave → `/leave`
- Onboarding → `/onboarding`
- Performance → `/performance`
- Benefits → `/benefits`

Use the same collapsible pattern as Settings (ChevronDown icon, expanded state).

All People sub-items should be gated with `canAccess("people")`.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/components/layout/Layout.tsx client/src/pages/Employees.tsx
git commit -m "feat: wire up People module routing — directory, detail, payroll, leave, onboarding, performance, benefits"
```

---

## Task 17: Verify build and final cleanup

- [ ] **Step 1: Push all schema changes**

```bash
npx drizzle-kit push
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Fix any compile errors.

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Verify:
1. People → Directory with All/Employees/Contractors tabs
2. Click person → Detail page with tabs
3. Payroll page loads
4. Leave page with policies and requests
5. Onboarding page with templates
6. Performance page with reviews and goals
7. Benefits page with plans and enrollments
8. Sidebar shows People with sub-items

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: fix build errors, verify Plan 3 complete"
```

---

## Summary

After completing this plan, Bluxo will have:

- **Extended People table** with full HR fields (personal info, salary, contractor rates)
- **13 new HR tables** (payroll, leave, onboarding, performance, benefits, documents)
- **People Directory** — filterable table with employee/contractor type tabs
- **Person Detail** — tabbed view with profile, documents, leave, performance, onboarding
- **Payroll** — runs with per-person items, status workflow
- **Leave Management** — policies, requests, approval workflow, balances
- **Onboarding** — templates with steps, person progress tracking
- **Performance** — reviews with ratings, goals with status tracking
- **Benefits** — plans with enrollment management
- **Person Documents** — metadata CRUD for contracts, tax forms, IDs

**Next:** Plan 4 (Clients, Analytics, HQ, Settings)
