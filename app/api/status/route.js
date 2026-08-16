import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// GET /api/status — liveness + chain height (also proves the engine talks to Base)
export async function GET(req) {
  const rl = rateLimit(clientIp(req), { limit: 60, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });
  }
  const { rpc } = await import("@/lib/providers");
  try {
    const block = await rpc("eth_blockNumber");
    return NextResponse.json({
      ok: true,
      agent: "VETTE",
      status: "operational",
      chain: "base",
      block: parseInt(block, 16),
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, status: "degraded", detail: String(e.message || e) }, { status: 503 });
  }
}
