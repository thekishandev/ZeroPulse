import type { ZeropsService } from "./types";

export type ScenarioId = "zeropulse" | "risky" | "lean";

export interface Scenario {
  id: ScenarioId;
  name: string;
  tagline: string;
  /** Quick human note on what the advisor will flag. */
  highlight: string;
  services: ZeropsService[];
}

/**
 * Representative datasets used in demo mode. These mirror real Zerops
 * architectures (the same shape a live API call normalizes to) so the graph,
 * caching and advisor all behave identically whether the data is live or demo.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "zeropulse",
    name: "ZeroPulse (this app)",
    tagline: "A healthy 6-service stack wired the way ZeroPulse recommends.",
    highlight: "Everything private, cache present, httpSupport everywhere.",
    services: [
      {
        id: "zp-frontend",
        name: "frontend",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 3000, httpSupport: true }],
        instances: 2,
        memoryMb: 512,
        cpu: "0.5 vCPU",
      },
      {
        id: "zp-api",
        name: "api",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 3001, httpSupport: true }],
        instances: 2,
        memoryMb: 1024,
        cpu: "1 vCPU",
      },
      {
        id: "zp-db",
        name: "db",
        type: "postgresql@16",
        status: "RUNNING",
        isPublic: false,
        ports: [],
        instances: 1,
        memoryMb: 2048,
        cpu: "1 vCPU",
      },
      {
        id: "zp-cache",
        name: "cache",
        type: "valkey@7",
        status: "RUNNING",
        isPublic: false,
        ports: [],
        instances: 1,
        memoryMb: 512,
        cpu: "0.5 vCPU",
      },
      {
        id: "zp-worker",
        name: "worker",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: false,
        ports: [],
        instances: 1,
        memoryMb: 512,
        cpu: "0.5 vCPU",
      },
      {
        id: "zp-storage",
        name: "storage",
        type: "object-storage",
        status: "RUNNING",
        isPublic: false,
        ports: [],
        instances: 1,
        memoryMb: 0,
        cpu: "—",
      },
    ],
  },
  {
    id: "risky",
    name: "Risky starter",
    tagline: "A misconfigured project the advisor will tear apart.",
    highlight: "Exposed database, exposed cron, missing httpSupport, no cache, a failed worker.",
    services: [
      {
        id: "rk-web",
        name: "web",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 3000, httpSupport: true }],
        instances: 1,
        memoryMb: 512,
        cpu: "0.5 vCPU",
      },
      {
        id: "rk-api",
        name: "api",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 3001, httpSupport: false }],
        instances: 1,
        memoryMb: 768,
        cpu: "0.5 vCPU",
      },
      {
        id: "rk-database",
        name: "database",
        type: "postgresql@16",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 5432, httpSupport: false }],
        instances: 1,
        memoryMb: 2048,
        cpu: "1 vCPU",
      },
      {
        id: "rk-cron",
        name: "cron",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 4000, httpSupport: false }],
        instances: 1,
        memoryMb: 256,
        cpu: "0.25 vCPU",
      },
      {
        id: "rk-queue",
        name: "queue-worker",
        type: "nodejs@22",
        status: "FAILED",
        isPublic: false,
        ports: [],
        instances: 1,
        memoryMb: 256,
        cpu: "0.25 vCPU",
      },
    ],
  },
  {
    id: "lean",
    name: "Lean MVP",
    tagline: "A minimal but correctly wired frontend + api + database.",
    highlight: "Three services, all private where they should be. Clean bill of health.",
    services: [
      {
        id: "ln-web",
        name: "frontend",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 3000, httpSupport: true }],
        instances: 1,
        memoryMb: 512,
        cpu: "0.5 vCPU",
      },
      {
        id: "ln-api",
        name: "api",
        type: "nodejs@22",
        status: "RUNNING",
        isPublic: true,
        ports: [{ port: 3001, httpSupport: true }],
        instances: 1,
        memoryMb: 768,
        cpu: "0.5 vCPU",
      },
      {
        id: "ln-db",
        name: "database",
        type: "postgresql@16",
        status: "RUNNING",
        isPublic: false,
        ports: [],
        instances: 1,
        memoryMb: 1536,
        cpu: "1 vCPU",
      },
    ],
  },
];

export function scenarioById(id: string): Scenario {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}
