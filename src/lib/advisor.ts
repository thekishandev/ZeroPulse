import { roleOf } from "./roles";
import type { AdvisorResult, Suggestion, SuggestionSeverity, ZeropsService } from "./types";

/**
 * Architecture advisor.
 *
 * Two engines:
 *  - rule-based: deterministic, always available, audits the same checklist a
 *    reviewer would. This is the default and guarantees a reliable demo.
 *  - openai: used automatically when OPENAI_API_KEY is configured, sending the
 *    service model + generated zerops.yaml to gpt-4o-mini for a richer pass.
 *
 * Whichever engine runs, output is normalized to { suggestions, summary, score }.
 */

export async function getAdvisorSuggestions(
  services: ZeropsService[],
  yamlText?: string,
): Promise<AdvisorResult> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await openaiAdvisor(services, yamlText);
    } catch (err) {
      console.error("[advisor] openai failed, falling back to rules:", err);
    }
  }
  return ruleBasedAdvisor(services, yamlText);
}

export function ruleBasedAdvisor(
  services: ZeropsService[],
  _yamlText?: string,
): AdvisorResult {
  const suggestions: Suggestion[] = [];

  const databases = services.filter((s) => roleOf(s) === "database");
  const caches = services.filter((s) => roleOf(s) === "cache");
  const storage = services.filter((s) => roleOf(s) === "storage");
  const workers = services.filter((s) => roleOf(s) === "worker");
  const publicServices = services.filter((s) => s.isPublic);

  const push = (
    severity: SuggestionSeverity,
    service: string | null,
    title: string,
    message: string,
    rule: string,
  ) => suggestions.push({ severity, service, title, message, rule });

  // --- Errors: data/private layer exposed to the public internet ---
  for (const s of [...databases, ...caches, ...storage, ...workers]) {
    if (s.isPublic) {
      push(
        "error",
        s.name,
        `${labelOf(s)} is publicly exposed`,
        `\`${s.name}\` is reachable from the public internet. ${
          roleOf(s) === "database" ? "Databases" : roleOf(s) === "cache" ? "Caches" : roleOf(s) === "storage" ? "Object storage" : "Workers"
        } should live behind Zerops's private network — set it private and let your api reach it over the internal address.`,
        `exposed-${roleOf(s)}`,
      );
    }
  }

  // --- Warnings ---
  for (const s of publicServices) {
    const hasHttp = s.ports.some((p) => p.httpSupport);
    if (!hasHttp) {
      push(
        "warn",
        s.name,
        `${s.name} is public without httpSupport`,
        `\`${s.name}\` is marked public but no port has \`httpSupport: true\`, so Zerops won't route HTTP traffic to it. Add httpSupport to the exposed port.`,
        "missing-httpsupport",
      );
    }
  }

  for (const s of services) {
    if (s.status !== "RUNNING") {
      push(
        "warn",
        s.name,
        `${s.name} is ${s.status.toLowerCase()}`,
        `\`${s.name}\` reported status \`${s.status}\`. Traffic routed here will fail until it returns to RUNNING.`,
        "unhealthy-service",
      );
    }
  }

  if (databases.length === 0 && services.length >= 2) {
    push(
      "warn",
      null,
      "No database detected",
      "There's no managed database in this project. If anything needs to persist, add a PostgreSQL or MongoDB service over the private network.",
      "missing-database",
    );
  }

  if (caches.length === 0 && services.length >= 4) {
    push(
      "warn",
      null,
      "No cache layer",
      "With four or more services, a Valkey/KeyDB cache usually pays off — offload reads and rate-limit-friendly caching from your api and database.",
      "missing-cache",
    );
  }

  if (publicServices.length === 0 && services.length > 0) {
    push(
      "warn",
      null,
      "Nothing is publicly exposed",
      "No service is marked public, so there's no entry point for external traffic. Expose your frontend or api with httpSupport to receive requests.",
      "no-public-entry",
    );
  }

  // --- Praise: what's correctly wired ---
  const privateDbs = databases.filter((s) => !s.isPublic);
  if (databases.length && privateDbs.length === databases.length) {
    push(
      "ok",
      privateDbs[0]?.name ?? null,
      "Database correctly private",
      "Your database(s) are reachable only over Zerops's private network — exactly right.",
      "db-private-ok",
    );
  }
  if (caches.length && caches.every((s) => !s.isPublic)) {
    push(
      "ok",
      caches[0].name,
      "Cache wired privately",
      `${caches[0].name} is private — ideal for session and response caching.`,
      "cache-private-ok",
    );
  }
  if (publicServices.length && publicServices.every((s) => s.ports.some((p) => p.httpSupport))) {
    push(
      "ok",
      null,
      "Public services correctly exposed",
      "Every public service has httpSupport enabled, so HTTP traffic routes cleanly.",
      "public-ok",
    );
  }

  // Guarantee at least one positive note so the panel never feels empty.
  if (!suggestions.some((s) => s.severity === "ok")) {
    push(
      "ok",
      null,
      "Topology parsed",
      `Mapped ${services.length} service${services.length === 1 ? "" : "s"} into a public/private topology.`,
      "parsed-ok",
    );
  }

  const ordered = order(suggestions).slice(0, 9);
  const score = scoreFrom(suggestions, services.length);

  return {
    suggestions: ordered,
    engine: "rules",
    score,
    summary: summarize(ordered, score),
  };
}

