import { db } from "../../db";
import { categories, paymentSources, organizations } from "@shared/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import type {
  Category,
  InsertCategory,
  PaymentSource,
  InsertPaymentSource,
  Organization,
} from "@shared/schema";

export const settingsStorage = {
  // ─── Categories ───────────────────────────────────────────────────────────

  async getCategories(organizationId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.organizationId, organizationId))
      .orderBy(desc(categories.createdAt));
  },

  async getCategory(id: string, organizationId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.organizationId, organizationId)));
    return category;
  },

  async createCategory(category: InsertCategory & { organizationId: string }): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category as any)
      .returning() as any as Category[];
    return newCategory;
  },

  async deleteCategory(id: string, organizationId: string): Promise<boolean> {
    // Verify ownership before deletion
    const category = await settingsStorage.getCategory(id, organizationId);
    if (!category) return false;

    // Recursively delete child categories
    const childCategories = await db
      .select()
      .from(categories)
      .where(and(eq(categories.parentId, id), eq(categories.organizationId, organizationId)));

    for (const child of childCategories) {
      await settingsStorage.deleteCategory(child.id, organizationId);
    }

    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // ─── Bulk import (CSV) ────────────────────────────────────────────────────

  async importCategories(
    organizationId: string,
    categoryData: Array<{ name?: string; type?: string; parent_name?: string }>
  ): Promise<{
    inserted: Category[];
    skipped: Array<{ row: number; name: string; type: string; reason: string }>;
    errors: string[];
  }> {
    const processedCategories: Array<{
      name: string;
      type: "income" | "expense";
      parentId: string | null;
      parentName?: string;
      organizationId: string;
    }> = [];
    const skipped: Array<{ row: number; name: string; type: string; reason: string }> = [];
    const errors: string[] = [];

    const existingCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.organizationId, organizationId));

    const existingCategoryMap = new Map<string, Category>();
    const existingCategoryNameMap = new Map<string, Category>();
    existingCategories.forEach((cat) => {
      existingCategoryMap.set(`${cat.name.toLowerCase()}_${cat.type}`, cat);
      existingCategoryNameMap.set(cat.name.toLowerCase(), cat);
    });

    const importingCategoryMap = new Map<string, boolean>();
    const importCategoryNameMap = new Map<string, { name?: string; type?: string; parent_name?: string }>();
    for (const row of categoryData) {
      if (row && row.name && row.type) {
        importCategoryNameMap.set(row.name.toLowerCase(), row);
      }
    }

    for (let i = 0; i < categoryData.length; i++) {
      const row = categoryData[i];

      if (!row || (!row.name && !row.type)) continue;

      const name = row.name?.toString().trim() ?? "";
      const type = row.type?.toString().toLowerCase().trim() ?? "";
      const parentName = row.parent_name?.toString().trim();

      if (!name) {
        errors.push(`Row ${i + 1}: Category name is required`);
        continue;
      }

      if (!type || !["income", "expense"].includes(type)) {
        errors.push(`Row ${i + 1}: Type must be either 'income' or 'expense'`);
        continue;
      }

      const categoryKey = `${name.toLowerCase()}_${type}`;

      if (existingCategoryMap.has(categoryKey)) {
        skipped.push({ row: i + 1, name, type, reason: "Already exists in database" });
        continue;
      }

      if (importingCategoryMap.has(categoryKey)) {
        skipped.push({ row: i + 1, name, type, reason: "Duplicate within import file" });
        continue;
      }

      importingCategoryMap.set(categoryKey, true);

      let parentId: string | null = null;
      if (parentName) {
        const existingParent = existingCategoryNameMap.get(parentName.toLowerCase());
        if (existingParent) {
          parentId = existingParent.id;
        } else {
          const importParent = importCategoryNameMap.get(parentName.toLowerCase());
          if (!importParent) {
            errors.push(`Row ${i + 1}: Parent category '${parentName}' not found`);
            continue;
          }
        }
      }

      processedCategories.push({
        name,
        type: type as "income" | "expense",
        parentId,
        parentName,
        organizationId,
      });
    }

    let insertedCategories: Category[] = [];

    if (processedCategories.length > 0) {
      // First pass: insert top-level (no parent)
      const topLevelCategories = processedCategories
        .filter((cat) => !cat.parentName)
        .map((cat) => ({
          name: cat.name,
          type: cat.type,
          parentId: cat.parentId,
          organizationId: cat.organizationId,
        }));

      let insertedTopLevel: Category[] = [];
      if (topLevelCategories.length > 0) {
        insertedTopLevel = await db
          .insert(categories)
          .values(topLevelCategories as any)
          .returning() as any as Category[];
      }

      // Second pass: insert children with resolved parent IDs
      const childCategories = processedCategories.filter((cat) => cat.parentName);
      const newCategoryNameMap = new Map<string, Category>();
      insertedTopLevel.forEach((cat) => {
        newCategoryNameMap.set(cat.name.toLowerCase(), cat);
      });

      const childCategoryData: Array<{
        name: string;
        type: "income" | "expense";
        parentId: string | null;
        organizationId: string;
      }> = [];

      for (const childCat of childCategories) {
        let parentId = childCat.parentId;

        if (!parentId && childCat.parentName) {
          const parent =
            newCategoryNameMap.get(childCat.parentName.toLowerCase()) ||
            existingCategoryNameMap.get(childCat.parentName.toLowerCase());

          if (parent) {
            parentId = parent.id;
          } else {
            errors.push(`Category '${childCat.name}': Parent '${childCat.parentName}' not found`);
            continue;
          }
        }

        childCategoryData.push({
          name: childCat.name,
          type: childCat.type,
          parentId,
          organizationId: childCat.organizationId,
        });
      }

      let insertedChildren: Category[] = [];
      if (childCategoryData.length > 0) {
        insertedChildren = await db
          .insert(categories)
          .values(childCategoryData as any)
          .returning() as any as Category[];
      }

      insertedCategories = [...insertedTopLevel, ...insertedChildren];
    }

    return { inserted: insertedCategories, skipped, errors };
  },

  // ─── Payment Sources ──────────────────────────────────────────────────────

  async getPaymentSources(organizationId: string): Promise<PaymentSource[]> {
    return await db
      .select()
      .from(paymentSources)
      .where(eq(paymentSources.organizationId, organizationId));
  },

  async createPaymentSource(
    data: InsertPaymentSource & { organizationId: string }
  ): Promise<PaymentSource> {
    const [newPaymentSource] = await db
      .insert(paymentSources)
      .values(data as any)
      .returning();
    return newPaymentSource;
  },

  async deletePaymentSource(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(paymentSources)
      .where(and(eq(paymentSources.id, id), eq(paymentSources.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // ─── Organization Settings ────────────────────────────────────────────────

  async getOrganization(organizationId: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));
    return org;
  },

  async updateOrganization(
    organizationId: string,
    data: Partial<{
      name: string;
      slug: string;
      country: string;
      currency: string;
      timezone: string;
      industry: string;
      taxId: string;
      address: string;
      phone: string;
      website: string;
      fiscalYearStart: string;
    }>
  ): Promise<Organization | undefined> {
    const [updated] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(organizations.id, organizationId))
      .returning();
    return updated;
  },
};
