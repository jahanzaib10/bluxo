# Bluxo Multi-Organization SaaS Platform — Design Spec

**Date:** 2026-04-03
**Status:** Approved
**Approach:** C — Modular Restructure (keep stack, restructure codebase, build incrementally)

## Vision

Transform Bluxo from a single-organization financial tracker into a multi-organization SaaS platform combining BambooHR + Deel + financial management. Built for service-based companies with entities in multiple countries, each with their own employees, contractors, clients, finances, and compliance requirements. A founder managing 3 companies across Pakistan, UK, and US should be able to switch between them instantly and see a consolidated HQ view across all.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Radix UI/shadcn, TanStack React Query, Wouter
- **Backend:** Express.js, TypeScript, Drizzle ORM
- **Database:** Supabase PostgreSQL (via standard `pg` driver)
- **File Storage:** Supabase Storage (documents, avatars, logos)
- **Auth:** Clerk (authentication, user management, organization switching)
- **Email:** SendGrid (notifications, portal invites)
- **Billing (placeholder):** Stripe (wired later, UI built in v1)

### Environment Variables

```
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Supabase
DATABASE_URL=postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# SendGrid
SENDGRID_API_KEY=xxxxx

# App
PORT=3000
```

---

## Section 1: Authentication & Identity (Clerk)

### What changes

Remove the entire custom auth system (JWT, bcrypt, sessions table, passport, `server/auth.ts`, login/signup pages) and replace with Clerk.

### Clerk provides

- Sign-up / Sign-in (email, Google, SSO)
- User profiles (name, email, avatar) — managed by Clerk, not our DB
- Organization creation & switching — Clerk's `<OrganizationSwitcher />` component in sidebar
- Org membership — Clerk knows which users belong to which orgs
- Session management — Clerk middleware validates sessions, no more JWT handling

### What we keep in our DB

- `users` table becomes a **sync table** — `clerkUserId` as unique key, synced via Clerk webhooks on user create/update. Stores only app-specific data (preferences, last active org).
- `organizations` table gets `clerkOrgId` field. Synced via Clerk webhooks on org create/update. We store all business metadata (country, currency, tax config, logo, address).
- `org_memberships` table — `clerkUserId` + `organizationId` + `customRoleId`. Clerk tells us membership exists, we attach our granular role/permissions.

### Auth flow

1. User hits Bluxo -> Clerk middleware checks session
2. No session -> Clerk sign-in page
3. Has session -> Clerk provides `userId` + `orgId` (active org)
4. Our middleware maps `clerkUserId` -> our user record, `clerkOrgId` -> our org record
5. All API requests are scoped to the active org automatically

### What gets deleted

- `server/auth.ts` (JWT generation, bcrypt, authenticateToken middleware)
- `sessions` table
- `userInvitations` table (Clerk handles invites)
- `clientAuthTokens` table (redesigned as `client_portal_tokens`)
- Login/Signup pages (Clerk hosted or embedded components)
- All custom password hashing, token refresh logic
- Passport.js dependencies

---

## Section 2: Multi-Organization Data Model

### Organizations table (extended)

```
organizations
  id                  UUID (PK)
  clerkOrgId          VARCHAR (unique, from Clerk)
  name                VARCHAR
  slug                VARCHAR (unique, URL-friendly)
  logo                VARCHAR (URL)
  country             VARCHAR (ISO country code)
  currency            VARCHAR (ISO currency code, e.g., PKR, GBP, USD)
  timezone            VARCHAR (e.g., Asia/Karachi)
  taxId               VARCHAR (company tax registration number)
  address             TEXT
  phone               VARCHAR
  website             VARCHAR
  fiscalYearStart     VARCHAR (month, e.g., "01" for Jan, "07" for Jul)
  industry            VARCHAR
  status              ENUM (active, suspended, archived)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP
```

### Org memberships (our side of Clerk sync)

```
org_memberships
  id                  UUID (PK)
  clerkUserId         VARCHAR (FK -> users)
  organizationId      UUID (FK -> organizations)
  customRoleId        UUID (FK -> roles, nullable)
  isOwner             BOOLEAN (default false)
  joinedAt            TIMESTAMP
  status              ENUM (active, suspended, removed)
```

