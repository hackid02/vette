import { NextResponse } from "next/server";
import { getTokenTransfers, getTokenTransfersRpc, getBalance, EXPLORER_ADDR } from "@/lib/providers";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { runAlibi } from "@/lib/alibi";

export const maxDuration = 60;

// POST { address, charge? } → the alibi: a rebuilt money-trail for the accused.
// Explorer transfer history first; RPC log-scan fallback when it's down.
// The scope is always stated honestly — the alibi is only as deep as the data.
export async function POST(req) {
  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 10, windowMs: 60000 });
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

  const address = /^0x[a-fA-F0-9]{40}$/.test(body.address || "")
    ? body.address.toLowerCase()
    : null;
  if (!address) {
    return NextResponse.json(
      { error: "Paste a valid wallet address on Base — that's the accused." },
      { status: 400 }
    );
  }
  const charge = String(body.charge || "").slice(0, 160);

  // dual-source transfer history, same machinery as the audit
  let transfers = null;
  let scope = "";
  let source = "";
  try {
    transfers = await getTokenTransfers(address);
    source = "explorer";
    scope = "Blockscout indexed history";
  } catch {
    try {
      const r = await getTokenTransfersRpc(address, 24); // deeper: ~5.7 days
      transfers = r.items || [];
      source = "rpc";
      scope = r.complete
        ? "RPC Transfer-event scan (~5.7 days — explorer was unreachable)"
        : "PARTIAL RPC Transfer-event scan — lower bound only";
    } catch {
      transfers = [];
      source = "none";
      scope = "no transfer source reachable right now";
    }
  }

  let balanceEth = null;
  try {
    balanceEth = (await getBalance(address)).toString();
  } catch {
    balanceEth = null;
  }

  const result = runAlibi({ address, transfers, charge, scope });

  // If no outbound value was in reach but real funds rest in the wallet
  // itself, the honest reading is "the money is home" — scoped to the
  // reachable history.
  if (
    result.verdict === "TRAIL TOO SHALLOW" &&
    balanceEth != null &&
    BigInt(balanceEth) > 0n &&
    (transfers || []).length > 0
  ) {
    result.verdict = "THE MONEY CAME HOME";
    result.verdictDetail =
      "No outbound value within the reachable history — the funds rest in the wallet itself. On the evidence in reach, the money is home.";
  }
  result.source = source;
  result.balanceEth = balanceEth;
  result.link = `${EXPLORER_ADDR}${address}`;
  return NextResponse.json(result);
}
