import { db } from "../../db";
import { benefitPlans, benefitEnrollments, people } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const benefitsStorage = {
  // ── Benefit Plans ─────────────────────────────────────────────────────────

  async getBenefitPlans(organizationId: string) {
    return await db
      .select({
        id: benefitPlans.id,
        name: benefitPlans.name,
        type: benefitPlans.type,
        provider: benefitPlans.provider,
        costToCompany: benefitPlans.costToCompany,
        costToEmployee: benefitPlans.costToEmployee,
        currency: benefitPlans.currency,
        description: benefitPlans.description,
        organizationId: benefitPlans.organizationId,
        createdAt: benefitPlans.createdAt,
        enrollmentCount: sql<number>`cast(count(${benefitEnrollments.id}) filter (where ${benefitEnrollments.status} = 'active') as int)`,
      })
      .from(benefitPlans)
      .leftJoin(benefitEnrollments, eq(benefitEnrollments.planId, benefitPlans.id))
      .where(eq(benefitPlans.organizationId, organizationId))
      .groupBy(benefitPlans.id)
      .orderBy(desc(benefitPlans.createdAt));
  },

  async createBenefitPlan(data: any, organizationId: string) {
    const [plan] = await db
      .insert(benefitPlans)
      .values({ ...data, organizationId })
      .returning();
    return plan;
  },

  async updateBenefitPlan(id: string, data: any, organizationId: string) {
    const [plan] = await db
      .update(benefitPlans)
      .set(data)
      .where(and(eq(benefitPlans.id, id), eq(benefitPlans.organizationId, organizationId)))
      .returning();
    return plan ?? null;
  },

  async deleteBenefitPlan(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(benefitPlans)
      .where(and(eq(benefitPlans.id, id), eq(benefitPlans.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // ── Enrollments ───────────────────────────────────────────────────────────

  async getEnrollmentsByPerson(personId: string, organizationId: string) {
    return await db
      .select({
        id: benefitEnrollments.id,
        personId: benefitEnrollments.personId,
        planId: benefitEnrollments.planId,
        enrolledDate: benefitEnrollments.enrolledDate,
        status: benefitEnrollments.status,
        expiryDate: benefitEnrollments.expiryDate,
        organizationId: benefitEnrollments.organizationId,
        createdAt: benefitEnrollments.createdAt,
        planName: benefitPlans.name,
        planType: benefitPlans.type,
        planProvider: benefitPlans.provider,
        costToCompany: benefitPlans.costToCompany,
        costToEmployee: benefitPlans.costToEmployee,
        currency: benefitPlans.currency,
      })
      .from(benefitEnrollments)
      .leftJoin(benefitPlans, eq(benefitEnrollments.planId, benefitPlans.id))
      .where(
        and(
          eq(benefitEnrollments.personId, personId),
          eq(benefitEnrollments.organizationId, organizationId)
        )
      )
      .orderBy(desc(benefitEnrollments.createdAt));
  },

  async getAllEnrollments(organizationId: string) {
    return await db
      .select({
        id: benefitEnrollments.id,
        personId: benefitEnrollments.personId,
        planId: benefitEnrollments.planId,
        enrolledDate: benefitEnrollments.enrolledDate,
        status: benefitEnrollments.status,
        expiryDate: benefitEnrollments.expiryDate,
        organizationId: benefitEnrollments.organizationId,
        createdAt: benefitEnrollments.createdAt,
        personFirstName: people.firstName,
        personLastName: people.lastName,
        planName: benefitPlans.name,
        planType: benefitPlans.type,
        costToCompany: benefitPlans.costToCompany,
        costToEmployee: benefitPlans.costToEmployee,
        currency: benefitPlans.currency,
      })
      .from(benefitEnrollments)
      .leftJoin(people, eq(benefitEnrollments.personId, people.id))
      .leftJoin(benefitPlans, eq(benefitEnrollments.planId, benefitPlans.id))
      .where(eq(benefitEnrollments.organizationId, organizationId))
      .orderBy(desc(benefitEnrollments.createdAt));
  },

  async enrollPerson(data: any, organizationId: string) {
    const [enrollment] = await db
      .insert(benefitEnrollments)
      .values({ ...data, organizationId, status: "active" })
      .returning();
    return enrollment;
  },

  async updateEnrollment(id: string, data: any, organizationId: string) {
    const [enrollment] = await db
      .update(benefitEnrollments)
      .set(data)
      .where(
        and(
          eq(benefitEnrollments.id, id),
          eq(benefitEnrollments.organizationId, organizationId)
        )
      )
      .returning();
    return enrollment ?? null;
  },
};