### Users table (simplified, Clerk-synced)

```
users
  id                  UUID (PK)
  clerkUserId         VARCHAR (unique)
  email               VARCHAR
  name                VARCHAR
  avatarUrl           VARCHAR
  lastActiveOrgId     UUID (FK -> organizations, nullable)
  preferences         JSONB (theme, locale, etc.)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP
```

### Key design decisions

- **One user, many orgs** — the `org_memberships` table is the join. A founder has 3 rows, an accountant who works for 2 companies has 2 rows.
- **Every business entity keeps `organizationId`** — clients, people, income, expenses, subscriptions, categories, payment sources all remain org-scoped.
- **Active org context** — when a user switches orgs via Clerk, the `lastActiveOrgId` updates. All API calls include the active org from Clerk's session. Backend middleware enforces data isolation.
- **HQ view** — when a user is in "HQ mode," the backend queries across all orgs where that user has membership. No special table — it's a query pattern using `org_memberships`.
- **Slug for URLs** — `/org/dartnox-pk/dashboard` vs `/org/dartnox-uk/dashboard`.

---

## Section 3: Roles & Permissions System

### Roles table (custom per org)

```
roles
  id                  UUID (PK)
  name                VARCHAR (e.g., "Accountant", "HR Manager")
  description         TEXT
  isSystemRole        BOOLEAN (default false — system roles can't be deleted)
  organizationId      UUID (FK -> organizations)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP
```

### Default system roles (auto-created per org)

- **Owner** — full access to everything (cannot be deleted or modified)
- **Admin** — full access except billing and org deletion
- **Accountant** — Finance module (full), Analytics (full), Clients (view)
- **HR Manager** — People module (full), Analytics (HR only)
- **Manager** — view access across all modules, edit access to own team
- **Viewer** — read-only across permitted modules

### Permissions model (per-module, Full/Exclusive pattern)

```
role_permissions
  id                  UUID (PK)
  roleId              UUID (FK -> roles)
  module              ENUM (dashboard, finance, people, clients,
                           analytics, settings, integrations,
                           data_room, payroll, invoicing)
  enabled             BOOLEAN (can access this module at all)
  accessLevel         ENUM (full, exclusive)
                      — full: see all data in module
                      — exclusive: see only own/assigned data
  additionalPerms     JSONB (module-specific toggles)

  UNIQUE(roleId, module)
```

### additionalPerms examples per module

```json
// Finance module
{ "canApproveExpenses": true, "canExport": true, "canDeleteRecords": false }

// People module
{ "canManageLeave": true, "canViewSalary": false, "canOnboard": true }

// Clients module
{ "canDeleteClients": false, "canManagePortalAccess": true }

// Settings module
{ "canManageRoles": true, "canManageTaxRules": false, "canManageBilling": false }
```

### How it works

1. User logs in -> Clerk provides `userId` + `orgId`
2. Look up `org_memberships` row -> get `customRoleId`
3. Load `role_permissions` for that role -> cache on session
4. Every API route checks: does this role have `enabled: true` for this module? If `exclusive`, filter data to only what they own/are assigned to.
5. Frontend reads permissions on login -> hides/shows sidebar items and UI elements accordingly

### Teams (organizational grouping)

```
teams
  id                  UUID (PK)
  name                VARCHAR (e.g., "Finance Team", "Engineering")
  description         TEXT
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP

team_members
  id                  UUID (PK)
  teamId              UUID (FK -> teams)
  userId              UUID (FK -> users)
  organizationId      UUID (FK)
  joinedAt            TIMESTAMP

  UNIQUE(teamId, userId)
```

Teams are optional organizational grouping — no permission implications, purely for filtering and structure.

### User Management UI (3 tabs)

- **Users tab** — table with avatar, name, email, phone, role badge, status. "+ New user" triggers Clerk invite.
- **Teams tab** — group users into teams (e.g., "Finance Team Pakistan"). Organizational grouping.
- **Roles tab** — list roles with user count. Click role -> modal with module permission toggles (Full/Exclusive + additional checkboxes).

---

