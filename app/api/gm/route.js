import { NextResponse } from "next/server";
import { buildGmReport } from "@/lib/gm";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const maxDuration = 120;

// POST { address, baseline?: [{token, spender}] } → the GM report
export async function POST(req) {
  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 15, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited — ${rl.retryAfterSec}s. One honest read at a time.` },
      { status: 429 }
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const address = /^0x[a-fA-F0-9]{40}$/.test(body.address || "")
    ? body.address.toLowerCase()
    : null;
  if (!address) {
    return NextResponse.json(
      { error: "Give Vette a valid wallet address on Base." },
      { status: 400 }
    );
  }
  try {
    const baseline = Array.isArray(body.baseline) ? body.baseline.slice(0, 30) : null;
    const report = await buildGmReport(address, { baseline });
    return NextResponse.json(report);
  } catch (e) {
    console.error("gm failed", e);
    return NextResponse.json(
      { error: "Vette's engine hit an unexpected error.", detail: String(e.message || e) },
      { status: 500 }
    );
  }
}
