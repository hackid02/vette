import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const maxDuration = 60;

// POST { account, token, spender } → can the connected account afford this revoke?
// Runs eth_estimateGas + eth_getBalance server-side, so the wallet is only asked
// to sign something that will actually go through.
export async function POST(req) {
  const ip = clientIp(req);
  const rl = rateLimit(ip, { limit: 20, windowMs: 60000 });
  if (!rl.ok) {
    return NextResponse.json({ error: `Rate limited — ${rl.retryAfterSec}s.` }, { status: 429 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const account = /^0x[a-fA-F0-9]{40}$/.test(body.account || "") ? body.account.toLowerCase() : null;
  const token = /^0x[a-fA-F0-9]{40}$/.test(body.token || "") ? body.token.toLowerCase() : null;
  const spender = /^0x[a-fA-F0-9]{40}$/.test(body.spender || "") ? body.spender.toLowerCase() : null;
  if (!account || !token || !spender) {
    return NextResponse.json({ error: "account, token and spender must be valid addresses" }, { status: 400 });
  }

  // approve(spender, 0) calldata
  const APPROVE_SELECTOR = "0x095ea7b3";
  const pad32 = (h) => h.slice(2).padStart(64, "0");
  const data = APPROVE_SELECTOR + pad32(spender) + "0".padStart(64, "0");

  const urls = ["https://mainnet.base.org", "https://base.drpc.org", "https://1rpc.io/base"];
  const rpc = async (url, method, params) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error.message);
    return j.result;
  };

  let gasEstimate = null;
  let estimateErr = null;
  for (const url of urls) {
    try {
      gasEstimate = await rpc(url, "eth_estimateGas", [{ from: account, to: token, data, value: "0x0" }]);
      break;
    } catch (e) {
      estimateErr = e;
    }
  }

  let balanceWei = null;
  for (const url of urls) {
    try {
      balanceWei = await rpc(url, "eth_getBalance", [account, "latest"]);
      break;
    } catch {}
  }

  if (!gasEstimate) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Could not estimate gas for this revoke — the token contract may not accept approve() calls. Preflight aborted; nothing was signed.",
        detail: estimateErr ? String(estimateErr.message || estimateErr).slice(0, 120) : null,
      },
      { status: 200 }
    );
  }

  const gas = BigInt(gasEstimate);
  const bal = balanceWei != null ? BigInt(balanceWei) : null;
  const canAfford = bal != null ? bal >= gas : true; // if balance unknown, let the wallet decide

  return NextResponse.json({
    ok: true,
    canAfford,
    gasEstimateWei: gas.toString(),
    balanceWei: bal != null ? bal.toString() : null,
    warning: canAfford ? null : "This wallet may not hold enough ETH for gas on Base. Top up a few cents of ETH and retry.",
  });
}