## Section 4: Finance Module

### Sidebar structure

```
Finance >
  Income
  Expenses
  Invoicing
  Subscriptions
  Accounting
```

### Income & Expenses (enhanced)

- **Income** — existing fields plus: `taxAmount`, `taxRuleId` (FK to tax rules), `paymentStatus` (pending/partial/paid/overdue), `dueDate`, `attachmentUrls` (receipts via Supabase Storage)
- **Expenses** — existing fields plus: `taxAmount`, `taxRuleId`, `approvalStatus` (pending/approved/rejected), `approvedById` (FK to users), `attachmentUrls`, `personId` (replaces `employeeId` — references People table)
- Both keep recurring support, category assignment, payment source tracking

### Invoicing (new)

```
invoices
  id                  UUID (PK)
  invoiceNumber       VARCHAR (auto-generated, e.g., INV-PK-2026-0001)
  type                ENUM (outgoing, incoming)
                      — outgoing: we bill a client
                      — incoming: a contractor bills us
  clientId            UUID (nullable, for outgoing)
  personId            UUID (nullable, for incoming from contractor)
  status              ENUM (draft, sent, viewed, paid, overdue, cancelled)
  issueDate           DATE
  dueDate             DATE
  subtotal            DECIMAL
  taxAmount           DECIMAL
  totalAmount         DECIMAL
  currency            VARCHAR
  notes               TEXT
  attachmentUrl       VARCHAR (PDF via Supabase Storage)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP

invoice_line_items
  id                  UUID (PK)
  invoiceId           UUID (FK -> invoices)
  description         TEXT
  quantity            DECIMAL
  unitPrice           DECIMAL
  taxRuleId           UUID (FK -> tax_rules, nullable)
  taxAmount           DECIMAL
  totalAmount         DECIMAL
```

### Subscriptions (enhanced)

Existing table plus:
- `personId` (contractor/employee who uses it)
- `taxAmount`, `taxRuleId`
- Link to auto-generated recurring expenses

### Accounting (reporting view, no new data store)

- **Profit & Loss** — income vs expenses over a period, broken by category
- **Tax Summary** — total tax collected (income) vs tax paid (expenses), grouped by tax rule/type. Per-country tax report.
- **Cash Flow** — money in vs money out over time, including pending invoices
- **Balance overview** — outstanding receivables (unpaid outgoing invoices) vs payables (unpaid incoming invoices)

### Tax Rules (in Settings)

```
tax_rules
  id                  UUID (PK)
  name                VARCHAR (e.g., "Pakistan GST 17%", "UK VAT 20%")
  rate                DECIMAL (percentage, e.g., 17.00)
  type                ENUM (inclusive, exclusive)
  country             VARCHAR (ISO code)
  description         TEXT
  isDefault           BOOLEAN
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
```

### Currency on HQ Dashboard

```
currency_rates
  id                  UUID (PK)
  baseCurrency        VARCHAR (3-char ISO)
  targetCurrency      VARCHAR
  rate                DECIMAL
  source              VARCHAR (manual, api)
  effectiveDate       DATE
  organizationId      UUID (nullable — null means global/system rate)
```

- Each org sets its local currency on the org profile
- HQ dashboard uses `currency_rates` to convert; toggle: "Show local" vs "Convert to base currency"
- Rates can be manually entered or fetched via API later

---

## Section 5: People Module

Replaces the current `employees` table with a full HR system.

### Sidebar structure

```
People >
  Directory
  Payroll
  Leave & Time-off
  Onboarding
  Performance
  Benefits
```

### Directory (core table, replaces `employees`)

