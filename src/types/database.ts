import { DrizzleD1Database } from "drizzle-orm/d1";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { MySql2Database } from "drizzle-orm/mysql2";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type SqliteDB = DrizzleD1Database | LibSQLDatabase;
export type PgDB = PostgresJsDatabase;
export type MysqlDB = MySql2Database;
