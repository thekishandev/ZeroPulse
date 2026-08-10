import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import type { ZeropsService, Suggestion } from "@/lib/types";

/**
 * ZeroPulse data model.
 *
 * A connected Zerops "project" stores the user's read-only token + a demo
 * scenario. Every time we read its services we persist a `snapshot`, the AI
 * advisor stores a `report`, and a user can mint a public read-only `share`.
 */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  zeropsProjectId: text("zerops_project_id").notNull(),
  // Read-only token. In production this would be encrypted at rest.
  zeropsToken: text("zerops_token").notNull().default(""),
  name: text("name"),
  // Which representative dataset powers demo mode for this project.
  scenario: text("scenario").notNull().default("zeropulse"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const snapshots = pgTable(
  "snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    servicesJson: jsonb("services_json").$type<ZeropsService[]>().notNull(),
    yamlText: text("yaml_text"),
    source: text("source").notNull().default("demo"),
    takenAt: timestamp("taken_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("idx_snapshots_project").on(t.projectId)],
);

export const advisorReports = pgTable(
  "advisor_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    suggestionsJson: jsonb("suggestions_json").$type<Suggestion[]>().notNull(),
    engine: text("engine").notNull().default("rules"),
    score: text("score").notNull().default("0"),
    summary: text("summary").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("idx_advisor_project").on(t.projectId)],
);

export const shares = pgTable("shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
