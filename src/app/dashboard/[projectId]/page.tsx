import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/components/Dashboard";
import { getProject, insertSnapshot } from "@/lib/queries";
import { fetchProjectServices, generateZeropsYaml, isMockMode } from "@/lib/zerops";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const result = await fetchProjectServices(
    project.zeropsToken,
    project.zeropsProjectId,
    project.scenario,
  );
  const yamlText = generateZeropsYaml(result.services);

  // Persist a snapshot whenever we read fresh state (powers history + shares).
  if (!result.fromCache) {
    await insertSnapshot(projectId, result.services, yamlText, result.source);
  }

  return (
    <>
      <Navbar />
      <Dashboard
        projectId={project.id}
        projectName={project.name}
        scenario={project.scenario}
        mockMode={isMockMode()}
        initial={{
          services: result.services,
          yamlText,
          source: result.source,
          fromCache: result.fromCache,
          cacheAgeSeconds: result.cacheAgeSeconds,
        }}
      />
    </>
  );
}
