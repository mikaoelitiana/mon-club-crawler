import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  driver: "better-sqlite",
  out: "migrations",
  dbCredentials: {
    url: "./sqlite.db",
  },
} satisfies Config;
