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
  __zpSchemaInitialized?: boolean;
};

function ensureSchema(pool: Pool) {
  if (g.__zpSchemaInitialized) return;
  g.__zpSchemaInitialized = true;
  pool
    .query(
      `
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      zerops_project_id TEXT NOT NULL,
      zerops_token TEXT NOT NULL DEFAULT '',
      name TEXT,
      scenario TEXT NOT NULL DEFAULT 'zeropulse',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      services_json JSONB NOT NULL,
      yaml_text TEXT,
      source TEXT NOT NULL DEFAULT 'demo',
      taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS advisor_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      suggestions_json JSONB NOT NULL,
      engine TEXT NOT NULL DEFAULT 'rules',
      score TEXT NOT NULL DEFAULT '0',
      summary TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS shares (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
    )
    .catch((err) => {
      console.error("[ZeroPulse DB] Schema auto-init warning:", err.message);
    });
}

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
  ensureSchema(pool);
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
