import { NextResponse } from "next/server";
import { runAudit } from "@/lib/engine";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const maxDuration = 120;

// GET /api/agents/[addr] — quick onchain audit of a wallet (no website)
export async function GET(req, { params }) {
  const rl = rateLimit(clientIp(req), { limit: 8, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json({ error: `Rate limited — ${rl.retryAfterSec}s.` }, { status: 429 });
  }
  const { addr } = await params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr || "")) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  try {
    const audit = await runAudit({ address: addr.toLowerCase() });
    return NextResponse.json(audit);
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
