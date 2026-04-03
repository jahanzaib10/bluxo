import { Router, Response } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { peopleStorage } from "./storage";
import { insertPersonSchema } from "@shared/schema";

const router = Router();

router.use("/api", requireOrg);

// ── GET /api/people ───────────────────────────────────────────────────────────

router.get("/api/people", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const type = req.query.type as string | undefined;
    const result = await peopleStorage.getPeopleByOrg(organizationId, type);
    res.json(result);
  } catch (error) {
    console.error("Error fetching people:", error);
    res.status(500).json({ message: "Failed to fetch people" });
  }
});

// ── GET /api/people/stats ─────────────────────────────────────────────────────
// IMPORTANT: must be registered BEFORE /api/people/:id

router.get("/api/people/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const stats = await peopleStorage.getPeopleStats(organizationId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching people stats:", error);
    res.status(500).json({ message: "Failed to fetch people stats" });
  }
});

// ── GET /api/people/:id ───────────────────────────────────────────────────────

router.get("/api/people/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const person = await peopleStorage.getPersonById(id, organizationId);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.json(person);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ message: "Failed to fetch person" });
  }
});

// ── POST /api/people ──────────────────────────────────────────────────────────

router.post("/api/people", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertPersonSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid person data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const newPerson = await peopleStorage.createPerson(parsed.data, organizationId);
    res.status(201).json(newPerson);
  } catch (error) {
    console.error("Error creating person:", error);
    res.status(500).json({ message: "Failed to create person" });
  }
});

// ── PUT /api/people/:id ───────────────────────────────────────────────────────

router.put("/api/people/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const parsed = insertPersonSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid person data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const updatedPerson = await peopleStorage.updatePerson(id, parsed.data, organizationId);
    if (!updatedPerson) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.json(updatedPerson);
  } catch (error) {
    console.error("Error updating person:", error);
    res.status(500).json({ message: "Failed to update person" });
  }
});

// ── DELETE /api/people/:id ────────────────────────────────────────────────────

router.delete("/api/people/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const deleted = await peopleStorage.deletePerson(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting person:", error);
    res.status(500).json({ message: "Failed to delete person" });
  }
});

export default router;
