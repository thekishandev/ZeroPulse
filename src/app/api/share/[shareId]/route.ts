import { NextResponse } from "next/server";
import { getShareBundle } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Public read-only bundle: topology + latest advisor report. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params;
  const bundle = await getShareBundle(shareId);
  if (!bundle) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
  return NextResponse.json(bundle);
}
