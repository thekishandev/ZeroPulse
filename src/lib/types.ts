export type ServiceStatus =
  | "RUNNING"
  | "FAILED"
  | "BUILDING"
  | "STOPPED"
  | "DEPLOYING";

export interface ServicePort {
  port: number;
  httpSupport?: boolean;
}

/** A single Zerops service, normalized to our internal shape. */
export interface ZeropsService {
  id: string;
  name: string;
  type: string;
  status: ServiceStatus;
  isPublic: boolean;
  ports: ServicePort[];
  instances?: number;
  memoryMb?: number;
  cpu?: string;
}

export type SuggestionSeverity = "error" | "warn" | "ok";

export interface Suggestion {
  severity: SuggestionSeverity;
  /** The service this suggestion is about, or null for a project-wide note. */
  service: string | null;
  title: string;
  message: string;
  /** A short machine-readable rule id, e.g. "exposed-database". */
  rule?: string;
}

export interface AdvisorResult {
  suggestions: Suggestion[];
  engine: "openai" | "rules";
  summary: string;
  /** Health score 0-100. */
  score: number;
}

/** How the service list was obtained, surfaced honestly in the UI. */
export type DataSource = "live" | "cache" | "demo" | "demo-fallback";
