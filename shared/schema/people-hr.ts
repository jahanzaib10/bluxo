import {
  pgTable, uuid, varchar, text, boolean, timestamp, decimal, date, integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { organizations, people } from "../schema";

// ─── Payroll ─────────────────────────────────────────────────────────────────

export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  period: varchar("period", { length: 255 }).notNull(),
  status: varchar("status", { enum: ["draft", "processing", "completed", "failed"] }).default("draft"),
  runDate: date("run_date").notNull(),
  totalGross: decimal("total_gross", { precision: 12, scale: 2 }),
  totalDeductions: decimal("total_deductions", { precision: 12, scale: 2 }),
  totalNet: decimal("total_net", { precision: 12, scale: 2 }),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollItems = pgTable("payroll_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  payrollRunId: uuid("payroll_run_id").references(() => payrollRuns.id, { onDelete: "cascade" }).notNull(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  grossAmount: decimal("gross_amount", { precision: 12, scale: 2 }).notNull(),
  taxDeduction: decimal("tax_deduction", { precision: 12, scale: 2 }).notNull(),
  benefitDeductions: decimal("benefit_deductions", { precision: 12, scale: 2 }).notNull(),
  otherDeductions: decimal("other_deductions", { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  notes: text("notes"),
});

// ─── Leave ───────────────────────────────────────────────────────────────────

export const leavePolicies = pgTable("leave_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  daysPerYear: integer("days_per_year").notNull(),
  carryOverLimit: integer("carry_over_limit").default(0),
  appliesToType: varchar("applies_to_type", { enum: ["employee", "contractor", "all"] }).default("all"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  policyId: uuid("policy_id").references(() => leavePolicies.id).notNull(),
  year: integer("year").notNull(),
  entitled: integer("entitled").notNull(),
  used: integer("used").default(0),
  carried: integer("carried").default(0),
  remaining: integer("remaining").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  policyId: uuid("policy_id").references(() => leavePolicies.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: decimal("days", { precision: 5, scale: 1 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "cancelled"] }).default("pending"),
  reviewedById: varchar("reviewed_by_id"),
  reviewedAt: timestamp("reviewed_at"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Onboarding ──────────────────────────────────────────────────────────────

export const onboardingTemplates = pgTable("onboarding_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  appliesToType: varchar("applies_to_type", { enum: ["employee", "contractor", "all"] }).default("all"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onboardingSteps = pgTable("onboarding_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => onboardingTemplates.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  assignedRole: varchar("assigned_role"),
  dueDaysAfterStart: integer("due_days_after_start"),
});

export const onboardingProgress = pgTable("onboarding_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  stepId: uuid("step_id").references(() => onboardingSteps.id).notNull(),
  status: varchar("status", { enum: ["pending", "in_progress", "completed", "skipped"] }).default("pending"),
  completedById: varchar("completed_by_id"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
});

// ─── Performance ─────────────────────────────────────────────────────────────

export const performanceReviews = pgTable("performance_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  reviewerId: varchar("reviewer_id").notNull(),
  period: varchar("period", { length: 255 }).notNull(),
  rating: integer("rating"),
  strengths: text("strengths"),
  improvements: text("improvements"),
  goals: text("goals"),
  status: varchar("status", { enum: ["draft", "submitted", "acknowledged"] }).default("draft"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const performanceGoals = pgTable("performance_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetDate: date("target_date"),
  status: varchar("status", { enum: ["not_started", "in_progress", "completed", "missed"] }).default("not_started"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Benefits ────────────────────────────────────────────────────────────────

export const benefitPlans = pgTable("benefit_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { enum: ["insurance", "retirement", "wellness", "other"] }).notNull(),
  provider: varchar("provider"),
  costToCompany: decimal("cost_to_company", { precision: 12, scale: 2 }).notNull(),
  costToEmployee: decimal("cost_to_employee", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  description: text("description"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const benefitEnrollments = pgTable("benefit_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  planId: uuid("plan_id").references(() => benefitPlans.id).notNull(),
  enrolledDate: date("enrolled_date").notNull(),
  status: varchar("status", { enum: ["active", "cancelled", "pending"] }).default("active"),
  expiryDate: date("expiry_date"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Documents ───────────────────────────────────────────────────────────────

export const personDocuments = pgTable("person_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => people.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { enum: ["contract", "tax_form", "id_document", "certificate", "other"] }).notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size"),
  uploadedById: varchar("uploaded_by_id").notNull(),
  expiryDate: date("expiry_date"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [payrollRuns.organizationId],
    references: [organizations.id],
  }),
  items: many(payrollItems),
}));

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payrollItems.payrollRunId],
    references: [payrollRuns.id],
  }),
  person: one(people, {
    fields: [payrollItems.personId],
    references: [people.id],
  }),
}));

export const leavePoliciesRelations = relations(leavePolicies, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leavePolicies.organizationId],
    references: [organizations.id],
  }),
  balances: many(leaveBalances),
  requests: many(leaveRequests),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  person: one(people, {
    fields: [leaveBalances.personId],
    references: [people.id],
  }),
  policy: one(leavePolicies, {
    fields: [leaveBalances.policyId],
    references: [leavePolicies.id],
  }),
  organization: one(organizations, {
    fields: [leaveBalances.organizationId],
    references: [organizations.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  person: one(people, {
    fields: [leaveRequests.personId],
    references: [people.id],
  }),
  policy: one(leavePolicies, {
    fields: [leaveRequests.policyId],
    references: [leavePolicies.id],
  }),
  organization: one(organizations, {
    fields: [leaveRequests.organizationId],
    references: [organizations.id],
  }),
}));

export const onboardingTemplatesRelations = relations(onboardingTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [onboardingTemplates.organizationId],
    references: [organizations.id],
  }),
  steps: many(onboardingSteps),
}));

