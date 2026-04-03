import { db } from "../../db";
import { clients, clientPermissions } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  Client,
  InsertClient,
  ClientPermissions,
  InsertClientPermissions,
} from "@shared/schema";

export const clientsStorage = {
  // ── Clients ──────────────────────────────────────────────────────────────

  async getClients(organizationId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .orderBy(desc(clients.createdAt));
  },

  async getClient(id: string, organizationId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)));
    return client;
  },

  async getClientByEmail(email: string, organizationId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.email, email), eq(clients.organizationId, organizationId)));
    return client;
  },

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  },

  async updateClient(
    id: string,
    organizationId: string,
    data: Partial<InsertClient>
  ): Promise<Client | undefined> {
    const [updated] = await db
      .update(clients)
      .set(data)
      .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
      .returning();
    return updated;
  },

  async deleteClient(id: string, organizationId: string): Promise<boolean> {
    // Delete related permissions first
    await db
      .delete(clientPermissions)
      .where(
        and(
          eq(clientPermissions.clientId, id),
          eq(clientPermissions.organizationId, organizationId)
        )
      );

    // Then delete the client (scoped to org)
    const result = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },

  // ── Client Permissions ────────────────────────────────────────────────────

  async getClientPermissions(
    clientId: string,
    organizationId: string
  ): Promise<ClientPermissions | undefined> {
    const [permissions] = await db
      .select()
      .from(clientPermissions)
      .where(
        and(
          eq(clientPermissions.clientId, clientId),
          eq(clientPermissions.organizationId, organizationId)
        )
      );
    return permissions;
  },

  async upsertClientPermissions(
    permissions: InsertClientPermissions
  ): Promise<ClientPermissions> {
    const existing = await clientsStorage.getClientPermissions(
      permissions.clientId!,
      permissions.organizationId!
    );

    if (existing) {
      const [result] = await db
        .update(clientPermissions)
        .set({
          showIncomeGraph: permissions.showIncomeGraph,
          showCategoryBreakdown: permissions.showCategoryBreakdown,
          showPaymentHistory: permissions.showPaymentHistory,
          showInvoices: permissions.showInvoices,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(clientPermissions.clientId, permissions.clientId!),
            eq(clientPermissions.organizationId, permissions.organizationId!)
          )
        )
        .returning();
      return result;
    } else {
      const [result] = await db
        .insert(clientPermissions)
        .values(permissions)
        .returning();
      return result;
    }
  },

  // ── Bulk Import ───────────────────────────────────────────────────────────

  async bulkImportClients(
    clientData: Array<Record<string, unknown>>,
    organizationId: string
  ): Promise<{ imported: Client[]; errors: string[] }> {
    const imported: Client[] = [];
    const errors: string[] = [];

    for (let i = 0; i < clientData.length; i++) {
      const rawRow = clientData[i];
      const name = (rawRow.name as string | undefined)?.toString().trim();

      if (!name) {
        errors.push(`Row ${i + 1}: Missing required field 'name'`);
        continue;
      }

      const email = (rawRow.email as string | undefined)?.toString().trim() || "";

      // Check for duplicate by email within this org
      if (email) {
        const existing = await clientsStorage.getClientByEmail(email, organizationId);
        if (existing && existing.name.toLowerCase() === name.toLowerCase()) {
          errors.push(
            `Row ${i + 1}: Client '${name}' with email '${email}' already exists`
          );
          continue;
        }
      }

      try {
        const clientRecord: InsertClient = {
          name,
          email: email || "",
          phone: (rawRow.phone as string | undefined)?.toString().trim() || "",
          website: (rawRow.website as string | undefined)?.toString().trim() || "",
          address: (rawRow.address as string | undefined)?.toString().trim() || "",
          industry: (rawRow.industry as string | undefined)?.toString().trim() || "",
          contactName: (rawRow.contactName as string | undefined)?.toString().trim() || "",
          contactEmail: (rawRow.contactEmail as string | undefined)?.toString().trim() || "",
          organizationId,
        };

        const newClient = await clientsStorage.createClient(clientRecord);
        imported.push(newClient);

        // Create default permissions for imported client
        await clientsStorage.upsertClientPermissions({
          clientId: newClient.id,
          showIncomeGraph: true,
          showCategoryBreakdown: true,
          showPaymentHistory: true,
          showInvoices: false,
          organizationId,
        });
      } catch (insertError) {
        console.error(`Error inserting client '${name}':`, insertError);
        errors.push(
          `Row ${i + 1}: Failed to create client '${name}' — ${
            insertError instanceof Error ? insertError.message : "Unknown error"
          }`
        );
      }
    }

    return { imported, errors };
  },
};