async function openaiAdvisor(
  services: ZeropsService[],
  yamlText?: string,
): Promise<AdvisorResult> {
  const system = `You are a Zerops infrastructure reviewer. Given a list of services
(name, type, status, isPublic, ports) and optionally a raw zerops.yaml, review the
architecture and return ONLY valid JSON of this exact shape:

{"suggestions":[{"severity":"error|warn|ok","service":"<name or null>","title":"<short>","message":"<plain English>","rule":"<kebab-case-id>"}]}

Check for: databases/caches/storage/workers exposed publicly (error), public services
missing httpSupport (warn), unhealthy statuses (warn), missing persistence or cache
layers (warn), and at least one ok praising correct wiring. Max 8 suggestions.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({ services, yaml: yamlText || null }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '{"suggestions":[]}';
  const parsed = JSON.parse(raw) as { suggestions?: Suggestion[] };
  const cleaned = (parsed.suggestions || [])
    .filter((s) => s && typeof s.message === "string")
    .map((s) => ({
      severity: (["error", "warn", "ok"].includes(s.severity)
        ? s.severity
        : "warn") as SuggestionSeverity,
      service: s.service ?? null,
      title: s.title || (s.service ? s.service : "Note"),
      message: s.message,
      rule: s.rule || "ai",
    }));

  const finalSuggestions = cleaned.length
    ? order(cleaned).slice(0, 9)
    : ruleBasedAdvisor(services, yamlText).suggestions;

  const score = scoreFrom(finalSuggestions, services.length);
  return {
    suggestions: finalSuggestions,
    engine: "openai",
    score,
    summary: summarize(finalSuggestions, score),
  };
}

function labelOf(s: ZeropsService) {
  return s.name.charAt(0).toUpperCase() + s.name.slice(1);
}

function order(items: Suggestion[]): Suggestion[] {
  const rank = { error: 0, warn: 1, ok: 2 } as const;
  return [...items].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function scoreFrom(items: Suggestion[], total: number): number {
  if (total === 0) return 100;
  const errors = items.filter((s) => s.severity === "error").length;
  const warns = items.filter((s) => s.severity === "warn").length;
  let score = 100 - errors * 28 - warns * 9;
  return Math.max(12, Math.min(100, score));
}

function summarize(items: Suggestion[], score: number): string {
  const errors = items.filter((s) => s.severity === "error").length;
  const warns = items.filter((s) => s.severity === "warn").length;
  if (errors > 0)
    return `${errors} critical issue${errors === 1 ? "" : "s"}${
      warns ? ` and ${warns} warning${warns === 1 ? "" : "s"}` : ""
    } found. Health score ${score}/100.`;
  if (warns > 0)
    return `No critical issues, ${warns} improvement${warns === 1 ? "" : "s"} suggested. Health score ${score}/100.`;
  return `Clean bill of health. Everything is wired correctly. Score ${score}/100.`;
}
