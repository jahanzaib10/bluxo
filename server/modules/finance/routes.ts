import { Router } from "express";
import { requireOrg, getOrgId } from "../../middleware/orgContext";
import { AuthenticatedRequest } from "../../middleware/clerk";
import { financeStorage } from "./storage";
import { insertIncomeSchema, insertExpenseSchema, insertSubscriptionSchema } from "@shared/schema";

const router = Router();

router.use("/api", requireOrg);

// ── Helper functions ──────────────────────────────────────────────────────────

function sanitizePaymentAmount(value: string): number | null {
  if (!value || typeof value !== "string") return null;
  const cleaned = value
    .trim()
    .replace(/[PKR$£€¥₹,\s%]/g, "")
    .replace(/\.+$/, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function parseFlexibleDate(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  try {
    // MM/DD/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split("/");
      // If day > 12, assume DD/MM/YYYY
      if (parseInt(parts[0]) > 12) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // MM-DD-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split("-");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // YYYY-MM-DD (already correct)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Fallback: Date constructor
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch {
    console.warn(`Invalid date format: ${trimmed}`);
  }

  return null;
}

function normalizeText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text.trim().toLowerCase();
}

function parseBooleanValue(value: string | boolean): boolean {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  const normalized = value.toString().toLowerCase().trim();
  return ["true", "t", "yes", "y", "1", "on"].includes(normalized);
}

// ── Income routes ─────────────────────────────────────────────────────────────

router.get("/income", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const records = await financeStorage.getIncomeByOrg(organizationId);
    res.json(records);
  } catch (error) {
    console.error("Error fetching income:", error);
    res.status(500).json({ message: "Failed to fetch income" });
  }
});

router.post("/income", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const { amount, description, date, clientId, categoryId, paymentSourceId,
            isRecurring, recurringFrequency, recurringEndDate, status, invoiceId, currency } = req.body;

    if (!amount || !date) {
      return res.status(400).json({ message: "Amount and date are required" });
    }

    const newIncome = await financeStorage.createIncome({
      amount,
      description: description || null,
      date,
      clientId: clientId || null,
      categoryId: categoryId || null,
      paymentSourceId: paymentSourceId || null,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      recurringEndDate: recurringEndDate || null,
      status: status || "paid",
      invoiceId: invoiceId || null,
      currency: currency || "USD",
      organizationId,
    });

    res.status(201).json(newIncome);
  } catch (error) {
    console.error("Error creating income:", error);
    res.status(500).json({ message: "Failed to create income" });
  }
});

router.put("/income/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);

    // Clean up empty date/frequency fields before validation
    const cleanedData = { ...req.body };
    ["recurringEndDate", "date"].forEach(field => {
      if (
        cleanedData[field] === "" ||
        cleanedData[field] === undefined ||
        cleanedData[field] === "dd/mm/yyyy"
      ) {
        cleanedData[field] = null;
      }
    });
    if (
      cleanedData.recurringFrequency === "" ||
      cleanedData.recurringFrequency === undefined
    ) {
      cleanedData.recurringFrequency = null;
    }

    const validatedData = insertIncomeSchema.partial().parse(cleanedData);
    const updatedIncome = await financeStorage.updateIncome(id, organizationId, validatedData);
    if (!updatedIncome) {
      return res.status(404).json({ message: "Income not found" });
    }
    res.json(updatedIncome);
  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ message: "Failed to update income" });
  }
});

router.delete("/income/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const deleted = await financeStorage.deleteIncome(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ message: "Income not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({ message: "Failed to delete income" });
  }
});

