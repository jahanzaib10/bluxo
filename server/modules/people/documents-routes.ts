import { Router, Response } from "express";
import { requireOrg, getOrgId, getUserClerkId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { documentsStorage } from "./documents-storage";
import { insertPersonDocumentSchema } from "@shared/schema";

const router = Router();

router.use("/api/people", requireOrg);

// ── GET /api/people/:personId/documents ──────────────────────────────────────

router.get(
  "/api/people/:personId/documents",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { personId } = req.params;
      const organizationId = getOrgId(req);
      const docs = await documentsStorage.getDocumentsByPerson(personId, organizationId);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching person documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  }
);

// ── POST /api/people/:personId/documents ─────────────────────────────────────

router.post(
  "/api/people/:personId/documents",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const organizationId = getOrgId(req);
      const uploadedById = getUserClerkId(req);

      const parsed = insertPersonDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid document data",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = { ...parsed.data, personId: req.params.personId, uploadedById };
      const doc = await documentsStorage.createDocument(data, organizationId);
      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating person document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  }
);

// ── DELETE /api/people/:personId/documents/:docId ────────────────────────────

router.delete(
  "/api/people/:personId/documents/:docId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { docId } = req.params;
      const organizationId = getOrgId(req);
      const deleted = await documentsStorage.deleteDocument(docId, organizationId);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  }
);

export default router;
