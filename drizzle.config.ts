import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/lib/database/d1/schema.ts",
    out: "./src/lib/database/d1/migrations",
    dialect: "sqlite"
});