```
people
  id                  UUID (PK)
  type                ENUM (employee, contractor)

  -- Personal info
  firstName           VARCHAR
  lastName            VARCHAR
  email               VARCHAR
  phone               VARCHAR
  avatarUrl           VARCHAR
  dateOfBirth         DATE
  nationality         VARCHAR
  address             TEXT

  -- Employment info
  position            VARCHAR
  department          VARCHAR
  seniorityLevel      ENUM (intern, junior, mid, senior, lead, director, executive)
  startDate           DATE
  endDate             DATE (nullable — null means active)
  status              ENUM (active, on_leave, terminated, offboarding)
  directManagerId     UUID (FK -> people, nullable)
  groupName           VARCHAR

  -- Employee-specific fields (null for contractors)
  employmentType      ENUM (full_time, part_time)
  salary              DECIMAL
  salaryFrequency     ENUM (monthly, bi_weekly, weekly, annually)
  salaryCurrency      VARCHAR

  -- Contractor-specific fields (null for employees)
  hourlyRate          DECIMAL
  contractRate        DECIMAL (flat project rate)
  rateCurrency        VARCHAR
  contractStartDate   DATE
  contractEndDate     DATE

  -- Shared
  paymentSourceId     UUID (FK -> payment_sources, nullable)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP
```

Directory page: filterable table/cards with tabs **All | Employees | Contractors**. Click person -> detail page with tabs for profile, documents, payroll history, leave balance, performance.

### Payroll

```
payroll_runs
  id                  UUID (PK)
  period              VARCHAR (e.g., "2026-04")
  status              ENUM (draft, processing, completed, failed)
  runDate             DATE
  totalGross          DECIMAL
  totalDeductions     DECIMAL
  totalNet            DECIMAL
  organizationId      UUID (FK)
  createdAt           TIMESTAMP

payroll_items
  id                  UUID (PK)
  payrollRunId        UUID (FK -> payroll_runs)
  personId            UUID (FK -> people)
  grossAmount         DECIMAL
  taxDeduction        DECIMAL
  benefitDeductions   DECIMAL
  otherDeductions     DECIMAL
  netAmount           DECIMAL
  currency            VARCHAR
  notes               TEXT
```

- Payroll page: upcoming payroll, past runs, per-person breakdown
- Contractors: tracks invoice payments rather than salary runs (links to incoming invoices from Finance module)
- V1: user enters deductions manually per person, with tax rules as a reference

### Leave & Time-off

```
leave_policies
  id                  UUID (PK)
  name                VARCHAR (e.g., "Annual Leave", "Sick Leave", "Maternity")
  daysPerYear         INTEGER
  carryOverLimit      INTEGER
  appliesToType       ENUM (employee, contractor, all)
  organizationId      UUID (FK)

leave_balances
  id                  UUID (PK)
  personId            UUID (FK -> people)
  policyId            UUID (FK -> leave_policies)
  year                INTEGER
  entitled            INTEGER
  used                INTEGER
  carried             INTEGER
  remaining           INTEGER
  organizationId      UUID (FK)

leave_requests
  id                  UUID (PK)
  personId            UUID (FK -> people)
  policyId            UUID (FK -> leave_policies)
  startDate           DATE
  endDate             DATE
  days                DECIMAL (supports half days)
  reason              TEXT
  status              ENUM (pending, approved, rejected, cancelled)
  reviewedById        UUID (FK -> users, nullable)
  reviewedAt          TIMESTAMP
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
```

### Onboarding

```
onboarding_templates
  id                  UUID (PK)
  name                VARCHAR (e.g., "Engineering Onboarding", "Contractor Setup")
  appliesToType       ENUM (employee, contractor, all)
  organizationId      UUID (FK)

onboarding_steps
  id                  UUID (PK)
  templateId          UUID (FK -> onboarding_templates)
  title               VARCHAR (e.g., "Sign NDA", "Setup email")
  description         TEXT
  order               INTEGER
  assignedRole        VARCHAR (who is responsible — HR, Manager, IT)
  dueDaysAfterStart   INTEGER

onboarding_progress
  id                  UUID (PK)
  personId            UUID (FK -> people)
  stepId              UUID (FK -> onboarding_steps)
  status              ENUM (pending, in_progress, completed, skipped)
  completedById       UUID (FK -> users, nullable)
  completedAt         TIMESTAMP
  notes               TEXT
```

When a person is added, assign an onboarding template -> auto-creates progress rows. Checklist view per person.

### Performance

