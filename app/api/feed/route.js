import { NextResponse } from "next/server";
import { buildFeed } from "@/lib/feed";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req) {
  const rl = rateLimit(clientIp(req), { limit: 30, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });
  }
  try {
    const data = await buildFeed();
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
