import { NextResponse } from "next/server";
import { runAudit } from "@/lib/engine";
import { normalizeUrl } from "@/lib/providers";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { signCard, cardConfigured } from "@/lib/cardsig";

export const maxDuration = 120;

// POST { url?, address?, claims?, mandateExplicit? } → full audit
export async function POST(req) {
  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 8, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited — ${rl.retryAfterSec}s. Vette does real onchain work per audit; slow down a little.` },
      { status: 429 }
    );
  }

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
  const mandateExplicit = body.mandateExplicit === true && !!claims;

  if (!url && !address) {
    return NextResponse.json(
      { error: "Give Vette something to vet: a URL or a wallet address (or both)." },
      { status: 400 }
    );
  }

  try {
    const audit = await runAudit({ url, address, claims, mandateExplicit });
    if (cardConfigured()) {
      audit.cardSig = signCard({ v: audit.verdict, s: audit.score, t: audit.target });
    }
    return NextResponse.json(audit);
  } catch (e) {
    console.error("audit failed", e);
    return NextResponse.json(
      { error: "Vette's engine hit an unexpected error.", detail: String(e.message || e) },
      { status: 500 }
    );
  }
}
