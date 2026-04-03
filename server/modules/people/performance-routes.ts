import { Router } from "express";
import { requireOrg, getOrgId, getUserClerkId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { performanceStorage } from "./performance-storage";
import {
  insertPerformanceReviewSchema,
  insertPerformanceGoalSchema,
} from "@shared/schema";

const router = Router();

router.use("/api/performance", requireOrg);

// GET /api/performance/reviews — list all reviews
router.get("/api/performance/reviews", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const reviews = await performanceStorage.getReviews(organizationId);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching performance reviews:", error);
    res.status(500).json({ message: "Failed to fetch performance reviews" });
  }
});

// GET /api/performance/reviews/person/:personId — reviews for a person
router.get("/api/performance/reviews/person/:personId", async (req: AuthenticatedRequest, res) => {
  try {
    const { personId } = req.params;
    const organizationId = getOrgId(req);
    const reviews = await performanceStorage.getReviewsByPerson(personId, organizationId);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching performance reviews for person:", error);
    res.status(500).json({ message: "Failed to fetch performance reviews" });
  }
});

// POST /api/performance/reviews — create review
router.post("/api/performance/reviews", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const reviewerId = getUserClerkId(req);
    const parsed = insertPerformanceReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid review data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const review = await performanceStorage.createReview(
      { ...parsed.data, reviewerId },
      organizationId
    );
    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating performance review:", error);
    res.status(500).json({ message: "Failed to create performance review" });
  }
});

// PUT /api/performance/reviews/:id — update review
router.put("/api/performance/reviews/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const parsed = insertPerformanceReviewSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid review data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const updated = await performanceStorage.updateReview(id, parsed.data, organizationId);
    if (!updated) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating performance review:", error);
    res.status(500).json({ message: "Failed to update performance review" });
  }
});

// GET /api/performance/goals — list all goals
router.get("/api/performance/goals", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const goals = await performanceStorage.getGoals(organizationId);
    res.json(goals);
  } catch (error) {
    console.error("Error fetching performance goals:", error);
    res.status(500).json({ message: "Failed to fetch performance goals" });
  }
});

// GET /api/performance/goals/person/:personId — goals for a person
router.get("/api/performance/goals/person/:personId", async (req: AuthenticatedRequest, res) => {
  try {
    const { personId } = req.params;
    const organizationId = getOrgId(req);
    const goals = await performanceStorage.getGoalsByPerson(personId, organizationId);
    res.json(goals);
  } catch (error) {
    console.error("Error fetching performance goals for person:", error);
    res.status(500).json({ message: "Failed to fetch performance goals" });
  }
});

// POST /api/performance/goals — create goal
router.post("/api/performance/goals", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertPerformanceGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid goal data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const goal = await performanceStorage.createGoal(parsed.data, organizationId);
    res.status(201).json(goal);
  } catch (error) {
    console.error("Error creating performance goal:", error);
    res.status(500).json({ message: "Failed to create performance goal" });
  }
});

// PUT /api/performance/goals/:id — update goal
router.put("/api/performance/goals/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const parsed = insertPerformanceGoalSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid goal data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const updated = await performanceStorage.updateGoal(id, parsed.data, organizationId);
    if (!updated) {
      return res.status(404).json({ message: "Goal not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating performance goal:", error);
    res.status(500).json({ message: "Failed to update performance goal" });
  }
});

export default router;
