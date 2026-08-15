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

  const entries = await fetchEntries();
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

  const run = {
    id,
    reason,
    at: startedAt.toISOString(),
    entriesChecked: checks.length,
    block,
    checks,
    persisted: null,
  };

  run.persisted = await appendToGithubLog(run);

  return run;
}
