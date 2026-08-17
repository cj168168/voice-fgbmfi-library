import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const editions = sqliteTable("editions", {
  id: text("id").primaryKey(),
  editionNumber: text("edition_number").notNull(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  coverKey: text("cover_key").notNull(),
  pdfKey: text("pdf_key").notNull(),
  pdfSize: integer("pdf_size").notNull().default(0),
  status: text("status").notNull().default("published"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
