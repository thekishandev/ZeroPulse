import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/mockData";
import { createProject } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Create (connect) a Zerops project. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    zeropsProjectId?: string;
    zeropsToken?: string;
    name?: string;
    scenario?: string;
  };

  const zeropsProjectId = (body.zeropsProjectId || "").trim();
  const name = (body.name || "").trim();
  const zeropsToken = (body.zeropsToken || "").trim();
  const scenario = SCENARIOS.some((s) => s.id === body.scenario)
    ? body.scenario!
    : "zeropulse";

  if (!zeropsProjectId) {
    return NextResponse.json(
      { error: "A Zerops Project ID is required." },
      { status: 400 },
    );
  }

  const created = await createProject({
    zeropsProjectId,
    zeropsToken,
    name: name || zeropsProjectId,
    scenario,
  });

  return NextResponse.json({ projectId: created.id, scenario });
}
