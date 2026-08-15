import { NextResponse } from "next/server";
import { fetchEntries } from "@/lib/orion";

export const dynamic = "force-dynamic";

// GET /api/field — the hackathon field, straight from the contest API
export async function GET() {
  try {
    const entries = await fetchEntries();
    return NextResponse.json({ ok: true, entries, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
}
