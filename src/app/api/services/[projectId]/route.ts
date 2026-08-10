import { NextResponse } from "next/server";
import { generateZeropsYaml, fetchProjectServices } from "@/lib/zerops";
import { getProject, insertSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Read a project's live service topology (cache → live/demo). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const force = new URL(req.url).searchParams.get("refresh") === "1";
  const result = await fetchProjectServices(
    project.zeropsToken,
    project.zeropsProjectId,
    project.scenario,
    { force },
  );

  const yamlText = generateZeropsYaml(result.services);
  // Persist a snapshot — powers history + public shares.
  await insertSnapshot(projectId, result.services, yamlText, result.source);

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      scenario: project.scenario,
    },
    services: result.services,
    yamlText,
    source: result.source,
    fromCache: result.fromCache,
    cacheAgeSeconds: result.cacheAgeSeconds,
  });
}
