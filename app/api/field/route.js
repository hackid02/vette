import { NextResponse } from "next/server";
import { fetchEntries } from "@/lib/orion";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// GET /api/field — the hackathon field, straight from the contest API
export async function GET(req) {
  const rl = rateLimit(clientIp(req), { limit: 30, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });
  }
  try {
    const entries = await fetchEntries();
    return NextResponse.json({ ok: true, entries, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
}