```
performance_reviews
  id                  UUID (PK)
  personId            UUID (FK -> people)
  reviewerId          UUID (FK -> users)
  period              VARCHAR (e.g., "2026-Q1")
  rating              INTEGER (1-5)
  strengths           TEXT
  improvements        TEXT
  goals               TEXT
  status              ENUM (draft, submitted, acknowledged)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP

performance_goals
  id                  UUID (PK)
  personId            UUID (FK -> people)
  title               VARCHAR
  description         TEXT
  targetDate          DATE
  status              ENUM (not_started, in_progress, completed, missed)
  organizationId      UUID (FK)
```

### Benefits

```
benefit_plans
  id                  UUID (PK)
  name                VARCHAR (e.g., "Health Insurance", "Dental", "401k", "Gym")
  type                ENUM (insurance, retirement, wellness, other)
  provider            VARCHAR
  costToCompany       DECIMAL (per person per month)
  costToEmployee      DECIMAL (employee contribution)
  currency            VARCHAR
  description         TEXT
  organizationId      UUID (FK)

benefit_enrollments
  id                  UUID (PK)
  personId            UUID (FK -> people)
  planId              UUID (FK -> benefit_plans)
  enrolledDate        DATE
  status              ENUM (active, cancelled, pending)
  expiryDate          DATE (nullable)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
```

### Person Documents (Supabase Storage)

```
person_documents
  id                  UUID (PK)
  personId            UUID (FK -> people)
  name                VARCHAR (e.g., "Employment Contract", "Tax Form W-2")
  type                ENUM (contract, tax_form, id_document, certificate, other)
  fileUrl             VARCHAR (Supabase Storage URL)
  fileSize            INTEGER
  uploadedById        UUID (FK -> users)
  expiryDate          DATE (nullable — for expiring docs like visas)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
```

---

## Section 6: Clients Module

### Clients table (extended)

```
clients
  id                  UUID (PK)
  name                VARCHAR
  email               VARCHAR
  phone               VARCHAR
  website             VARCHAR
  address             TEXT
  industry            VARCHAR
  contactName         VARCHAR
  contactEmail        VARCHAR
  country             VARCHAR (ISO code)
  currency            VARCHAR (client's preferred currency)
  logoUrl             VARCHAR (Supabase Storage)
  status              ENUM (active, inactive, prospect, churned)
  tags                JSONB (e.g., ["enterprise", "retainer"])
  notes               TEXT
  contractStartDate   DATE
  contractEndDate     DATE (nullable)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP
```

### Client Portal (redesigned for Clerk world)

Magic link access — client clicks a link, verifies email, gets a scoped session for their portal. No Clerk account needed for clients. Portal is a separate route (`/portal/:orgSlug/:clientId`) with its own minimal layout.

```
client_portal_tokens
  id                  UUID (PK)
  clientId            UUID (FK -> clients)
  email               VARCHAR
  token               VARCHAR (unique)
  expiresAt           TIMESTAMP
  organizationId      UUID (FK)
  createdAt           TIMESTAMP

client_portal_permissions
  id                  UUID (PK)
  clientId            UUID (FK -> clients)
  canViewInvoices     BOOLEAN (default true)
  canViewPayments     BOOLEAN (default true)
  canViewReports      BOOLEAN (default false)
  canViewSubscriptions BOOLEAN (default false)
  canUploadDocuments  BOOLEAN (default false)
  organizationId      UUID (FK)
```

**Client portal shows:** invoices and payment status, payment history, subscription details (if permitted), shared documents, basic analytics (if permitted).

### Client Documents

```
client_documents
  id                  UUID (PK)
  clientId            UUID (FK -> clients)
  name                VARCHAR
  type                ENUM (contract, proposal, report, invoice, other)
  fileUrl             VARCHAR (Supabase Storage)
  fileSize            INTEGER
  sharedWithPortal    BOOLEAN (default false)
  uploadedById        UUID (FK -> users)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
```

---

## Section 7: Data Room, Integrations & Settings

### Data Room (in Settings)

```
data_room_documents
  id                  UUID (PK)
  name                VARCHAR
  category            ENUM (template, contract, compliance, financial, legal, policy, other)
  description         TEXT
  fileUrl             VARCHAR (Supabase Storage)
  fileSize            INTEGER
  mimeType            VARCHAR
  tags                JSONB (e.g., ["NDA", "2026", "Pakistan"])
  uploadedById        UUID (FK -> users)
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP
```

