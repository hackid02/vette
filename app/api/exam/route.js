import { NextResponse } from "next/server";
import { fetchSite, normalizeUrl, getCode } from "@/lib/providers";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { runExam } from "@/lib/exam";

export const maxDuration = 30;

// POST { url } → the exam paper. Instant and deterministic: text grading on
// the agent's own public face, plus one small chain read on Base mainnet —
// which published addresses are EOAs and which are contracts.
export async function POST(req) {
  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 15, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited — ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = normalizeUrl(body.url);
  if (!url) {
    return NextResponse.json({ error: "Paste a valid agent URL — that's who sits the exam." }, { status: 400 });
  }

  const site = await fetchSite(url);
  if (!site.ok) {
    return NextResponse.json(
      {
        unreachable: true,
        note: `The agent didn't show up: ${site.error}. An unreachable agent gets no grade — the exam is taken in public, on its own words.`,
        url,
      },
      { status: 200 }
    );
  }

  // classify published addresses: EOA (real wallet) vs CONTRACT (code)
  const addresses = (site.addresses || []).slice(0, 20);
  const eoas = [];
  const contracts = [];
  let codeCheckFailed = false;
  let checked = 0;
  await Promise.all(
    addresses.map(async (a) => {
      try {
        const code = await getCode(a);
        checked += 1;
        if (code && code !== "0x") contracts.push(a.toLowerCase());
        else eoas.push(a.toLowerCase());
      } catch {
        codeCheckFailed = true;
      }
    })
  );
  if (checked === 0 && addresses.length > 0) codeCheckFailed = true;

  const result = runExam({
    text: site.text || "",
    links: site.links || [],
    addresses: (addresses || []).map((a) => a.toLowerCase()),
    eoas,
    contracts,
    codeCheckFailed,
    title: site.title || "",
    url,
  });

  if (addresses.length) {
    result.publishedWallet = addresses[0].toLowerCase();
    result.publishedWalletIsContract = contracts.includes(addresses[0].toLowerCase());
  }
  if (codeCheckFailed) {
    result.chainRead = "Base mainnet read partially failed — wallet graded as declared, contract check skipped.";
  }

  return NextResponse.json(result);
}
