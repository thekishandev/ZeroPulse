import { NextResponse } from "next/server";
import { listProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** List connected projects (token is never returned). */
export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch {
    // DATABASE_URL not set — return empty list so the landing page still renders.
    return NextResponse.json({ projects: [] });
  }
}
