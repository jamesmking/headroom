import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: "./drizzle",
  schema: "./src/app/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:admin@localhost:5432/headroom",
  },
});