export const onboardingStepsRelations = relations(onboardingSteps, ({ one, many }) => ({
  template: one(onboardingTemplates, {
    fields: [onboardingSteps.templateId],
    references: [onboardingTemplates.id],
  }),
  progress: many(onboardingProgress),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  person: one(people, {
    fields: [onboardingProgress.personId],
    references: [people.id],
  }),
  step: one(onboardingSteps, {
    fields: [onboardingProgress.stepId],
    references: [onboardingSteps.id],
  }),
  organization: one(organizations, {
    fields: [onboardingProgress.organizationId],
    references: [organizations.id],
  }),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({ one }) => ({
  person: one(people, {
    fields: [performanceReviews.personId],
    references: [people.id],
  }),
  organization: one(organizations, {
    fields: [performanceReviews.organizationId],
    references: [organizations.id],
  }),
}));

export const performanceGoalsRelations = relations(performanceGoals, ({ one }) => ({
  person: one(people, {
    fields: [performanceGoals.personId],
    references: [people.id],
  }),
  organization: one(organizations, {
    fields: [performanceGoals.organizationId],
    references: [organizations.id],
  }),
}));

export const benefitPlansRelations = relations(benefitPlans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [benefitPlans.organizationId],
    references: [organizations.id],
  }),
  enrollments: many(benefitEnrollments),
}));

export const benefitEnrollmentsRelations = relations(benefitEnrollments, ({ one }) => ({
  person: one(people, {
    fields: [benefitEnrollments.personId],
    references: [people.id],
  }),
  plan: one(benefitPlans, {
    fields: [benefitEnrollments.planId],
    references: [benefitPlans.id],
  }),
  organization: one(organizations, {
    fields: [benefitEnrollments.organizationId],
    references: [organizations.id],
  }),
}));

export const personDocumentsRelations = relations(personDocuments, ({ one }) => ({
  person: one(people, {
    fields: [personDocuments.personId],
    references: [people.id],
  }),
  organization: one(organizations, {
    fields: [personDocuments.organizationId],
    references: [organizations.id],
  }),
}));

// ─── Zod Insert Schemas ─────────────────────────────────────────────────────

export const insertPayrollRunSchema = z.object({
  period: z.string().min(1),
  runDate: z.string(),
  status: z.enum(["draft", "processing", "completed", "failed"]).optional(),
});

export const insertPayrollItemSchema = z.object({
  payrollRunId: z.string().uuid(),
  personId: z.string().uuid(),
  grossAmount: z.string(),
  taxDeduction: z.string(),
  benefitDeductions: z.string(),
  otherDeductions: z.string(),
  currency: z.string().max(3).optional(),
  notes: z.string().optional(),
});

export const insertLeavePolicySchema = z.object({
  name: z.string().min(1),
  daysPerYear: z.number().int().positive(),
  carryOverLimit: z.number().int().min(0).optional(),
  appliesToType: z.enum(["employee", "contractor", "all"]),
});

export const insertLeaveRequestSchema = z.object({
  personId: z.string().uuid(),
  policyId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  days: z.string(),
  reason: z.string().optional(),
});

export const insertOnboardingTemplateSchema = z.object({
  name: z.string().min(1),
  appliesToType: z.enum(["employee", "contractor", "all"]),
});

export const insertOnboardingStepSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int(),
  assignedRole: z.string().optional(),
  dueDaysAfterStart: z.number().int().optional(),
});

export const insertPerformanceReviewSchema = z.object({
  personId: z.string().uuid(),
  period: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  goals: z.string().optional(),
});

export const insertPerformanceGoalSchema = z.object({
  personId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string(),
});

export const insertBenefitPlanSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["insurance", "retirement", "wellness", "other"]),
  provider: z.string().optional(),
  costToCompany: z.string(),
  costToEmployee: z.string(),
  currency: z.string().max(3).optional(),
  description: z.string().optional(),
});

export const insertBenefitEnrollmentSchema = z.object({
  personId: z.string().uuid(),
  planId: z.string().uuid(),
  enrolledDate: z.string(),
});

export const insertPersonDocumentSchema = z.object({
  personId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(["contract", "tax_form", "id_document", "certificate", "other"]),
  fileUrl: z.string(),
  fileSize: z.number().int().optional(),
  expiryDate: z.string().optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type PayrollRun = typeof payrollRuns.$inferSelect;
export type PayrollItem = typeof payrollItems.$inferSelect;
export type LeavePolicy = typeof leavePolicies.$inferSelect;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type OnboardingStep = typeof onboardingSteps.$inferSelect;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type PerformanceGoal = typeof performanceGoals.$inferSelect;
export type BenefitPlan = typeof benefitPlans.$inferSelect;
export type BenefitEnrollment = typeof benefitEnrollments.$inferSelect;
export type PersonDocument = typeof personDocuments.$inferSelect;

export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;
export type InsertLeavePolicy = z.infer<typeof insertLeavePolicySchema>;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type InsertOnboardingTemplate = z.infer<typeof insertOnboardingTemplateSchema>;
export type InsertOnboardingStep = z.infer<typeof insertOnboardingStepSchema>;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type InsertPerformanceGoal = z.infer<typeof insertPerformanceGoalSchema>;
export type InsertBenefitPlan = z.infer<typeof insertBenefitPlanSchema>;
export type InsertBenefitEnrollment = z.infer<typeof insertBenefitEnrollmentSchema>;
export type InsertPersonDocument = z.infer<typeof insertPersonDocumentSchema>;
