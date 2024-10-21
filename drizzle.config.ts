import { defineConfig } from "drizzle-kit";
import "dotenv/config";
export default defineConfig({
  out: "./drizzle",
  schema: "./src/app/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
