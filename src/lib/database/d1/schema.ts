import { timestamp_ms } from "@/lib/utils/sqlite";
import { integer, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";

// Add a prefix here to namespace all tables, e.g. `app_${name}`
const sqliteTable = sqliteTableCreator((name) => `${name}`);

export const basic_auth_credentials = sqliteTable("basic_auth_credentials", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	user: text().notNull().unique(),
	password: text().notNull(),
	created_at: timestamp_ms(),
	updated_at: timestamp_ms(() => new Date()),
});
