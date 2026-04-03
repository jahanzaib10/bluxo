import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { analyticsStorage } from "./storage";

const router = Router();

// All analytics routes require an active organization context
router.use(requireOrg);

// GET /api/dashboard/summary
// Returns total income, expenses, net profit, and recurring revenue.
// Optional query params: startDate, endDate (YYYY-MM-DD)
router.get("/summary", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const { startDate, endDate } = req.query as Record<string, string | undefined>;

    const summary = await analyticsStorage.getDashboardSummary(
      organizationId,
      startDate,
      endDate
    );

    res.json(summary);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
});

// GET /api/dashboard/trends
// Returns monthly income/expense trends (last 12 months).
router.get("/trends", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const trends = await analyticsStorage.getMonthlyTrends(organizationId);
    res.json(trends);
  } catch (error) {
    console.error("Error fetching dashboard trends:", error);
    res.status(500).json({ message: "Failed to fetch dashboard trends" });
  }
});

// GET /api/dashboard/client-contribution
// Returns revenue per client with percentage of total.
// Optional query params: clientId (reserved for future filtering)
router.get("/client-contribution", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const contributions = await analyticsStorage.getClientContribution(organizationId);
    res.json(contributions);
  } catch (error) {
    console.error("Error fetching client contribution:", error);
    res.status(500).json({ message: "Failed to fetch client contribution" });
  }
});

// GET /api/dashboard/expense-breakdown
// Returns top 5 expense categories (rolled up to parent category).
// Optional query params: categoryId (reserved for future filtering)
router.get("/expense-breakdown", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const breakdown = await analyticsStorage.getExpenseBreakdown(organizationId);
    res.json(breakdown);
  } catch (error) {
    console.error("Error fetching expense breakdown:", error);
    res.status(500).json({ message: "Failed to fetch expense breakdown" });
  }
});

export default router;
