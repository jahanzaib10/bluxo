import { db } from "../../db";
import {
  onboardingTemplates,
  onboardingSteps,
  onboardingProgress,
  people,
} from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export const onboardingStorage = {
  // ── Templates ─────────────────────────────────────────────────────────────

  async getTemplates(organizationId: string) {
    const templates = await db
      .select()
      .from(onboardingTemplates)
      .where(eq(onboardingTemplates.organizationId, organizationId));

    // Attach step counts
    const withCounts = await Promise.all(
      templates.map(async (template) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(onboardingSteps)
          .where(eq(onboardingSteps.templateId, template.id));
        return { ...template, stepCount: count };
      })
    );

    return withCounts;
  },

  async createTemplate(data: any, organizationId: string) {
    const [template] = await db
      .insert(onboardingTemplates)
      .values({ ...data, organizationId })
      .returning();
    return template;
  },

  async deleteTemplate(id: string, organizationId: string) {
    // onboardingSteps cascade-deletes via FK; just delete the template
    const result = await db
      .delete(onboardingTemplates)
      .where(
        and(
          eq(onboardingTemplates.id, id),
          eq(onboardingTemplates.organizationId, organizationId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  },

  // ── Steps ─────────────────────────────────────────────────────────────────

  async addStep(data: any) {
    const [step] = await db
      .insert(onboardingSteps)
      .values(data)
      .returning();
    return step;
  },

  async getStepsByTemplate(templateId: string) {
    return db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.templateId, templateId))
      .orderBy(asc(onboardingSteps.order));
  },

  // ── Progress ──────────────────────────────────────────────────────────────

  async getPersonProgress(personId: string, organizationId: string) {
    return db
      .select({
        id: onboardingProgress.id,
        personId: onboardingProgress.personId,
        stepId: onboardingProgress.stepId,
        status: onboardingProgress.status,
        completedById: onboardingProgress.completedById,
        completedAt: onboardingProgress.completedAt,
        notes: onboardingProgress.notes,
        organizationId: onboardingProgress.organizationId,
        stepTitle: onboardingSteps.title,
        stepDescription: onboardingSteps.description,
        stepOrder: onboardingSteps.order,
        stepAssignedRole: onboardingSteps.assignedRole,
        stepDueDaysAfterStart: onboardingSteps.dueDaysAfterStart,
        stepTemplateId: onboardingSteps.templateId,
      })
      .from(onboardingProgress)
      .leftJoin(onboardingSteps, eq(onboardingProgress.stepId, onboardingSteps.id))
      .where(
        and(
          eq(onboardingProgress.personId, personId),
          eq(onboardingProgress.organizationId, organizationId)
        )
      )
      .orderBy(asc(onboardingSteps.order));
  },

  async assignTemplate(personId: string, templateId: string, organizationId: string) {
    const steps = await db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.templateId, templateId));

    if (steps.length === 0) return [];

    const rows = steps.map((step) => ({
      personId,
      stepId: step.id,
      status: "pending" as const,
      organizationId,
    }));

    const inserted = await db
      .insert(onboardingProgress)
      .values(rows)
      .returning();

    return inserted;
  },

  async updateProgress(id: string, status: string, completedById?: string) {
    const [updated] = await db
      .update(onboardingProgress)
      .set({
        status: status as any,
        completedById: completedById ?? null,
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(eq(onboardingProgress.id, id))
      .returning();
    return updated;
  },
};