Folder-like UI organized by category with search and tag filtering. Access controlled by role permissions on the `data_room` module.

### Integrations (in Settings)

V1 is the framework + UI. Actual third-party API connections are wired incrementally.

```
integrations
  id                  UUID (PK)
  provider            VARCHAR (e.g., "quickbooks", "xero", "stripe", "wise", "deel", "gusto")
  category            ENUM (accounting, payment, hr_payroll, other)
  status              ENUM (connected, disconnected, error)
  config              JSONB (encrypted — OAuth tokens, API keys, account IDs)
  lastSyncAt          TIMESTAMP
  organizationId      UUID (FK)
  createdAt           TIMESTAMP
  updatedAt           TIMESTAMP

integration_sync_logs
  id                  UUID (PK)
  integrationId       UUID (FK -> integrations)
  action              VARCHAR (e.g., "sync_invoices", "import_employees")
  status              ENUM (success, failed, partial)
  recordsProcessed    INTEGER
  errorMessage        TEXT
  startedAt           TIMESTAMP
  completedAt         TIMESTAMP
```

Integrations page: grid of available integrations (logo, name, category, status badge). Connected ones show last sync time, sync button, logs. V1 ships with "Coming soon" badges and a "Request integration" option.

### Settings Structure

```
Settings
+-- General
|   +-- Profile (user profile, synced from Clerk, editable preferences)
|   +-- Organization (name, country, currency, timezone, logo, address)
|   +-- Appearance (theme, locale)
|
+-- Workspace Settings
    +-- Categories (income/expense categories, hierarchical)
    +-- Payment Sources (bank, cash, card, etc.)
    +-- Tax Rules (per-country tax rates)
    +-- Currency (base currency, exchange rates)
    +-- Integrations
    +-- User Management (Users | Teams | Roles tabs)
    +-- Data Room
    +-- Billing (plan, seats, payment method, transaction history)
```

---

## Section 8: HQ Dashboard & Cross-Org Experience

### Accessing HQ Mode

In the org switcher dropdown, above the list of orgs, an **"HQ Overview"** option appears — only visible if the user has 2+ org memberships. Clicking it switches context to HQ mode with a different sidebar and URL (`/hq/...`).

### HQ Sidebar

```
[Bluxo logo]
[HQ Overview]  <-- clicking shows org list to switch back

Command Center
Organizations
Cross-Org Reports
```

### Command Center

**Row 1 — Financial KPIs (cards):**
- Total Revenue, Total Expenses, Net Profit (all orgs combined, in base currency)
- Total Headcount (all orgs)
- Currency toggle: "Show in USD" / "Show local currencies"

**Row 2 — Per-Org Breakdown (table):**

| Organization | Country | Revenue | Expenses | Net | Headcount | Status |
|---|---|---|---|---|---|---|
| DartNox PK | PK | $45,000 | $28,000 | $17,000 | 12 | Healthy |
| DartNox UK | GB | $38,000 | $22,000 | $16,000 | 8 | Healthy |
| DartNox US | US | $26,000 | $18,000 | $8,000 | 5 | Warning |

Click any row -> jumps into that org's dashboard.

**Row 3 — Charts:**
- Revenue trend per org (multi-line chart, last 12 months)
- Expense breakdown across all orgs (stacked bar)

**Row 4 — Alerts & Action Items:**
- Overdue invoices across all orgs
- Expiring contracts (people or clients)
- Pending leave requests
- Pending expense approvals
- Upcoming payroll runs

Each alert shows which org it belongs to and links directly to the relevant page.

### Organizations Page

Card grid of all orgs (logo, name, country, currency, member count, quick stats). "+ Create Organization" button triggers Clerk org creation + setup wizard (country, currency, tax config, fiscal year).

### Cross-Org Reports

- Consolidated P&L (all orgs combined, per-org column breakdown)
- Headcount overview (employees vs contractors per org, growth trend)
- Tax summary (per-country obligations)
- Export to CSV/PDF

---

## Section 9: Frontend Architecture & Codebase Structure

