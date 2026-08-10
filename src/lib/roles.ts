import type { ZeropsService } from "./types";

/** Architectural role inferred from a service's type/name/visibility. */
export type Role =
  | "edge"
  | "app"
  | "database"
  | "cache"
  | "storage"
  | "worker"
  | "service";

export function roleOf(s: ZeropsService): Role {
  const t = (s.type || "").toLowerCase();
  const n = (s.name || "").toLowerCase();

  if (
    /postgres|mysql|mongo|mariadb|database|elasticsearch|opensearch|clickhouse|singlestore/.test(
      t,
    ) ||
    /\b(db|database)\b/.test(n)
  ) {
    return "database";
  }
  if (/valkey|redis|keydb|memcache|dragonfly/.test(t) || /cache|redis/.test(n)) {
    return "cache";
  }
  if (/object.?storage|s3|minio|bucket/.test(t) || /storage|bucket/.test(n)) {
    return "storage";
  }
  if (
    /worker|cron|queue|bull|celery|scheduler|sidekiq/.test(t) ||
    /worker|cron|queue|job/.test(n)
  ) {
    return "worker";
  }
  if (
    s.isPublic &&
    (/front|web|ui|next|nuxt|client|static|hugo|astro|remix/.test(n) ||
      /front/.test(t))
  ) {
    return "edge";
  }
  if (s.isPublic) return "app";
  return "service";
}

export const ROLE_META: Record<
  Role,
  { label: string; emoji: string; accent: string }
> = {
  edge: { label: "Frontend", emoji: "🌐", accent: "#4f8cff" },
  app: { label: "Application", emoji: "🛰️", accent: "#4f8cff" },
  database: { label: "Database", emoji: "🗄️", accent: "#22d39a" },
  cache: { label: "Cache", emoji: "⚡", accent: "#f5b544" },
  storage: { label: "Storage", emoji: "📦", accent: "#9d5cff" },
  worker: { label: "Worker", emoji: "🔁", accent: "#9d5cff" },
  service: { label: "Service", emoji: "⚙️", accent: "#8b93b8" },
};

export interface TopologyEdge {
  source: string;
  target: string;
  kind: "public" | "private";
}

/**
 * Build a sensible wiring graph from arbitrary services.
 * Public edge → app → data layer; workers talk back to the data layer.
 */
export function buildEdges(services: ZeropsService[]): TopologyEdge[] {
  const edges: TopologyEdge[] = [];
  const seen = new Set<string>();
  const add = (source: string, target: string, kind: "public" | "private") => {
    const key = `${source}->${target}`;
    if (source === target || seen.has(key)) return;
    seen.add(key);
    edges.push({ source, target, kind });
  };

  const byRole = (r: Role) => services.filter((s) => roleOf(s) === r);
  const edges_ = byRole("edge");
  const apps = byRole("app");
  const dbs = byRole("database");
  const caches = byRole("cache");
  const storage = byRole("storage");
  const workers = byRole("worker");

  // edge -> app (public traffic)
  for (const e of edges_) {
    for (const a of apps) add(e.id, a.id, "public");
  }

  // The thing that reads/writes the private layer is the app, else the edge.
  const writers = apps.length ? apps : edges_;

  for (const db of dbs) {
    const w = writers[0];
    if (w) add(w.id, db.id, "private");
  }
  for (const c of caches) {
    const w = writers[0];
    if (w) add(w.id, c.id, "private");
  }
  for (const st of storage) {
    const w = writers[0];
    if (w) add(w.id, st.id, "private");
  }
  for (const wk of workers) {
    const sink = dbs[0] || caches[0] || writers[0];
    if (sink) add(wk.id, sink.id, "private");
  }

  // Fallback: if nothing was wired, connect first public → first private.
  if (edges.length === 0) {
    const pub = services.find((s) => s.isPublic);
    const priv = services.find((s) => !s.isPublic);
    if (pub && priv) add(pub.id, priv.id, "private");
  }

  return edges;
}
