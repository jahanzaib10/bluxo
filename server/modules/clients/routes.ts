import { Router, Response } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { clientsStorage } from "./storage";
import { insertClientSchema, insertClientPermissionsSchema } from "@shared/schema";

const router = Router();

// All client routes require an active org context
router.use(requireOrg);

// ── GET /api/clients ──────────────────────────────────────────────────────
router.get("/api/clients", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const result = await clientsStorage.getClients(organizationId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// ── POST /api/clients ─────────────────────────────────────────────────────
router.post("/api/clients", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const parsed = insertClientSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid client data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const newClient = await clientsStorage.createClient({
      ...parsed.data,
      organizationId,
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Failed to create client" });
  }
});

// ── POST /api/clients/import (bulk CSV) ───────────────────────────────────
router.post("/api/clients/import", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const { clients: clientData } = req.body;

    if (!Array.isArray(clientData) || clientData.length === 0) {
      return res.status(400).json({
        message: "Invalid client data",
        details: "Expected an array of client records",
      });
    }

    const { imported, errors } = await clientsStorage.bulkImportClients(
      clientData,
      organizationId
    );

    res.status(200).json({
      message: `Successfully imported ${imported.length} of ${clientData.length} clients`,
      imported: imported.length,
      total: clientData.length,
      errors: errors.length > 0 ? errors : undefined,
      clients: imported,
    });
  } catch (error) {
    console.error("Error importing clients:", error);
    res.status(500).json({
      message: "Failed to import clients",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ── DELETE /api/clients/:id ───────────────────────────────────────────────
router.delete("/api/clients/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = getOrgId(req);
    const { id } = req.params;

    const success = await clientsStorage.deleteClient(id, organizationId);

    if (success) {
      res.json({ message: "Client deleted successfully" });
    } else {
      res.status(404).json({ message: "Client not found" });
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Failed to delete client" });
  }
});

// ── PUT /api/client-permissions/:clientId ────────────────────────────────
router.put("/api/client-permissions/:clientId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const organizationId = getOrgId(req);

    const parsed = insertClientPermissionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid permissions data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const permissions = await clientsStorage.upsertClientPermissions({
      ...parsed.data,
      clientId,
      organizationId,
    });

    res.json(permissions);
  } catch (error) {
    console.error("Error updating client permissions:", error);
    res.status(500).json({ message: "Failed to update client permissions" });
  }
});

export default router;
