import { NextResponse } from "next/server";
import { createShare, getProject } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Mint a public read-only share link for a project. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { projectId?: string };
  const projectId = body.projectId;
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const share = await createShare(projectId);
  return NextResponse.json({
    shareId: share.id,
    url: `/b/${share.id}`,
  });
}
