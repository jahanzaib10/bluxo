import { db } from "../../db";
import { leavePolicies, leaveBalances, leaveRequests, people } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export const leaveStorage = {
  // ── Leave Policies ────────────────────────────────────────────────────────

  async getLeavePolicies(organizationId: string) {
    return await db
      .select()
      .from(leavePolicies)
      .where(eq(leavePolicies.organizationId, organizationId))
      .orderBy(asc(leavePolicies.name));
  },

  async createLeavePolicy(data: any, organizationId: string) {
    const [policy] = await db
      .insert(leavePolicies)
      .values({ ...data, organizationId })
      .returning();
    return policy;
  },

  async deleteLeavePolicy(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(leavePolicies)
      .where(and(eq(leavePolicies.id, id), eq(leavePolicies.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // ── Leave Balances ────────────────────────────────────────────────────────

  async getLeaveBalances(personId: string, organizationId: string) {
    return await db
      .select({
        id: leaveBalances.id,
        personId: leaveBalances.personId,
        policyId: leaveBalances.policyId,
        year: leaveBalances.year,
        entitled: leaveBalances.entitled,
        used: leaveBalances.used,
        carried: leaveBalances.carried,
        remaining: leaveBalances.remaining,
        organizationId: leaveBalances.organizationId,
        policyName: leavePolicies.name,
      })
      .from(leaveBalances)
      .leftJoin(leavePolicies, eq(leaveBalances.policyId, leavePolicies.id))
      .where(
        and(
          eq(leaveBalances.personId, personId),
          eq(leaveBalances.organizationId, organizationId)
        )
      );
  },

  async initializeLeaveBalances(personId: string, organizationId: string, year: number) {
    // Get the person to determine their type (employee/contractor)
    const [person] = await db
      .select()
      .from(people)
      .where(and(eq(people.id, personId), eq(people.organizationId, organizationId)));

    if (!person) {
      throw new Error("Person not found");
    }

    // Get all applicable policies for this person's type
    const applicablePolicies = await db
      .select()
      .from(leavePolicies)
      .where(eq(leavePolicies.organizationId, organizationId));

    const filteredPolicies = applicablePolicies.filter(
      (p) =>
        p.appliesToType === "all" ||
        p.appliesToType === person.type
    );

    // Check existing balances to avoid duplicates
    const existingBalances = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.personId, personId),
          eq(leaveBalances.organizationId, organizationId)
        )
      );

    const existingPolicyIds = new Set(
      existingBalances
        .filter((b) => b.year === year)
        .map((b) => b.policyId)
    );

    const newBalances = filteredPolicies
      .filter((p) => !existingPolicyIds.has(p.id))
      .map((p) => ({
        personId,
        policyId: p.id,
        year,
        entitled: p.daysPerYear,
        used: 0,
        carried: 0,
        remaining: p.daysPerYear,
        organizationId,
      }));

    if (newBalances.length === 0) {
      return [];
    }

    return await db.insert(leaveBalances).values(newBalances).returning();
  },

  // ── Leave Requests ────────────────────────────────────────────────────────

  async getLeaveRequests(organizationId: string) {
    return await db
      .select({
        id: leaveRequests.id,
        personId: leaveRequests.personId,
        policyId: leaveRequests.policyId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        days: leaveRequests.days,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        reviewedById: leaveRequests.reviewedById,
        reviewedAt: leaveRequests.reviewedAt,
        organizationId: leaveRequests.organizationId,
        createdAt: leaveRequests.createdAt,
        personFirstName: people.firstName,
        personLastName: people.lastName,
        policyName: leavePolicies.name,
      })
      .from(leaveRequests)
      .leftJoin(people, eq(leaveRequests.personId, people.id))
      .leftJoin(leavePolicies, eq(leaveRequests.policyId, leavePolicies.id))
      .where(eq(leaveRequests.organizationId, organizationId))
      .orderBy(desc(leaveRequests.createdAt));
  },

  async getLeaveRequestsByPerson(personId: string, organizationId: string) {
    return await db
      .select({
        id: leaveRequests.id,
        personId: leaveRequests.personId,
        policyId: leaveRequests.policyId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        days: leaveRequests.days,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        reviewedById: leaveRequests.reviewedById,
        reviewedAt: leaveRequests.reviewedAt,
        organizationId: leaveRequests.organizationId,
        createdAt: leaveRequests.createdAt,
        personFirstName: people.firstName,
        personLastName: people.lastName,
        policyName: leavePolicies.name,
      })
      .from(leaveRequests)
      .leftJoin(people, eq(leaveRequests.personId, people.id))
      .leftJoin(leavePolicies, eq(leaveRequests.policyId, leavePolicies.id))
      .where(
        and(
          eq(leaveRequests.personId, personId),
          eq(leaveRequests.organizationId, organizationId)
        )
      )
      .orderBy(desc(leaveRequests.createdAt));
  },

  async createLeaveRequest(data: any, organizationId: string) {
    const [request] = await db
      .insert(leaveRequests)
      .values({ ...data, organizationId, status: "pending" })
      .returning();
    return request;
  },

  async approveLeaveRequest(id: string, reviewerId: string, organizationId: string) {
    const now = new Date();

    const [request] = await db
      .update(leaveRequests)
      .set({ status: "approved", reviewedById: reviewerId, reviewedAt: now } as any)
      .where(
        and(
          eq(leaveRequests.id, id),
          eq(leaveRequests.organizationId, organizationId)
        )
      )
      .returning();

    if (!request) {
      return null;
    }

    // Update used days in the leave balance for the current year
    const year = new Date(request.startDate).getFullYear();
    const daysUsed = parseFloat(request.days as string);

    const [balance] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.personId, request.personId),
          eq(leaveBalances.policyId, request.policyId),
          eq(leaveBalances.organizationId, organizationId)
        )
      );

    if (balance && balance.year === year) {
      const newUsed = (balance.used ?? 0) + daysUsed;
      const newRemaining = balance.entitled - newUsed + (balance.carried ?? 0);
      await db
        .update(leaveBalances)
        .set({ used: newUsed, remaining: newRemaining } as any)
        .where(eq(leaveBalances.id, balance.id));
    }

    return request;
  },

  async rejectLeaveRequest(id: string, reviewerId: string, organizationId: string) {
    const now = new Date();

    const [request] = await db
      .update(leaveRequests)
      .set({ status: "rejected", reviewedById: reviewerId, reviewedAt: now } as any)
      .where(
        and(
          eq(leaveRequests.id, id),
          eq(leaveRequests.organizationId, organizationId)
        )
      )
      .returning();

    return request ?? null;
  },
};
