import { getCached, setCached, invalidate, cacheAgeSeconds } from "./cache";
import { scenarioById } from "./mockData";
import { roleOf } from "./roles";
import type { DataSource, ZeropsService } from "./types";

/**
 * Zerops API client with an honest safety net.
 *
 * `MOCK_MODE` defaults to ON. When it's on (or no token is present) we serve a
 * representative dataset instead of hitting the live Zerops REST API — the graph,
 * cache and advisor all work identically, and the UI always tells you which
 * source the data came from. Flip MOCK_MODE=false and supply a read-only token
 * to use the real integration.
 */

const MOCK_MODE = process.env.MOCK_MODE !== "false";
const ZEROPS_API_BASE =
  process.env.ZEROPS_API_BASE || "https://api.app-prg1.zerops.io";

export function isMockMode() {
  return MOCK_MODE;
}

export interface FetchResult {
  services: ZeropsService[];
  source: DataSource;
  fromCache: boolean;
  cacheAgeSeconds: number | null;
}

export async function fetchProjectServices(
  token: string,
  projectId: string,
  scenario: string,
  opts: { force?: boolean } = {},
): Promise<FetchResult> {
  const cacheKey = `services:${projectId}`;

  if (!opts.force) {
    const cached = getCached<ZeropsService[]>(cacheKey);
    if (cached) {
      return {
        services: cached,
        source: "cache",
        fromCache: true,
        cacheAgeSeconds: cacheAgeSeconds(cacheKey),
      };
    }
  }

  // Demo mode — no live token or MOCK_MODE on.
  if (MOCK_MODE || !token) {
    const services = cloneServices(scenarioById(scenario).services);
    setCached(cacheKey, services);
    return { services, source: "demo", fromCache: false, cacheAgeSeconds: null };
  }

  // --- Real Zerops API call ---
  try {
    const res = await fetch(
      `${ZEROPS_API_BASE}/api/rest/public/project/${projectId}/service-stack`,
      {
        headers: { Authorization: `Bearer ${token}` },
        // Never cache at the framework layer — we manage caching ourselves.
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(`Zerops API responded ${res.status}`);
    }

    const data = await res.json();
    const services = normalizeZeropsResponse(data);
    setCached(cacheKey, services);
    return { services, source: "live", fromCache: false, cacheAgeSeconds: null };
  } catch (err) {
    // Honest fallback: keep the product working on stage, but flag the source.
    console.error("[zerops] live call failed, falling back to demo:", err);
    const services = cloneServices(scenarioById(scenario).services);
    setCached(cacheKey, services);
    return {
      services,
      source: "demo-fallback",
      fromCache: false,
      cacheAgeSeconds: null,
    };
  }
}

export function invalidateProject(projectId: string) {
  invalidate(`services:${projectId}`);
}

function cloneServices(services: ZeropsService[]): ZeropsService[] {
  return JSON.parse(JSON.stringify(services));
}

/**
 * Map the real Zerops response shape onto our internal model.
 * Field names here are best-effort against docs.zerops.io and should be tightened
 * once you confirm the live payload — the rest of the app is source-agnostic.
 */
type RawService = Record<string, unknown>;

function asArr(v: unknown): RawService[] {
  return Array.isArray(v) ? (v as RawService[]) : [];
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeZeropsResponse(raw: unknown): ZeropsService[] {
  let list: RawService[] = [];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    list = asArr(obj.items ?? obj.data ?? obj.services);
  } else if (Array.isArray(raw)) {
    list = raw as RawService[];
  }

  return list.map((s, i): ZeropsService => {
    const type = str(s.serviceStackTypeVersionName ?? s.type ?? s.runtime) || "service";
    const portsRaw = asArr(s.ports ?? s.publicPorts);
    return {
      id: str(s.id ?? s.serviceId) || `${type}-${i}`,
      name: str(s.name ?? s.serviceName ?? s.hostname) || `${type}-${i}`,
      type,
      status: normalizeStatus(str(s.status ?? s.state) || "RUNNING"),
      isPublic: Boolean(s.isPublic ?? s.publicAccess ?? s.hasPublicIp ?? false),
      ports: portsRaw.map((p) => {
        const rec = p as Record<string, unknown>;
        const port =
          typeof p === "number" ? p : Number(rec.port ?? p);
        const http = Boolean(rec.httpSupport ?? rec.http);
        return { port: Number.isFinite(port) ? port : 0, httpSupport: http };
      }),
      instances:
        typeof s.instances === "number"
          ? s.instances
          : typeof s.replicas === "number"
            ? s.replicas
            : undefined,
      memoryMb:
        typeof s.memoryMb === "number"
          ? s.memoryMb
          : typeof s.ram === "number"
            ? s.ram
            : undefined,
      cpu: typeof s.cpu === "string" ? s.cpu : undefined,
    };
  });
}

function normalizeStatus(s: string): ZeropsService["status"] {
  const up = s.toUpperCase();
  if (up.startsWith("RUN")) return "RUNNING";
  if (up.startsWith("FAIL") || up.includes("ERROR")) return "FAILED";
  if (up.startsWith("BUILD")) return "BUILDING";
  if (up.startsWith("DEPLOY")) return "DEPLOYING";
  if (up.startsWith("STOP")) return "STOPPED";
  return "RUNNING";
}

/**
 * Generate a representative zerops.yaml from the live service model — used by
 * the AI advisor and the on-page YAML preview.
 */
export function generateZeropsYaml(services: ZeropsService[]): string {
  const lines: string[] = ["zerops:"];
  for (const s of services) {
    const role = roleOf(s);
    const setup = role === "service" ? s.name : s.name;
    lines.push(`  - setup: ${setup}`);
    lines.push(`    build:`);
    lines.push(`      base: ${s.type}`);
    lines.push(`      buildCommands:`);
    lines.push(`        - npm install`);
    lines.push(`        - npm run build`);
    lines.push(`      deployFiles: ./${s.name}`);
    lines.push(`    run:`);
    lines.push(`      base: ${s.type}`);
    if (s.isPublic && s.ports.length) {
      lines.push(`      ports:`);
      for (const p of s.ports) {
        lines.push(
          `        - port: ${p.port}${p.httpSupport ? "\n          httpSupport: true" : ""}`,
        );
      }
    }
    lines.push(`      start: npm run start${role === "worker" ? " -- worker" : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}