// POST /income/import — bulk CSV import
router.post("/income/import", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ message: "Invalid CSV data" });
    }

    const orgClients = await financeStorage.getClientsByOrg(organizationId);
    const orgPaymentSources = await financeStorage.getPaymentSourcesByOrg(organizationId);
    const orgCategories = await financeStorage.getCategoriesByOrg(organizationId, "income");

    const results = [];
    const errors = [];

    for (const [index, row] of csvData.entries()) {
      try {
        const amount = sanitizePaymentAmount(row.amount || "0");
        const date = parseFlexibleDate(row.date);

        if (!date) {
          errors.push(`Row ${index + 1}: Invalid date format`);
          continue;
        }

        if (amount === null || amount <= 0) {
          errors.push(`Row ${index + 1}: Invalid amount`);
          continue;
        }

        // Resolve client by name or ID
        const client = orgClients.find(c =>
          c.id === (row.client_id || row.clientId) ||
          normalizeText(c.name) === normalizeText(row.client_name || row.clientName || "")
        );

        // Resolve payment source by name or ID
        const paymentSource = orgPaymentSources.find(p =>
          p.id === (row.payment_source_id || row.paymentSourceId) ||
          normalizeText(p.name) === normalizeText(row.payment_source_name || row.paymentSourceName || "")
        );

        // Resolve category by name
        const category = orgCategories.find(c =>
          normalizeText(c.name) === normalizeText(row.category_name || row.categoryName || "")
        );

        // Parse recurring fields
        const isRecurring = parseBooleanValue(row.is_recurring ?? row.isRecurring);
        const validFrequencies = ["weekly", "monthly", "quarterly", "bi-annual", "yearly"];
        const rawFrequency = (row.recurring_frequency || row.recurringFrequency || "").toLowerCase();
        const recurringFrequency = validFrequencies.includes(rawFrequency) ? rawFrequency : null;
        const recurringEndDate = row.recurring_end_date
          ? parseFlexibleDate(row.recurring_end_date)
          : row.recurringEndDate
          ? parseFlexibleDate(row.recurringEndDate)
          : null;

        const validStatuses = ["pending", "paid", "failed"];
        const rawStatus = (row.status || "").toString().toLowerCase();
        const status = validStatuses.includes(rawStatus) ? rawStatus : "paid";

        const incomeData = {
          amount: amount.toString(),
          date,
          clientId: client?.id ?? null,
          paymentSourceId: paymentSource?.id ?? null,
          categoryId: category?.id ?? null,
          description: normalizeText(row.description || ""),
          isRecurring: isRecurring || Boolean(recurringFrequency),
          recurringFrequency,
          recurringEndDate,
          status,
          invoiceId: normalizeText(row.invoice_id || row.invoiceId || "") || null,
          currency: (row.currency || "USD").toUpperCase().slice(0, 3),
          organizationId,
        };

        const created = await financeStorage.createIncome(incomeData);
        results.push(created);
      } catch (rowError: any) {
        console.error(`Error processing income row ${index + 1}:`, rowError);
        errors.push(`Row ${index + 1}: ${rowError.message}`);
      }
    }

    res.status(201).json({
      message: `Successfully imported ${results.length} of ${csvData.length} income records`,
      imported: results.length,
      total: csvData.length,
      errors,
      income: results,
    });
  } catch (error) {
    console.error("Error importing income:", error);
    res.status(500).json({ message: "Failed to import income" });
  }
});

// ── Expenses routes ───────────────────────────────────────────────────────────

router.get("/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const records = await financeStorage.getExpensesByOrg(organizationId);
    res.json(records);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

router.post("/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const {
      amount,
      description,
      date,
      personId,
      categoryId,
      isRecurring,
      recurringFrequency,
      recurringEndDate,
    } = req.body;

    if (!amount || !date) {
      return res.status(400).json({ message: "Amount and date are required" });
    }

    const newExpense = await financeStorage.createExpense({
      amount,
      description: description || null,
      date,
      personId: personId || null,
      categoryId: categoryId || null,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      recurringEndDate: recurringEndDate || null,
      organizationId,
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Failed to create expense" });
  }
});

router.put("/expenses/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);

    // Clean up empty date fields
    const cleanedData = { ...req.body };
    if (cleanedData.recurringEndDate === "") cleanedData.recurringEndDate = null;
    if (cleanedData.date === "") cleanedData.date = null;

    const validatedData = insertExpenseSchema.partial().parse(cleanedData);
    const updatedExpense = await financeStorage.updateExpense(id, organizationId, validatedData);
    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Failed to update expense" });
  }
});

router.delete("/expenses/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const deleted = await financeStorage.deleteExpense(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
});

