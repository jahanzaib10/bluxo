import { db } from "../../db";
import { performanceReviews, performanceGoals, people } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const performanceStorage = {
  // ── Reviews ───────────────────────────────────────────────────────────────

  async getReviews(organizationId: string) {
    return db
      .select({
        id: performanceReviews.id,
        personId: performanceReviews.personId,
        reviewerId: performanceReviews.reviewerId,
        period: performanceReviews.period,
        rating: performanceReviews.rating,
        strengths: performanceReviews.strengths,
        improvements: performanceReviews.improvements,
        goals: performanceReviews.goals,
        status: performanceReviews.status,
        organizationId: performanceReviews.organizationId,
        createdAt: performanceReviews.createdAt,
        personFirstName: people.firstName,
        personLastName: people.lastName,
      })
      .from(performanceReviews)
      .leftJoin(people, eq(performanceReviews.personId, people.id))
      .where(eq(performanceReviews.organizationId, organizationId))
      .orderBy(desc(performanceReviews.createdAt));
  },

  async getReviewsByPerson(personId: string, organizationId: string) {
    return db
      .select({
        id: performanceReviews.id,
        personId: performanceReviews.personId,
        reviewerId: performanceReviews.reviewerId,
        period: performanceReviews.period,
        rating: performanceReviews.rating,
        strengths: performanceReviews.strengths,
        improvements: performanceReviews.improvements,
        goals: performanceReviews.goals,
        status: performanceReviews.status,
        organizationId: performanceReviews.organizationId,
        createdAt: performanceReviews.createdAt,
        personFirstName: people.firstName,
        personLastName: people.lastName,
      })
      .from(performanceReviews)
      .leftJoin(people, eq(performanceReviews.personId, people.id))
      .where(
        and(
          eq(performanceReviews.personId, personId),
          eq(performanceReviews.organizationId, organizationId)
        )
      )
      .orderBy(desc(performanceReviews.createdAt));
  },

  async createReview(data: any, organizationId: string) {
    const [review] = await db
      .insert(performanceReviews)
      .values({ ...data, status: "draft", organizationId })
      .returning();
    return review;
  },

  async updateReview(id: string, data: any, organizationId: string) {
    const [updated] = await db
      .update(performanceReviews)
      .set(data)
      .where(
        and(
          eq(performanceReviews.id, id),
          eq(performanceReviews.organizationId, organizationId)
        )
      )
      .returning();
    return updated;
  },

  // ── Goals ─────────────────────────────────────────────────────────────────

  async getGoals(organizationId: string) {
    return db
      .select({
        id: performanceGoals.id,
        personId: performanceGoals.personId,
        title: performanceGoals.title,
        description: performanceGoals.description,
        targetDate: performanceGoals.targetDate,
        status: performanceGoals.status,
        organizationId: performanceGoals.organizationId,
        createdAt: performanceGoals.createdAt,
        personFirstName: people.firstName,
        personLastName: people.lastName,
      })
      .from(performanceGoals)
      .leftJoin(people, eq(performanceGoals.personId, people.id))
      .where(eq(performanceGoals.organizationId, organizationId))
      .orderBy(desc(performanceGoals.createdAt));
  },

  async getGoalsByPerson(personId: string, organizationId: string) {
    return db
      .select({
        id: performanceGoals.id,
        personId: performanceGoals.personId,
        title: performanceGoals.title,
        description: performanceGoals.description,
        targetDate: performanceGoals.targetDate,
        status: performanceGoals.status,
        organizationId: performanceGoals.organizationId,
        createdAt: performanceGoals.createdAt,
        personFirstName: people.firstName,
        personLastName: people.lastName,
      })
      .from(performanceGoals)
      .leftJoin(people, eq(performanceGoals.personId, people.id))
      .where(
        and(
          eq(performanceGoals.personId, personId),
          eq(performanceGoals.organizationId, organizationId)
        )
      )
      .orderBy(desc(performanceGoals.createdAt));
  },

  async createGoal(data: any, organizationId: string) {
    const [goal] = await db
      .insert(performanceGoals)
      .values({ ...data, status: "not_started", organizationId })
      .returning();
    return goal;
  },

  async updateGoal(id: string, data: any, organizationId: string) {
    const [updated] = await db
      .update(performanceGoals)
      .set(data)
      .where(
        and(
          eq(performanceGoals.id, id),
          eq(performanceGoals.organizationId, organizationId)
        )
      )
      .returning();
    return updated;
  },
};
