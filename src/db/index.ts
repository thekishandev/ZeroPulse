import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Lazy DB initialisation.
 *
 * The Pool and Drizzle instance are created only on the first DB call, not at
 * module load time. This means the Next.js dev server starts successfully even
 * when DATABASE_URL is absent (e.g. MOCK_MODE=true local dev) and only throws
 * when a query is actually executed.
 */

type DbInstance = ReturnType<typeof drizzle>;

const g = globalThis as typeof globalThis & {
  __zpPool?: Pool;
  __zpDb?: DbInstance;
};

function getDb(): DbInstance {
  if (g.__zpDb) return g.__zpDb;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
        "Copy .env.example to .env.local and add your PostgreSQL connection string.\n" +
        "Local dev without a database: keep MOCK_MODE=true — the landing page and " +
        "topology graph work, but connecting a real project requires the DB.",
    );
  }

  const pool = g.__zpPool ?? new Pool({ connectionString: url });
  const db = drizzle(pool);

  if (process.env.NODE_ENV !== "production") {
    g.__zpPool = pool;
    g.__zpDb = db;
  }

  return db;
}

// Export a stable proxy — same API as a direct drizzle() instance but lazy.
export const db = new Proxy({} as DbInstance, {
  get(_target, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
