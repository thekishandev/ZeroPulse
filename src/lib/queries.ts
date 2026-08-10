import { db } from "@/db";
import { advisorReports, projects, shares, snapshots } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { AdvisorResult, Suggestion, ZeropsService } from "./types";

export type ProjectRow = {
  id: string;
  zeropsProjectId: string;
  zeropsToken: string;
  name: string | null;
  scenario: string;
  createdAt: Date;
};

export async function getProject(id: string): Promise<ProjectRow | null> {
  const [row] = await db
    .select({
      id: projects.id,
      zeropsProjectId: projects.zeropsProjectId,
      zeropsToken: projects.zeropsToken,
      name: projects.name,
      scenario: projects.scenario,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return row ? (row as ProjectRow) : null;
}

export async function listProjects() {
  return db
    .select({
      id: projects.id,
      zeropsProjectId: projects.zeropsProjectId,
      name: projects.name,
      scenario: projects.scenario,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .orderBy(desc(projects.createdAt));
}

export async function createProject(input: {
  zeropsProjectId: string;
  zeropsToken: string;
  name: string;
  scenario: string;
}) {
  const [created] = await db
    .insert(projects)
    .values({
      zeropsProjectId: input.zeropsProjectId,
      zeropsToken: input.zeropsToken,
      name: input.name,
      scenario: input.scenario,
    })
    .returning({ id: projects.id });
  return created;
}

export async function insertSnapshot(
  projectId: string,
  services: ZeropsService[],
  yamlText: string | null,
  source: string,
) {
  await db.insert(snapshots).values({
    projectId,
    servicesJson: services,
    yamlText,
    source,
  });
}

export async function getLatestSnapshot(projectId: string) {
  const [row] = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.projectId, projectId))
    .orderBy(desc(snapshots.takenAt))
    .limit(1);
  return row ?? null;
}

export async function insertAdvisorReport(
  projectId: string,
  result: AdvisorResult,
) {
  await db.insert(advisorReports).values({
    projectId,
    suggestionsJson: result.suggestions as Suggestion[],
    engine: result.engine,
    score: String(result.score),
    summary: result.summary,
  });
}

export async function getLatestAdvisorReport(projectId: string) {
  const [row] = await db
    .select()
    .from(advisorReports)
    .where(eq(advisorReports.projectId, projectId))
    .orderBy(desc(advisorReports.createdAt))
    .limit(1);
  return row ?? null;
}

export async function createShare(projectId: string) {
  const [created] = await db
    .insert(shares)
    .values({ projectId })
    .returning({ id: shares.id });
  return created;
}

export async function getShareBundle(shareId: string) {
  const [share] = await db
    .select()
    .from(shares)
    .where(eq(shares.id, shareId))
    .limit(1);
  if (!share) return null;

  const project = await getProject(share.projectId);
  const snapshot = await getLatestSnapshot(share.projectId);
  const report = await getLatestAdvisorReport(share.projectId);

  return {
    shareId: share.id,
    projectId: share.projectId,
    name: project?.name ?? "Shared project",
    scenario: project?.scenario ?? "zeropulse",
    services: (snapshot?.servicesJson ?? []) as ZeropsService[],
    yamlText: snapshot?.yamlText ?? null,
    takenAt: snapshot?.takenAt ?? share.createdAt,
    suggestions: (report?.suggestionsJson ?? []) as Suggestion[],
    engine: report?.engine ?? "rules",
    score: report?.score ?? null,
    summary: report?.summary ?? null,
  };
}
