import { db } from "../../db";
import { people } from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export const peopleStorage = {
  // ── List ──────────────────────────────────────────────────────────────────

  async getPeopleByOrg(organizationId: string, type?: string) {
    const managerAlias = db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .as("managers");

    let query = db
      .select({
        id: people.id,
        type: people.type,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        phone: people.phone,
        avatarUrl: people.avatarUrl,
        position: people.position,
        department: people.department,
        country: people.country,
        startDate: people.startDate,
        endDate: people.endDate,
        status: people.status,
        seniorityLevel: people.seniorityLevel,
        paymentAmount: people.paymentAmount,
        directManagerId: people.directManagerId,
        groupName: people.groupName,
        dateOfBirth: people.dateOfBirth,
        nationality: people.nationality,
        address: people.address,
        employmentType: people.employmentType,
        salary: people.salary,
        salaryFrequency: people.salaryFrequency,
        salaryCurrency: people.salaryCurrency,
        hourlyRate: people.hourlyRate,
        contractRate: people.contractRate,
        rateCurrency: people.rateCurrency,
        contractStartDate: people.contractStartDate,
        contractEndDate: people.contractEndDate,
        paymentSourceId: people.paymentSourceId,
        organizationId: people.organizationId,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
        managerFirstName: managerAlias.firstName,
        managerLastName: managerAlias.lastName,
      })
      .from(people)
      .leftJoin(managerAlias, eq(people.directManagerId, managerAlias.id))
      .where(
        type
          ? and(eq(people.organizationId, organizationId), eq(people.type, type as any))
          : eq(people.organizationId, organizationId)
      )
      .orderBy(asc(people.firstName));

    return query;
  },

  // ── Single ────────────────────────────────────────────────────────────────

  async getPersonById(id: string, organizationId: string) {
    const managerAlias = db
      .select({
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
      })
      .from(people)
      .as("managers");

    const [person] = await db
      .select({
        id: people.id,
        type: people.type,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        phone: people.phone,
        avatarUrl: people.avatarUrl,
        position: people.position,
        department: people.department,
        country: people.country,
        startDate: people.startDate,
        endDate: people.endDate,
        status: people.status,
        seniorityLevel: people.seniorityLevel,
        paymentAmount: people.paymentAmount,
        directManagerId: people.directManagerId,
        groupName: people.groupName,
        dateOfBirth: people.dateOfBirth,
        nationality: people.nationality,
        address: people.address,
        employmentType: people.employmentType,
        salary: people.salary,
        salaryFrequency: people.salaryFrequency,
        salaryCurrency: people.salaryCurrency,
        hourlyRate: people.hourlyRate,
        contractRate: people.contractRate,
        rateCurrency: people.rateCurrency,
        contractStartDate: people.contractStartDate,
        contractEndDate: people.contractEndDate,
        paymentSourceId: people.paymentSourceId,
        organizationId: people.organizationId,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
        managerFirstName: managerAlias.firstName,
        managerLastName: managerAlias.lastName,
      })
      .from(people)
      .leftJoin(managerAlias, eq(people.directManagerId, managerAlias.id))
      .where(and(eq(people.id, id), eq(people.organizationId, organizationId)));

    return person;
  },

  // ── Create ────────────────────────────────────────────────────────────────

  async createPerson(data: any, organizationId: string) {
    const [record] = await db
      .insert(people)
      .values({ ...data, organizationId })
      .returning();
    return record;
  },

  // ── Update ────────────────────────────────────────────────────────────────

  async updatePerson(id: string, data: any, organizationId: string) {
    const [record] = await db
      .update(people)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(people.id, id), eq(people.organizationId, organizationId)))
      .returning();
    return record;
  },

  // ── Delete ────────────────────────────────────────────────────────────────

  async deletePerson(id: string, organizationId: string) {
    const result = await db
      .delete(people)
      .where(and(eq(people.id, id), eq(people.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getPeopleStats(organizationId: string) {
    const rows = await db
      .select({
        type: people.type,
        count: sql<number>`count(*)::int`,
      })
      .from(people)
      .where(eq(people.organizationId, organizationId))
      .groupBy(people.type);

    let total = 0;
    let employees = 0;
    let contractors = 0;

    for (const row of rows) {
      total += row.count;
      if (row.type === "employee") employees = row.count;
      if (row.type === "contractor") contractors = row.count;
    }

    return { total, employees, contractors };
  },
};
