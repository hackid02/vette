import { NextResponse } from "next/server";
import { runAudit } from "@/lib/engine";
import { normalizeUrl } from "@/lib/providers";

export const maxDuration = 120;

// POST { url?, address?, claims? } → full audit
export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // a wallet address pasted into the URL field is still a wallet
  let url = normalizeUrl(body.url);
  let address = /^0x[a-fA-F0-9]{40}$/.test(body.address || "") ? body.address.toLowerCase() : null;
  if (!url && /^0x[a-fA-F0-9]{40}$/.test((body.url || "").trim())) {
    address = body.url.trim().toLowerCase();
  }
  const claims = typeof body.claims === "string" ? body.claims.slice(0, 1000) : null;

  if (!url && !address) {
    return NextResponse.json(
      { error: "Give Vette something to vet: a URL or a wallet address (or both)." },
      { status: 400 }
    );
  }

  try {
    const audit = await runAudit({ url, address, claims });
    return NextResponse.json(audit);
  } catch (e) {
    console.error("audit failed", e);
    return NextResponse.json(
      { error: "Vette's engine hit an unexpected error.", detail: String(e.message || e) },
      { status: 500 }
    );
  }
}
