import { NextResponse } from "next/server";
import { autonomousRun } from "@/lib/agentrun";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Vercel cron calls this every hour (see vercel.json).
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
export async function POST(req) {
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
