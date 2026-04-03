import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { payrollStorage } from "./payroll-storage";
import { insertPayrollRunSchema, insertPayrollItemSchema } from "@shared/schema";

const router = Router();

router.use("/api/payroll", requireOrg);

// GET /api/payroll — list all payroll runs for the org
router.get("/api/payroll", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const runs = await payrollStorage.getPayrollRunsByOrg(organizationId);
    res.json(runs);
  } catch (error) {
    console.error("Error fetching payroll runs:", error);
    res.status(500).json({ message: "Failed to fetch payroll runs" });
  }
});

// GET /api/payroll/:id — get a single run with its items
router.get("/api/payroll/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const run = await payrollStorage.getPayrollRunById(id, organizationId);
    if (!run) {
      return res.status(404).json({ message: "Payroll run not found" });
    }
    res.json(run);
  } catch (error) {
    console.error("Error fetching payroll run:", error);
    res.status(500).json({ message: "Failed to fetch payroll run" });
  }
});

// POST /api/payroll — create a new payroll run (status defaults to "draft")
router.post("/api/payroll", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const validatedData = insertPayrollRunSchema.parse(req.body);
    const run = await payrollStorage.createPayrollRun(validatedData, organizationId);
    res.status(201).json(run);
  } catch (error) {
    console.error("Error creating payroll run:", error);
    res.status(500).json({ message: "Failed to create payroll run" });
  }
});

// POST /api/payroll/:id/items — add an item to a run
router.post("/api/payroll/:id/items", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);

    // Verify the run belongs to this org
    const run = await payrollStorage.getPayrollRunById(id, organizationId);
    if (!run) {
      return res.status(404).json({ message: "Payroll run not found" });
    }

    const validatedData = insertPayrollItemSchema.parse({ ...req.body, payrollRunId: id });
    const item = await payrollStorage.addPayrollItem(validatedData);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding payroll item:", error);
    res.status(500).json({ message: "Failed to add payroll item" });
  }
});

// PUT /api/payroll/:id — update status and recalculate totals
router.put("/api/payroll/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const validatedData = insertPayrollRunSchema.partial().parse(req.body);
    const run = await payrollStorage.updatePayrollRun(id, validatedData, organizationId);
    if (!run) {
      return res.status(404).json({ message: "Payroll run not found" });
    }
    res.json(run);
  } catch (error) {
    console.error("Error updating payroll run:", error);
    res.status(500).json({ message: "Failed to update payroll run" });
  }
});

// DELETE /api/payroll/:id — delete run (cascade deletes items via DB constraint)
router.delete("/api/payroll/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const deleted = await payrollStorage.deletePayrollRun(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ message: "Payroll run not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting payroll run:", error);
    res.status(500).json({ message: "Failed to delete payroll run" });
  }
});

export default router;
