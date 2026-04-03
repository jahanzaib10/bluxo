import { Router } from "express";
import { requireOrg, getOrgId, getUserClerkId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { onboardingStorage } from "./onboarding-storage";
import {
  insertOnboardingTemplateSchema,
  insertOnboardingStepSchema,
} from "@shared/schema";

const router = Router();

router.use("/api/onboarding", requireOrg);

// GET /api/onboarding/templates — list templates with step counts
router.get("/api/onboarding/templates", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const templates = await onboardingStorage.getTemplates(organizationId);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching onboarding templates:", error);
    res.status(500).json({ message: "Failed to fetch onboarding templates" });
  }
});

// POST /api/onboarding/templates — create template
router.post("/api/onboarding/templates", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertOnboardingTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid template data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const template = await onboardingStorage.createTemplate(parsed.data, organizationId);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating onboarding template:", error);
    res.status(500).json({ message: "Failed to create onboarding template" });
  }
});

// DELETE /api/onboarding/templates/:id — delete template (cascade deletes steps)
router.delete("/api/onboarding/templates/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const deleted = await onboardingStorage.deleteTemplate(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting onboarding template:", error);
    res.status(500).json({ message: "Failed to delete onboarding template" });
  }
});

// POST /api/onboarding/templates/:id/steps — add step to template
router.post("/api/onboarding/templates/:id/steps", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = insertOnboardingStepSchema.safeParse({ ...req.body, templateId: id });
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid step data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const step = await onboardingStorage.addStep(parsed.data);
    res.status(201).json(step);
  } catch (error) {
    console.error("Error adding onboarding step:", error);
    res.status(500).json({ message: "Failed to add onboarding step" });
  }
});

// GET /api/onboarding/templates/:id/steps — list steps for template
router.get("/api/onboarding/templates/:id/steps", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const steps = await onboardingStorage.getStepsByTemplate(id);
    res.json(steps);
  } catch (error) {
    console.error("Error fetching onboarding steps:", error);
    res.status(500).json({ message: "Failed to fetch onboarding steps" });
  }
});

// GET /api/onboarding/person/:personId — progress for a person
router.get("/api/onboarding/person/:personId", async (req: AuthenticatedRequest, res) => {
  try {
    const { personId } = req.params;
    const organizationId = getOrgId(req);
    const progress = await onboardingStorage.getPersonProgress(personId, organizationId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Failed to fetch onboarding progress" });
  }
});

// POST /api/onboarding/assign — assign template to person { personId, templateId }
router.post("/api/onboarding/assign", async (req: AuthenticatedRequest, res) => {
  try {
    const { personId, templateId } = req.body;
    if (!personId || !templateId) {
      return res.status(400).json({ message: "personId and templateId are required" });
    }
    const organizationId = getOrgId(req);
    const progress = await onboardingStorage.assignTemplate(personId, templateId, organizationId);
    res.status(201).json(progress);
  } catch (error) {
    console.error("Error assigning onboarding template:", error);
    res.status(500).json({ message: "Failed to assign onboarding template" });
  }
});

// PUT /api/onboarding/progress/:id — update step status { status }
router.put("/api/onboarding/progress/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }
    const completedById = getUserClerkId(req);
    const updated = await onboardingStorage.updateProgress(id, status, completedById);
    if (!updated) {
      return res.status(404).json({ message: "Progress record not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    res.status(500).json({ message: "Failed to update onboarding progress" });
  }
});

export default router;
