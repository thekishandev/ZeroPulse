import { NextResponse } from "next/server";
import { getAdvisorSuggestions } from "@/lib/advisor";
import { generateZeropsYaml } from "@/lib/zerops";
import {
  getLatestAdvisorReport,
  getLatestSnapshot,
  getProject,
  insertAdvisorReport,
} from "@/lib/queries";
import type { ZeropsService } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Run the architecture advisor over a project's current services. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    services?: ZeropsService[];
    yamlText?: string;
  };

  // Prefer server-side truth: fall back to the latest snapshot.
  let services = Array.isArray(body.services) ? body.services : null;
  let yamlText = body.yamlText;
  if (!services) {
    const snap = await getLatestSnapshot(projectId);
    services = (snap?.servicesJson ?? []) as ZeropsService[];
    yamlText = snap?.yamlText ?? undefined;
  }
  if (!yamlText) yamlText = generateZeropsYaml(services);

  const result = await getAdvisorSuggestions(services, yamlText);
  await insertAdvisorReport(projectId, result);

  return NextResponse.json(result);
}

/** Return the most recent advisor report for a project. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const report = await getLatestAdvisorReport(projectId);
  if (!report) {
    return NextResponse.json({ suggestions: [], engine: null }, { status: 200 });
  }
  return NextResponse.json({
    suggestions: report.suggestionsJson,
    engine: report.engine,
    score: Number(report.score),
    summary: report.summary,
  });
}
