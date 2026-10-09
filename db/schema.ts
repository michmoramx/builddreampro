import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
export const records = sqliteTable("records", {
 id: text("id").primaryKey(), kind: text("kind").notNull(), demo: integer("demo").notNull().default(0),
 data: text("data").notNull(), version: integer("version").notNull().default(1),
 createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, t => [index("idx_records_demo_kind").on(t.demo, t.kind)]);
export const audit = sqliteTable("audit", {
 id: text("id").primaryKey(), demo: integer("demo").notNull().default(0), action: text("action").notNull(),
 actor: text("actor").notNull(), ref: text("ref").notNull().default(""), createdAt: text("created_at").notNull(),
}, t => [index("idx_audit_demo_created").on(t.demo, t.createdAt)]);
export const credentials = sqliteTable("credentials", {
 provider: text("provider").primaryKey(), encrypted: text("encrypted").notNull(),
 checkedAt: text("checked_at"), status: text("status").notNull().default("unverified"),
});
