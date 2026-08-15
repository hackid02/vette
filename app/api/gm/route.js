import { NextResponse } from "next/server";
import { buildGmReport } from "@/lib/gm";

export const maxDuration = 120;

// POST { address } → the GM report
export async function POST(req) {
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
    const report = await buildGmReport(address);
    return NextResponse.json(report);
  } catch (e) {
    console.error("gm failed", e);
    return NextResponse.json(
      { error: "Vette's engine hit an unexpected error.", detail: String(e.message || e) },
      { status: 500 }
    );
  }
}
