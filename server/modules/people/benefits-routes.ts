import { Router, Response } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { benefitsStorage } from "./benefits-storage";
import { insertBenefitPlanSchema, insertBenefitEnrollmentSchema } from "@shared/schema";

const router = Router();

router.use("/api", requireOrg);

// ── GET /api/benefits/plans ───────────────────────────────────────────────────

router.get("/api/benefits/plans", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const plans = await benefitsStorage.getBenefitPlans(organizationId);
    res.json(plans);
  } catch (error) {
    console.error("Error fetching benefit plans:", error);
    res.status(500).json({ message: "Failed to fetch benefit plans" });
  }
});

// ── POST /api/benefits/plans ──────────────────────────────────────────────────

router.post("/api/benefits/plans", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertBenefitPlanSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid benefit plan data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const plan = await benefitsStorage.createBenefitPlan(parsed.data, organizationId);
    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating benefit plan:", error);
    res.status(500).json({ message: "Failed to create benefit plan" });
  }
});

// ── PUT /api/benefits/plans/:id ───────────────────────────────────────────────

router.put("/api/benefits/plans/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const parsed = insertBenefitPlanSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid benefit plan data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const plan = await benefitsStorage.updateBenefitPlan(id, parsed.data, organizationId);
    if (!plan) {
      return res.status(404).json({ message: "Benefit plan not found" });
    }
    res.json(plan);
  } catch (error) {
    console.error("Error updating benefit plan:", error);
    res.status(500).json({ message: "Failed to update benefit plan" });
  }
});

// ── DELETE /api/benefits/plans/:id ────────────────────────────────────────────

router.delete("/api/benefits/plans/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const success = await benefitsStorage.deleteBenefitPlan(id, organizationId);
    if (!success) {
      return res.status(404).json({ message: "Benefit plan not found" });
    }
    res.json({ message: "Benefit plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting benefit plan:", error);
    res.status(500).json({ message: "Failed to delete benefit plan" });
  }
});

// ── GET /api/benefits/enrollments ─────────────────────────────────────────────

router.get("/api/benefits/enrollments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const enrollments = await benefitsStorage.getAllEnrollments(organizationId);
    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

// ── GET /api/benefits/enrollments/person/:personId ────────────────────────────
// IMPORTANT: must be registered BEFORE /api/benefits/enrollments/:id

router.get("/api/benefits/enrollments/person/:personId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { personId } = req.params;
    const organizationId = getOrgId(req);
    const enrollments = await benefitsStorage.getEnrollmentsByPerson(personId, organizationId);
    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching person enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments for person" });
  }
});

// ── POST /api/benefits/enrollments ────────────────────────────────────────────

router.post("/api/benefits/enrollments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertBenefitEnrollmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid enrollment data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const enrollment = await benefitsStorage.enrollPerson(parsed.data, organizationId);
    res.status(201).json(enrollment);
  } catch (error) {
    console.error("Error enrolling person:", error);
    res.status(500).json({ message: "Failed to enroll person" });
  }
});

// ── PUT /api/benefits/enrollments/:id ─────────────────────────────────────────

router.put("/api/benefits/enrollments/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const parsed = insertBenefitEnrollmentSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid enrollment data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const enrollment = await benefitsStorage.updateEnrollment(id, parsed.data, organizationId);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    res.json(enrollment);
  } catch (error) {
    console.error("Error updating enrollment:", error);
    res.status(500).json({ message: "Failed to update enrollment" });
  }
});

export default router;
