// agentrun.js — Vette's autonomous run: no human asked for this.
// Every day at 06:00 UTC the cron wakes this: it re-checks the whole field —
// websites, registered wallets, approval surfaces — on its own schedule.
//
// Persistent run history: written to the public repo file data/agent-log.json
// via the GitHub Contents API when GITHUB_PAT + GITHUB_REPO are configured.
// Until then, runs execute and report live; only the permanent log is offline.

import { fetchEntries } from "./orion";
import { RPC_URLS, BASESCAN } from "./providers";

const MAX_ENTRIES = 12;

async function jget(url, timeout = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "VETTE/0.1 (autonomous-run)" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function rpc(method, params = []) {
  let lastErr = null;
  return (async () => {
    for (const url of RPC_URLS) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
          signal: AbortSignal.timeout(12000),
        });
        const j = await res.json();
        if (j.error) throw new Error(j.error.message);
        return j.result;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("all RPCs failed");
  })();
}

async function checkSite(url) {
  if (!url) return { status: null, note: "no website listed" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; VETTE-autonomous/0.1)" },
      redirect: "follow",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    return { status: res.status, note: res.ok ? "up" : "down" };
  } catch {
    return { status: null, note: "unreachable" };
  }
}

async function checkWallet(addr) {
  if (!addr) return { note: "no registered wallet" };
  try {
    const [txs, balance] = await Promise.all([
      jget(`${BASESCAN}/api/v2/addresses/${addr}/transactions`),
      rpc("eth_getBalance", [addr, "latest"]),
    ]);
    return {
      txCount: (txs.items || []).length,
      balanceWei: String(balance || "0x0"),
      note: (txs.items || []).length > 0 ? "active" : "empty ledger",
    };
  } catch {
    return { note: "check failed — explorer/RPC busy" };
  }
}

// ---------- the daily sweep: fresh catches, mined by the agent itself ----------

