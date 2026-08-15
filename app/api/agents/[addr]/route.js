import { NextResponse } from "next/server";
import { runAudit } from "@/lib/engine";

export const maxDuration = 120;

// GET /api/agents/[addr] — quick onchain audit of a wallet (no website)
export async function GET(_req, { params }) {
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
