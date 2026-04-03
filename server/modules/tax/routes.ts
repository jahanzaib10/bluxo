import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { taxStorage } from "./storage";
import { insertTaxRuleSchema, insertCurrencyRateSchema } from "@shared/schema";

const router = Router();
router.use("/api", requireOrg);

// Tax Rules CRUD
router.get("/api/tax-rules", async (req: AuthenticatedRequest, res) => {
  try { res.json(await taxStorage.getTaxRulesByOrg(getOrgId(req))); }
  catch (error: any) { res.status(500).json({ message: error.message }); }
});

router.post("/api/tax-rules", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertTaxRuleSchema.parse(req.body);
    res.status(201).json(await taxStorage.createTaxRule(parsed, getOrgId(req)));
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

router.put("/api/tax-rules/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.updateTaxRule(req.params.id, req.body, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Tax rule not found" });
    res.json(result);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

router.delete("/api/tax-rules/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.deleteTaxRule(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Tax rule not found" });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

// Currency Rates
router.get("/api/currency-rates", async (req: AuthenticatedRequest, res) => {
  try { res.json(await taxStorage.getCurrencyRatesByOrg(getOrgId(req))); }
  catch (error: any) { res.status(500).json({ message: error.message }); }
});

router.post("/api/currency-rates", async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = insertCurrencyRateSchema.parse(req.body);
    res.status(201).json(await taxStorage.createCurrencyRate(parsed, getOrgId(req)));
  } catch (error: any) { res.status(400).json({ message: error.message }); }
});

router.delete("/api/currency-rates/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await taxStorage.deleteCurrencyRate(req.params.id, getOrgId(req));
    if (!result) return res.status(404).json({ message: "Rate not found" });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
});

export default router;