const SWEEP_TOKENS = [
  ["USDC", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
  ["AERO", "0x940181a94A35A4569E4529A3CDfB74e38FD98631"],
  ["WETH", "0x4200000000000000000000000000000000000006"],
];
const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const ALLOWANCE_SELECTOR = "0xdd62ed3e";
const SWEEP_BUDGET_MS = 40000; // probe-phase time-box — the run must never hang

function topicAddr(t) {
  return t ? "0x" + t.slice(26).toLowerCase() : null;
}
function pad32(h) {
  return h.slice(2).toLowerCase().padStart(64, "0");
}

// Mine a handful of fresh "caught" wallets: open allowances found in the last
// pages of Approval events on major Base tokens. Only unverified or unlimited
// spenders are reported — and every catch carries its evidence tx. Time-boxed:
// if the chain is slow, the sweep returns fewer (or zero) catches, honestly.
async function mineLightCatches() {
  const pairs = []; // {owner, token, symbol, spender, tx}
  let tokenFailures = 0;
  const PAGE_DEPTH = 3; // first-page logs skew to contract owners — paginate for EOAs

  for (const [symbol, token] of SWEEP_TOKENS) {
    try {
      let next = null;
      for (let page = 0; page < PAGE_DEPTH && pairs.length < 300; page++) {
        let url = `${BASESCAN}/api/v2/addresses/${token}/logs?topic=${APPROVAL_TOPIC}`;
        if (next) {
          const qs = Object.entries(next)
            .filter(([k]) => k !== "items_count")
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join("&");
          url += `&${qs}`;
        }
        let d = null;
        for (let attempt = 0; attempt < 2 && !d; attempt++) {
          try {
            d = await jget(url, 12000);
          } catch {
            await new Promise((r) => setTimeout(r, 800));
          }
        }
        if (!d) {
          tokenFailures++;
          break;
        }
        for (const l of (d.items || []).slice(0, 50)) {
          const owner = l.decoded?.parameters?.find((p) => p.name === "owner")?.value || topicAddr(l.topics?.[1]);
          const spender = l.decoded?.parameters?.find((p) => p.name === "spender")?.value || topicAddr(l.topics?.[2]);
          if (!owner || !spender) continue;
          pairs.push({ owner, token, symbol, spender, tx: l.transaction_hash });
          if (pairs.length >= 300) break;
        }
        next = d.next_page_params;
        if (!next) break;
      }
    } catch {
      tokenFailures++;
    }
  }

  if (!pairs.length) {
    return {
      catches: [],
      note: tokenFailures >= SWEEP_TOKENS.length ? "sweep failed — explorer busy" : "sweep found no approval pairs",
    };
  }

  // the probe phase is the expensive part — this is where the clock runs
  const probeStarted = Date.now();
  const budget = () => Date.now() - probeStarted > SWEEP_BUDGET_MS;

  const seen = new Set();
  const ownerCode = new Map(); // owner → isContract (cached — one RPC per owner)
  const catches = [];
  for (const p of pairs) {
    if (budget()) break;
    const key = `${p.owner}:${p.spender}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      let isC = ownerCode.get(p.owner);
      if (isC === undefined) {
        const code = await rpc("eth_getCode", [p.owner, "latest"]);
        isC = !!code && code !== "0x";
        ownerCode.set(p.owner, isC);
      }
      if (isC) continue; // contracts are a different story
      const allowHex = await rpc("eth_call", [
        { to: p.token, data: ALLOWANCE_SELECTOR + pad32(p.owner) + pad32(p.spender) },
        "latest",
      ]);
      const allow = BigInt(allowHex);
      if (allow <= 0n) continue; // closed — not a catch
      let spenderMeta = null;
      try {
        const sm = await jget(`${BASESCAN}/api/v2/smart-contracts/${p.spender}`, 12000);
        spenderMeta = { name: sm.name || null, verified: !!sm.is_verified };
      } catch {}
      const unlimited = allow >= (1n << 256n) - 1n - ((1n << 256n) - 1n) / 1000000n;
      if (spenderMeta?.verified && !unlimited) continue; // healthy hygiene — not a catch
      catches.push({
        address: p.owner,
        token: p.token,
        tokenSymbol: p.symbol,
        spender: p.spender,
        spenderName: spenderMeta?.name || null,
        spenderVerified: !!spenderMeta?.verified,
        allowanceWei: allow.toString(),
        tx: p.tx,
      });
      if (catches.length >= 3) break;
    } catch {
      /* probe failed — next pair */
    }
  }
  return {
    catches,
    note: catches.length ? "sweep found live exposure" : "sweep found nothing reportable",
  };
}

async function appendToGithubLog(run) {
  const pat = process.env.GITHUB_PAT;
  const repo = process.env.GITHUB_REPO; // e.g. hackid02/vette
  if (!pat || !repo) return false;
  const api = `https://api.github.com/repos/${repo}/contents/data/agent-log.json`;
  try {
    const existing = await fetch(api, {
      headers: {
        authorization: `Bearer ${pat}`,
        accept: "application/vnd.github+json",
        "user-agent": "VETTE/0.1",
      },
      signal: AbortSignal.timeout(15000),
    });
    let log = { agent: "VETTE", runs: [] };
    let sha = null;
    if (existing.ok) {
      const e = await existing.json();
      sha = e.sha;
      log = JSON.parse(Buffer.from(e.content, "base64").toString("utf8"));
    }
    log.runs.unshift(run);
    log.runs = log.runs.slice(0, 100);
    const res = await fetch(api, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${pat}`,
        accept: "application/vnd.github+json",
        "user-agent": "VETTE/0.1",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: `vette autonomous run ${run.id}`,
        content: Buffer.from(JSON.stringify(log, null, 2)).toString("base64"),
        ...(sha ? { sha } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function autonomousRun({ reason = "scheduled" } = {}) {
  const startedAt = new Date();
  const id = "run-" + startedAt.getTime().toString(36);

  // No silent fallback list: if the contest API is unreachable, the run
  // RECORDS the failure instead of pretending. Honesty is the product.
  let entries = [];
  let fieldError = null;
  try {
    entries = await fetchEntries();
  } catch (e) {
    fieldError = String(e.message || e).slice(0, 120);
  }
  const checks = [];
  for (const e of entries.slice(0, MAX_ENTRIES)) {
    const [site, wallet] = await Promise.all([checkSite(e.website), checkWallet(e.wallet)]);
    checks.push({
      name: e.name,
      website: e.website,
      wallet: e.wallet,
      site,
      wallet,
    });
  }

  // chain liveness as part of the self-check
  let block = null;
  try {
    block = parseInt(await rpc("eth_blockNumber"), 16);
  } catch {}

  // the daily sweep: the agent hunts fresh exposure on its own schedule
  const sweep = await mineLightCatches();

  const run = {
    id,
    reason,
    at: startedAt.toISOString(),
    entriesChecked: checks.length,
    fieldError, // null when the contest API responded
    block,
    checks,
    catches: sweep.catches,
    sweepNote: sweep.note,
    persisted: null,
  };

  run.persisted = await appendToGithubLog(run);

  return run;
}
