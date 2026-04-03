import { Router, Response } from "express";
import { requireOrg, getOrgId, getUserClerkId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { leaveStorage } from "./leave-storage";
import { insertLeavePolicySchema, insertLeaveRequestSchema } from "@shared/schema";

const router = Router();

// All leave routes require an active org context
router.use("/api/leave-policies", requireOrg);
router.use("/api/leave-requests", requireOrg);
router.use("/api/leave-balances", requireOrg);

// ── GET /api/leave-policies ────────────────────────────────────────────────
router.get("/api/leave-policies", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const policies = await leaveStorage.getLeavePolicies(organizationId);
    res.json(policies);
  } catch (error) {
    console.error("Error fetching leave policies:", error);
    res.status(500).json({ message: "Failed to fetch leave policies" });
  }
});

// ── POST /api/leave-policies ───────────────────────────────────────────────
router.post("/api/leave-policies", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertLeavePolicySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid leave policy data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const policy = await leaveStorage.createLeavePolicy(parsed.data, organizationId);
    res.status(201).json(policy);
  } catch (error) {
    console.error("Error creating leave policy:", error);
    res.status(500).json({ message: "Failed to create leave policy" });
  }
});

// ── DELETE /api/leave-policies/:id ────────────────────────────────────────
router.delete("/api/leave-policies/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const { id } = req.params;

    const success = await leaveStorage.deleteLeavePolicy(id, organizationId);

    if (success) {
      res.json({ message: "Leave policy deleted successfully" });
    } else {
      res.status(404).json({ message: "Leave policy not found" });
    }
  } catch (error) {
    console.error("Error deleting leave policy:", error);
    res.status(500).json({ message: "Failed to delete leave policy" });
  }
});

// ── GET /api/leave-requests ────────────────────────────────────────────────
router.get("/api/leave-requests", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const requests = await leaveStorage.getLeaveRequests(organizationId);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
});

// ── GET /api/leave-requests/person/:personId ──────────────────────────────
router.get("/api/leave-requests/person/:personId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const { personId } = req.params;
    const requests = await leaveStorage.getLeaveRequestsByPerson(personId, organizationId);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching leave requests for person:", error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
});

// ── POST /api/leave-requests ───────────────────────────────────────────────
router.post("/api/leave-requests", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertLeaveRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid leave request data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const request = await leaveStorage.createLeaveRequest(parsed.data, organizationId);
    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ message: "Failed to create leave request" });
  }
});

// ── PUT /api/leave-requests/:id/approve ───────────────────────────────────
router.put("/api/leave-requests/:id/approve", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const reviewerId = getUserClerkId(req);
    const { id } = req.params;

    const request = await leaveStorage.approveLeaveRequest(id, reviewerId, organizationId);

    if (!request) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Error approving leave request:", error);
    res.status(500).json({ message: "Failed to approve leave request" });
  }
});

// ── PUT /api/leave-requests/:id/reject ────────────────────────────────────
router.put("/api/leave-requests/:id/reject", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const reviewerId = getUserClerkId(req);
    const { id } = req.params;

    const request = await leaveStorage.rejectLeaveRequest(id, reviewerId, organizationId);

    if (!request) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({ message: "Failed to reject leave request" });
  }
});

// ── GET /api/leave-balances/:personId ─────────────────────────────────────
router.get("/api/leave-balances/:personId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const { personId } = req.params;
    const balances = await leaveStorage.getLeaveBalances(personId, organizationId);
    res.json(balances);
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    res.status(500).json({ message: "Failed to fetch leave balances" });
  }
});

export default router;
