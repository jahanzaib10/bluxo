import { db } from "../../db";
import { personDocuments } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const documentsStorage = {
  async getDocumentsByPerson(personId: string, organizationId: string) {
    return db
      .select()
      .from(personDocuments)
      .where(
        and(
          eq(personDocuments.personId, personId),
          eq(personDocuments.organizationId, organizationId)
        )
      )
      .orderBy(desc(personDocuments.createdAt));
  },

  async createDocument(data: any, organizationId: string) {
    const [doc] = await db
      .insert(personDocuments)
      .values({ ...data, organizationId })
      .returning();
    return doc;
  },

  async deleteDocument(id: string, organizationId: string) {
    const result = await db
      .delete(personDocuments)
      .where(
        and(
          eq(personDocuments.id, id),
          eq(personDocuments.organizationId, organizationId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  },
};
