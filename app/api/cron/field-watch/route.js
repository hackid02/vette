import { NextResponse } from "next/server";
import { autonomousRun } from "@/lib/agentrun";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Vercel cron calls this daily at 06:00 UTC (see vercel.json).
// Vette re-checks the whole field on its own schedule — no human asked.
export async function GET(req) {
  // When CRON_SECRET is set, Vercel signs cron calls with it.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const run = await autonomousRun({ reason: "scheduled" });
    return NextResponse.json({ ok: true, run });
  } catch (e) {
    console.error("autonomous run failed", e);
    return NextResponse.json(
      { ok: false, error: String(e.message || e) },
      { status: 500 }
    );
  }
}

// POST = manual trigger ("RUN THE AGENT NOW" on /activity).
// Auth when CRON_SECRET is set, rate limited always — a fan-out across the
// whole field is expensive and must not be an open amplification button.
export async function POST(req) {
  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 3, windowMs: 120000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited — ${rl.retryAfterSec}s. The agent runs a full field pass; a few per two minutes is plenty.` },
      { status: 429 }
    );
  }
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const run = await autonomousRun({ reason: "manual" });
    return NextResponse.json({ ok: true, run });
  } catch (e) {
    console.error("manual run failed", e);
    return NextResponse.json(
      { ok: false, error: String(e.message || e) },
      { status: 500 }
    );
  }
}
