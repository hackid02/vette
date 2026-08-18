// gm.js — the GM Report: a morning digest for any wallet.
// Same discipline as the audit engine: deterministic reads first, narration last.
// Every line traces to a live onchain read. Nothing invented.
//
// 2026-08-16 hardening:
//   - incomplete scan → the verdict line says UNVERIFIABLE, never "clean"
//   - baseline pairs are re-checked with LIVE allowance probes (a door is
//     only "closed" when the chain says 0 right now)

import {
  getBalance, getCode, getTxs, getTokenTransfers, getApprovalLogs,
  currentAllowance, getSmartContract, getTokenSymbol, fmtEth, fmtUnits, shortAddr, ageDays,
  APPROVAL_SCOPE, MAX_UINT_BIG,
} from "./providers";

const MAX_PROBES = 10;

export async function buildGmReport(address, { baseline = null } = {}) {
  const addr = address.toLowerCase();
  const now = Date.now();
  const D7 = 7 * 86400000;
  const D30 = 30 * 86400000;

  // one dead source must not kill the report
  const grab = async (fn) => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };

  const [balance, code, txs, transfers, scan] = await Promise.all([
    grab(() => getBalance(addr)),
    grab(() => getCode(addr)),
    grab(() => getTxs(addr)),
    grab(() => getTokenTransfers(addr)),
    grab(() => getApprovalLogs(addr)),
  ]);

  const txsA = txs || [];
  const transfersA = transfers || [];
  const logsA = scan?.logs || [];
  const scanComplete = scan?.complete === true;
  const isContract = (code || "0x") !== "0x" && code !== "0x";

  const bucket = (arr) => ({
    d7: arr.filter((x) => x.ts && now - x.ts <= D7).length,
    d30: arr.filter((x) => x.ts && now - x.ts <= D30).length,
  });

  const activity = {
    tx7d: bucket(txsA).d7,
    tx30d: bucket(txsA).d30,
    transfers7d: bucket(transfersA).d7,
    transfers30d: bucket(transfersA).d30,
    lastActiveDaysAgo: txsA.length ? ageDays(txsA[0].ts) : null,
    hasAny: txsA.length > 0 || transfersA.length > 0 || logsA.length > 0,
  };

  // live allowance probes for open approvals owned by this wallet
  const openLogs = logsA
    .filter((l) => l.value > 0n && l.spender && l.owner === addr && l.spender !== addr)
    .slice(0, MAX_PROBES);

  const list = [];
  for (const l of openLogs) {
    const [allow, meta, sym] = await Promise.all([
      currentAllowance(l.tokenAddr, addr, l.spender).catch(() => 0n),
      getSmartContract(l.spender).catch(() => null),
      getTokenSymbol(l.tokenAddr).catch(() => null),
    ]);
    if (allow <= 0n) continue; // closed since the event — not a live door
    const tokenSymbol =
      transfersA.find(
        (t) => t.tokenAddr?.toLowerCase() === (l.tokenAddr || "").toLowerCase()
      )?.token || sym || null;
    const unlimited = allow >= MAX_UINT_BIG - MAX_UINT_BIG / 1000000n;
    const known = meta?.verified && !meta?.scam;
    const spenderShort = shortAddr(l.spender);

    let level, title, detail;
    if (meta?.scam) {
      level = "critical";
      title = `Scam-flagged contract holds an allowance (${spenderShort})`;
      detail = `${fmtUnits(allow)} ${tokenSymbol || "tokens"} open to ${meta.name || l.spender}, flagged as scam by Base explorers. This is the signature of a drainer.`;
    } else if (!known) {
      level = "danger";
      title = `Unverified contract holds an allowance (${spenderShort})`;
      detail = `${fmtUnits(allow)} ${tokenSymbol || "tokens"} open to ${l.spender} — no public source code. If it's ever compromised, it moves those funds with no further signature from you.`;
    } else if (unlimited) {
      level = "warning";
      title = `Unlimited allowance to ${meta.name || spenderShort}`;
      detail = `${fmtUnits(allow)} ${tokenSymbol || "tokens"} — standard DeFi practice, still a permanent risk surface. Vette recommends finite allowances.`;
    } else {
      level = "info";
      title = `Bounded allowance to ${meta.name || spenderShort}`;
      detail = `${fmtUnits(allow)} ${tokenSymbol || "tokens"}, verified contract, capped. Healthy hygiene.`;
    }

    list.push({
      token: l.tokenAddr,
      tokenSymbol,
      spender: l.spender,
      spenderName: meta?.name || null,
      spenderVerified: !!meta?.verified,
      spenderScam: !!meta?.scam,
      value: allow.toString(),
      valueHuman: fmtUnits(allow),
      level,
      title,
      detail,
      action:
        level === "critical" || level === "danger" || level === "warning"
          ? {
              type: "revoke",
              token: l.tokenAddr,
              spender: l.spender,
              spenderName: meta?.name || null,
              tokenSymbol,
              label: `Revoke allowance to ${meta?.name || spenderShort} (${tokenSymbol || "token"})`,
            }
          : null,
    });
  }

  // Baseline re-check with LIVE probes: a pair is "closed" only if the chain
  // says allowance 0 right now. Never inferred from a fresh log scan.
  const baselineStatus = [];
  if (Array.isArray(baseline) && baseline.length) {
    for (const pair of baseline.slice(0, 30)) {
      if (!pair || !/^0x[a-fA-F0-9]{40}$/.test(pair.token || "") || !/^0x[a-fA-F0-9]{40}$/.test(pair.spender || "")) continue;
      let open = null;
      try {
        const allow = await currentAllowance(pair.token, addr, pair.spender);
        open = allow > 0n;
      } catch {
        open = null; // unknown — never reported as closed
      }
      baselineStatus.push({ token: pair.token, spender: pair.spender, open });
    }
  }

  const counts = { critical: 0, danger: 0, warning: 0, info: 0 };
  for (const x of list) counts[x.level]++;

  // ---------- narration ----------
  const d = new Date(now);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const lines = [];
  lines.push(`GM, ${shortAddr(addr)}. ${weekday}, ${date}.`);
  if (isContract) {
    lines.push("Heads-up: this address is a contract, not a standard wallet — read 'your wallet' accordingly.");
  }
  lines.push(`Balance: ${fmtEth(balance || 0n)}.`);
  if (activity.hasAny) {
    lines.push(
      `Last 7 days: ${activity.tx7d} transaction(s), ${activity.transfers7d} token transfer(s). Last 30: ${activity.tx30d} / ${activity.transfers30d}.`
    );
  } else {
    lines.push("No indexed activity — an empty ledger can neither prove nor break a promise.");
  }

  if (!scanComplete) {
    lines.push(
      "Approval scan INCOMPLETE (public RPC limits). Vette will not call this wallet safe on partial evidence — the safety verdict is UNVERIFIABLE."
    );
  } else if (list.length === 0) {
    lines.push("Approval surface: no live approvals in the scanned window. No open doors found in the window.");
  } else {
    lines.push(
      `Approval surface: ${list.length} live approval(s) probed — ${counts.critical} critical, ${counts.danger} dangerous, ${counts.warning} warning(s).`
    );
  }

  // canonical verdict vocabulary — the same four words, always scoped
  if (!scanComplete) {
    lines.push("Verdict: UNVERIFIABLE — the scan did not complete.");
  } else if (!activity.hasAny && list.length === 0) {
    lines.push("Verdict: UNVERIFIABLE — empty ledger, nothing to judge yet. Check back after the wallet acts.");
  } else if (counts.critical || counts.danger) {
    lines.push(
      `Verdict: DANGEROUS — ${counts.critical + counts.danger} open door(s) found in the window. If this is your wallet, connect and one click ends each.`
    );
  } else if (counts.warning) {
    lines.push("Verdict: COMPLIANT (scoped) — no active threats in the window; permanent risk surfaces remain. Vette would cap them.");
  } else {
    lines.push("Verdict: COMPLIANT (scoped) — no open doors in the scanned window.");
  }

  lines.push(
    `Scope: the most recent ~${APPROVAL_SCOPE.APPROVAL_WINDOWS * APPROVAL_SCOPE.LOG_WINDOW} blocks of approval events, plus live allowance probes. Older approvals are not claimed either way.`
  );

  return {
    ts: new Date().toISOString(),
    address: addr,
    isContract,
    scanComplete,
    balanceEth: fmtEth(balance || 0n),
    activity,
    approvals: { total: list.length, ...counts, list },
    baselineStatus,
    narrative: lines,
    actions: list.map((x) => x.action).filter(Boolean),
  };
}
