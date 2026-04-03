import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { invoicingStorage } from "./storage";
import { insertInvoiceSchema, updateInvoiceStatusSchema } from "@shared/schema";

const router = Router();

router.use("/api", requireOrg);

// GET /api/invoices — list all invoices
router.get("/api/invoices", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const records = await invoicingStorage.getInvoicesByOrg(organizationId);
    res.json(records);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

// GET /api/invoices/:id — get invoice with line items
router.get("/api/invoices/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const invoice = await invoicingStorage.getInvoiceById(id, organizationId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

// POST /api/invoices — create invoice (with lineItems array in body)
router.post("/api/invoices", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const validatedData = insertInvoiceSchema.parse(req.body);
    const invoice = await invoicingStorage.createInvoice(validatedData, organizationId);
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create invoice" });
  }
});

// PUT /api/invoices/:id/status — update status
router.put("/api/invoices/:id/status", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const { status } = updateInvoiceStatusSchema.parse(req.body);
    const updated = await invoicingStorage.updateInvoiceStatus(id, status, organizationId);
    if (!updated) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating invoice status:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update invoice status" });
  }
});

// DELETE /api/invoices/:id — delete invoice
router.delete("/api/invoices/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const deleted = await invoicingStorage.deleteInvoice(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ message: "Failed to delete invoice" });
  }
});

export default router;