// POST /expenses/import — bulk CSV import
router.post("/expenses/import", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ message: "Invalid CSV data" });
    }

    const orgPeople = await financeStorage.getPeopleByOrg(organizationId);
    const expenseCategories = await financeStorage.getCategoriesByOrg(organizationId, "expense");
    const validFrequencies = ["weekly", "monthly", "quarterly", "bi-annual", "yearly"];

    const results = [];
    const errors = [];

    for (const [index, row] of csvData.entries()) {
      try {
        const amount = sanitizePaymentAmount(row.amount || "0");
        const date = parseFlexibleDate(row.date);

        if (!date) {
          errors.push(`Row ${index + 1}: Invalid date format`);
          continue;
        }

        if (amount === null || amount <= 0) {
          errors.push(`Row ${index + 1}: Invalid amount`);
          continue;
        }

        // Find person by email
        let personId: string | null = null;
        if (row.person_email || row.employee_email) {
          const emailToFind = row.person_email || row.employee_email;
          const person = orgPeople.find(p =>
            p.email && normalizeText(p.email) === normalizeText(emailToFind)
          );
          if (!person) {
            errors.push(`Row ${index + 1}: Person not found with email: ${emailToFind}`);
            continue;
          }
          personId = person.id;
        }

        // Find category by name with optional parent
        let categoryId: string | null = null;
        if (row.category_name) {
          let category;
          if (row.category_parent) {
            const parentCategory = expenseCategories.find(c =>
              normalizeText(c.name) === normalizeText(row.category_parent) && !c.parentId
            );
            if (parentCategory) {
              category = expenseCategories.find(c =>
                normalizeText(c.name) === normalizeText(row.category_name) &&
                c.parentId === parentCategory.id
              );
            }
          } else {
            category = expenseCategories.find(c =>
              normalizeText(c.name) === normalizeText(row.category_name)
            );
          }

          if (!category) {
            const categoryDesc = row.category_parent
              ? `${row.category_parent} > ${row.category_name}`
              : row.category_name;
            errors.push(`Row ${index + 1}: Category not found: ${categoryDesc}`);
            continue;
          }
          categoryId = category.id;
        }

        // Parse recurring fields
        const isRecurring = parseBooleanValue(row.is_recurring);
        let recurringFrequency: string | null = null;
        let recurringEndDate: string | null = null;

        if (isRecurring) {
          if (row.recurring_frequency) {
            const frequency = row.recurring_frequency.toLowerCase().trim();
            if (!validFrequencies.includes(frequency)) {
              errors.push(
                `Row ${index + 1}: Invalid recurring frequency: ${row.recurring_frequency}. Must be one of: ${validFrequencies.join(", ")}`
              );
              continue;
            }
            recurringFrequency = frequency;
          }

          if (row.recurring_end_date) {
            recurringEndDate = parseFlexibleDate(row.recurring_end_date);
            if (!recurringEndDate) {
              errors.push(`Row ${index + 1}: Invalid recurring end date format`);
              continue;
            }
            const endDate = new Date(recurringEndDate);
            const today = new Date();
            if (endDate < today) {
              errors.push(
                `Row ${index + 1}: Warning - Recurring end date is in the past: ${recurringEndDate}`
              );
            }
          }
        }

        const expenseData = {
          amount: amount.toString(),
          description: normalizeText(row.description || ""),
          date,
          personId,
          categoryId,
          isRecurring,
          recurringFrequency,
          recurringEndDate,
          organizationId,
        };

        const created = await financeStorage.createExpense(expenseData);
        results.push(created);
      } catch (rowError: any) {
        console.error(`Error processing expense row ${index + 1}:`, rowError);
        errors.push(`Row ${index + 1}: ${rowError.message}`);
      }
    }

    res.status(201).json({
      message: `Successfully imported ${results.length} of ${csvData.length} expense records`,
      imported: results.length,
      total: csvData.length,
      errors,
      expenses: results,
    });
  } catch (error) {
    console.error("Error importing expenses:", error);
    res.status(500).json({ message: "Failed to import expenses" });
  }
});

// GET /people/:personId/expenses — expenses for a specific person
router.get("/people/:personId/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const { personId } = req.params;
    const organizationId = getOrgId(req);

    // Verify the person exists and belongs to this org
    const person = await financeStorage.getPersonById(personId, organizationId);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    const records = await financeStorage.getExpensesByPerson(personId, organizationId);
    res.json(records);
  } catch (error) {
    console.error("Error fetching person expenses:", error);
    res.status(500).json({ message: "Failed to fetch person expenses" });
  }
});

// ── Subscriptions routes ──────────────────────────────────────────────────────

router.get("/subscriptions", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const records = await financeStorage.getSubscriptionsByOrg(organizationId);
    res.json(records);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});

router.post("/subscriptions", async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = getOrgId(req);
    const validatedData = insertSubscriptionSchema.parse(req.body);
    const newSubscription = await financeStorage.createSubscription({
      ...validatedData,
      organizationId,
    });
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Failed to create subscription" });
  }
});

router.put("/subscriptions/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const validatedData = insertSubscriptionSchema.partial().parse(req.body);
    const updatedSubscription = await financeStorage.updateSubscription(id, organizationId, validatedData);
    if (!updatedSubscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json(updatedSubscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Failed to update subscription" });
  }
});

router.delete("/subscriptions/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrgId(req);
    const success = await financeStorage.deleteSubscription(id, organizationId);
    if (!success) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ message: "Failed to delete subscription" });
  }
});

export default router;