### Frontend

```
client/src/
+-- components/
|   +-- ui/                    (existing Radix/shadcn — unchanged)
|   +-- layout/
|   |   +-- DashboardLayout.tsx
|   |   +-- Sidebar.tsx
|   |   +-- OrgSwitcher.tsx    (Clerk component, styled)
|   |   +-- HQLayout.tsx       (separate layout for HQ mode)
|   +-- shared/
|       +-- DataTable.tsx
|       +-- FileUploader.tsx
|       +-- CurrencyDisplay.tsx
|       +-- PermissionGate.tsx  (hides UI based on role permissions)
|
+-- modules/
|   +-- finance/
|   |   +-- pages/             (Income, Expenses, Invoicing, Subscriptions, Accounting)
|   |   +-- components/
|   |   +-- hooks/
|   |
|   +-- people/
|   |   +-- pages/             (Directory, Payroll, Leave, Onboarding, Performance, Benefits)
|   |   +-- components/
|   |   +-- hooks/
|   |
|   +-- clients/
|   |   +-- pages/
|   |   +-- components/
|   |   +-- hooks/
|   |
|   +-- analytics/
|   |   +-- pages/             (FinancialAnalytics, HRAnalytics, TaxReports)
|   |   +-- components/
|   |   +-- hooks/
|   |
|   +-- hq/
|   |   +-- pages/             (CommandCenter, Organizations, CrossOrgReports)
|   |   +-- components/
|   |   +-- hooks/
|   |
|   +-- settings/
|       +-- pages/
|       +-- components/
|       +-- hooks/
|
+-- lib/
|   +-- queryClient.ts         (React Query config — kept)
|   +-- api.ts                 (apiRequest — updated for Clerk tokens)
|   +-- permissions.ts         (role/permission checking utilities)
|   +-- currency.ts            (formatting, conversion helpers)
|
+-- hooks/
|   +-- useAuth.ts             (rewritten — wraps Clerk useUser/useOrganization)
|   +-- usePermissions.ts      (check current user's module access)
|   +-- useActiveOrg.ts        (current org context, HQ mode detection)
|
+-- App.tsx
+-- main.tsx
```

### Backend

```
server/
+-- index.ts                   (Express app setup, Clerk middleware)
+-- db.ts                      (Supabase PostgreSQL via Drizzle)
+-- middleware/
|   +-- clerk.ts               (Clerk session validation, user/org resolution)
|   +-- permissions.ts         (role-based route protection)
|   +-- orgContext.ts          (extract active org, enforce data isolation)
|
+-- modules/
|   +-- finance/
|   |   +-- routes.ts
|   |   +-- storage.ts
|   |
|   +-- people/
|   |   +-- routes.ts
|   |   +-- storage.ts
|   |
|   +-- clients/
|   |   +-- routes.ts
|   |   +-- storage.ts
|   |
|   +-- analytics/
|   |   +-- routes.ts
|   |   +-- storage.ts
|   |
|   +-- hq/
|   |   +-- routes.ts
|   |   +-- storage.ts
|   |
|   +-- settings/
|       +-- routes.ts
|       +-- storage.ts
|
+-- services/
|   +-- email.ts               (SendGrid — kept)
|   +-- storage.ts             (Supabase Storage — file upload/download)
|   +-- currency.ts            (exchange rate fetching/caching)
|
+-- vite.ts                    (Vite dev/prod setup — kept)

shared/
+-- schema.ts                  (all Drizzle table definitions)
+-- types.ts                   (shared TypeScript types)
+-- permissions.ts             (permission constants, module enums)
```

### URL Routing

```
/sign-in                          Clerk sign-in
/sign-up                          Clerk sign-up

/hq                               HQ Command Center (multi-org users)
/hq/organizations                 Manage all orgs
/hq/reports                       Cross-org reports

/org/:slug/dashboard              Single org dashboard
/org/:slug/finance/income
/org/:slug/finance/expenses
/org/:slug/finance/invoicing
/org/:slug/finance/subscriptions
/org/:slug/finance/accounting
/org/:slug/people
/org/:slug/people/payroll
/org/:slug/people/leave
/org/:slug/people/onboarding
/org/:slug/people/performance
/org/:slug/people/benefits
/org/:slug/clients
/org/:slug/clients/:id
/org/:slug/analytics
/org/:slug/analytics/hr
/org/:slug/analytics/tax
/org/:slug/settings/...

/portal/:orgSlug/:clientId        Client portal (public, token-based)
```

