// find_demo_wallet.mjs — mines Base for an EOA wallet with LIVE open approvals.
// Method: page through Approval events EMITTED by major token contracts
// (Blockscout indexes emitter logs), collect owners, probe live allowances
// via eth_call, rank by danger, run a full VETTE audit, save data/demo.json.

import { BASESCAN, currentAllowance, getSmartContract, fmtUnits } from "../lib/providers.js";

const TOKENS = [
  ["USDC", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
  ["WETH", "0x4200000000000000000000000000000000000006"],
  ["DAI", "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"],
  ["AERO", "0x940181a94A35A4569E4529A3CDfB74e38FD98631"],
  ["cbBTC", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"],
];

const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const PAGES_PER_TOKEN = 6; // 6 × 50 = 300 approvals per token

const jget = async (url) => {
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "VETTE/0.1" },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const topicAddr = (t) => (t ? "0x" + t.slice(26).toLowerCase() : null);

async function mineApprovals(tokenAddr) {
  const owners = new Map(); // owner -> approval rows
  let next = null;
  for (let page = 0; page < PAGES_PER_TOKEN; page++) {
    let url = `${BASESCAN}/api/v2/addresses/${tokenAddr}/logs?topic=${APPROVAL_TOPIC}`;
    if (next) {
      const qs = Object.entries(next)
        .filter(([k]) => k !== "items_count")
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
      url += `&${qs}`;
    }
    let d;
    try {
      d = await jget(url);
    } catch (e) {
      break;
    }
    for (const l of d.items || []) {
      const owner = l.decoded?.parameters?.find((p) => p.name === "owner")?.value || topicAddr(l.topics?.[1]);
      const spender = l.decoded?.parameters?.find((p) => p.name === "spender")?.value || topicAddr(l.topics?.[2]);
      if (!owner || !spender) continue;
      if (!owners.has(owner)) owners.set(owner, []);
      owners.get(owner).push({ spender, tokenAddr, tx: l.tx_hash });
    }
    next = d.next_page_params;
    if (!next) break;
  }
  return owners;
}

async function isContract(addr) {
  const res = await fetch("https://mainnet.base.org", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getCode", params: [addr, "latest"], id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const j = await res.json();
  return j.result && j.result !== "0x";
}

async function main() {
  const allOwners = new Map();
  for (const [sym, addr] of TOKENS) {
    console.log(`▶ mining ${sym} Approval events…`);
    try {
      const owners = await mineApprovals(addr);
      console.log(`  ${sym}: ${owners.size} distinct owners in window`);
      for (const [o, rows] of owners) {
        if (!allOwners.has(o)) allOwners.set(o, []);
        for (const r of rows.slice(0, 3)) allOwners.get(o).push({ ...r, tokenSymbol: sym });
      }
    } catch (e) {
      console.log(`  ${sym} failed: ${e.message}`);
    }
  }

  console.log(`\n▶ ${allOwners.size} candidate owners. Probing live allowances…`);
  const hits = [];
  let i = 0;
  for (const [owner, rows] of allOwners) {
    i++;
    if (await isContract(owner)) continue; // EOAs only — contracts are a different story
    for (const r of rows) {
      try {
        const allow = await currentAllowance(r.tokenAddr, owner, r.spender);
        if (allow <= 0n) continue;
        const meta = await getSmartContract(r.spender);
        hits.push({
          address: owner,
          token: r.tokenAddr,
          tokenSymbol: r.tokenSymbol,
          spender: r.spender,
          spenderName: meta?.name || null,
          spenderVerified: !!meta?.verified,
          spenderScam: !!meta?.scam,
          allowance: allow.toString(),
          allowanceHuman: fmtUnits(allow),
          tx: r.tx,
          interesting: !meta?.verified || !!meta?.scam,
        });
        if (hits.length >= 12) break;
      } catch {
        /* rate limit — move on */
      }
    }
    if (hits.length >= 12) break;
    if (i % 15 === 0) await new Promise((r) => setTimeout(r, 300));
  }

  hits.sort(
    (a, b) =>
      Number(b.spenderScam) - Number(a.spenderScam) ||
      Number(b.interesting) - Number(a.interesting) ||
      Number(BigInt(b.allowance) > BigInt(a.allowance))
  );

  console.log(`\n▶ ${hits.length} LIVE approvals found:`);
  for (const h of hits)
    console.log(
      `  ${h.address} → ${h.spenderName || h.spender.slice(0, 12)}… [${h.tokenSymbol}] allow=${h.allowanceHuman}${h.spenderScam ? " ⚠️SCAM" : h.spenderVerified ? "" : " ⚠️UNVERIFIED"}`
    );

  if (!hits.length) {
    console.log("no live approvals in this window — run again later");
    process.exit(0);
  }

  const best = hits[0];
  console.log(`\n▶ full VETTE audit of ${best.address}…`);
  const { runAudit } = await import("../lib/engine.js");
  const audit = await runAudit({ address: best.address });
  const fs = await import("fs");
  fs.writeFileSync(
    new URL("../data/demo.json", import.meta.url),
    JSON.stringify({ foundAt: new Date().toISOString(), approvals: hits, audit }, null, 1)
  );
  console.log(`\n✅ saved data/demo.json — verdict ${audit.verdict} ${audit.score}/100`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
