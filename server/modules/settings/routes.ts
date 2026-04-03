import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { settingsStorage } from "./storage";
import {
  insertCategorySchema,
  insertPaymentSourceSchema,
  insertOrganizationSchema,
} from "@shared/schema";

const router = Router();

router.use(requireOrg);

// ─── Categories ──────────────────────────────────────────────────────────────

router.get("/categories", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const result = await settingsStorage.getCategories(organizationId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/categories/import", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const { data: categoryData } = req.body;

    if (!Array.isArray(categoryData) || categoryData.length === 0) {
      return res.status(400).json({ message: "Invalid or empty category data provided" });
    }

    const { inserted, skipped, errors } = await settingsStorage.importCategories(
      organizationId,
      categoryData
    );

    res.status(200).json({
      message: `Import completed: ${inserted.length} imported, ${skipped.length} skipped (duplicates), ${errors.length} errors`,
      imported: inserted.length,
      skipped: skipped.length,
      errors: errors.length,
      total: categoryData.length,
      skippedCategories: skipped.length > 0 ? skipped : undefined,
      errorDetails: errors.length > 0 ? errors : undefined,
      categories: inserted,
    });
  } catch (error) {
    console.error("Error importing categories:", error);
    res.status(500).json({
      message: "Failed to import categories",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/categories", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const newCategory = await settingsStorage.createCategory({ name, type, organizationId });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Failed to create category" });
  }
});

router.delete("/categories/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);

    const success = await settingsStorage.deleteCategory(id, organizationId);

    if (success) {
      res.json({ message: "Category and all child categories deleted successfully" });
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
});

// ─── Payment Sources ──────────────────────────────────────────────────────────

router.get("/payment-sources", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const result = await settingsStorage.getPaymentSources(organizationId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching payment sources:", error);
    res.status(500).json({ message: "Failed to fetch payment sources" });
  }
});

router.post("/payment-sources", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const validatedData = insertPaymentSourceSchema.parse(req.body);
    const newPaymentSource = await settingsStorage.createPaymentSource({
      ...validatedData,
      organizationId,
    });
    res.status(201).json(newPaymentSource);
  } catch (error) {
    console.error("Error creating payment source:", error);
    res.status(500).json({ message: "Failed to create payment source" });
  }
});

router.delete("/payment-sources/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);

    const deleted = await settingsStorage.deletePaymentSource(id, organizationId);

    if (!deleted) {
      return res.status(404).json({ message: "Payment source not found" });
    }

    res.json({ message: "Payment source deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment source:", error);
    res.status(500).json({ message: "Failed to delete payment source" });
  }
});

// ─── Organization Settings ────────────────────────────────────────────────────

router.get("/organization", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const org = await settingsStorage.getOrganization(organizationId);

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json(org);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ message: "Failed to fetch organization" });
  }
});

router.put("/organization", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const validatedData = insertOrganizationSchema.partial().parse(req.body);

    const updated = await settingsStorage.updateOrganization(organizationId, validatedData);

    if (!updated) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({ message: "Failed to update organization" });
  }
});

export default router;