---

## Section 10: Migration Strategy

### Deleted entirely

| File/Feature | Reason |
|---|---|
| `server/auth.ts` | Replaced by Clerk middleware |
| `sessions` table | Clerk handles sessions |
| `userInvitations` table | Clerk handles invites |
| `clientAuthTokens` table | Replaced by `client_portal_tokens` |
| Login/Signup pages | Clerk hosted/embedded components |
| `server/routes.ts` (monolith) | Split into `server/modules/*/routes.ts` |
| `server/storage.ts` (monolith) | Split into `server/modules/*/storage.ts` |
| `useAuth` hook (current) | Rewritten to wrap Clerk |
| All "FIN" branding | Renamed to "Bluxo" |
| `@neondatabase/serverless` driver | Replaced by `pg` for Supabase |
| Passport.js dependencies | Clerk replaces all auth strategies |

### Kept and enhanced

| File/Feature | Change |
|---|---|
| `shared/schema.ts` | Extended with all new tables, `employees` renamed to `people` |
| React Query setup | Kept, `apiRequest` updated for Clerk token |
| All Radix/shadcn UI components | Kept as-is |
| Tailwind config + theme | Kept, update brand colors for Bluxo |
| Vite config | Kept |
| Drizzle ORM + drizzle-kit | Kept, pointed at Supabase |
| `categories` table | Kept with `organizationId` scoping |
| `paymentSources` table | Kept |
| `income` table | Extended with tax fields, attachments |
| `expenses` table | Extended, `employeeId` -> `personId` |
| `subscriptions` table | Extended with tax fields |
| `organizations` table | Extended with country, currency, etc. |
| Email service (SendGrid) | Kept for notifications, portal invites |

### New tables

| Feature | Tables |
|---|---|
| Clerk sync | `users` (rewritten), `org_memberships` |
| Roles & Permissions | `roles`, `role_permissions`, `teams`, `team_members` |
| People (HR) | `people`, `payroll_runs`, `payroll_items` |
| Leave management | `leave_policies`, `leave_balances`, `leave_requests` |
| Onboarding | `onboarding_templates`, `onboarding_steps`, `onboarding_progress` |
| Performance | `performance_reviews`, `performance_goals` |
| Benefits | `benefit_plans`, `benefit_enrollments` |
| Person documents | `person_documents` |
| Invoicing | `invoices`, `invoice_line_items` |
| Tax system | `tax_rules`, `currency_rates` |
| Client portal | `client_portal_tokens`, `client_portal_permissions`, `client_documents` |
| Data Room | `data_room_documents` |
| Integrations | `integrations`, `integration_sync_logs` |

### Implementation order

1. **Clerk + multi-org foundation** — auth swap, org model, memberships, middleware
2. **Codebase restructure** — split monoliths into modules, new routing
3. **Roles & permissions** — custom roles, permission gates on frontend and backend
4. **Finance module** — migrate existing income/expenses/subscriptions, add invoicing, tax rules, accounting
5. **People module** — migrate employees -> people, add payroll, leave, onboarding, performance, benefits
6. **Clients module** — extend clients, redesign portal
7. **Analytics & HQ** — dashboards, cross-org reports, command center
8. **Settings** — data room, integrations framework, billing placeholder
9. **Branding** — FIN -> Bluxo everywhere

---

## UI Reference

- **Org switcher:** Clerk-style flyout in sidebar — org avatar, name, role badge, flyout panel with all orgs
- **User Management:** iClosed-style — Users/Teams/Roles tabs, role editor modal with per-module Full/Exclusive toggles + additional permission checkboxes
- **Billing:** iClosed-style — plan banner, payment method, usage meters (seats + credits), transaction history with invoice downloads
- **App name:** Bluxo (replace all "FIN" references)
