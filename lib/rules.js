// rules.js — the deterministic rule engine.
// The model may choose where to look, but the ENGINE decides what is true.
// Every finding must carry evidence: a tx hash, an address, or a URL.

import { fmtEth, fmtUnits, MAX_UINT_BIG, shortAddr } from "./providers";

export const LEVELS = { critical: 40, danger: 18, warning: 8, info: 0 };

// Words that must never become whitelist symbols — marketing copy like
// "only trades on Base" is not a mandate, and deviations only run on
// explicitly supplied mandates anyway (defense in depth).
const WHITELIST_STOPWORDS = new Set([
  "ON", "IN", "THE", "AND", "OF", "UP", "TO", "AT", "BY", "NO", "NOT",
  "MAX", "ONLY", "BASE", "WITH", "FOR", "ALL", "ANY", "YOU", "YOUR",
  "DATA", "BEST", "MORE", "THAN", "WITHIN", "CAP", "LIMIT", "ITS", "IT",
]);

// Hardcoded top-20 (consensus market-cap ranking as of 2026-08) used for
// "top-N" mandate claims. Unsourced consensus is acknowledged: this list only
// ever backs a USER-supplied mandate check, and the finding cites the claim.
export const TOP20 = new Set([
  "BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "DOGE", "ADA", "TRX",
  "AVAX", "SHIB", "DOT", "LINK", "BCH", "NEAR", "POL", "LTC", "ICP", "UNI",
]);

// ---------- mandate extraction ----------

export function extractClaims(text) {
  if (!text) return [];
  const claims = [];
  const re = /([^.!?\n]*(?:never|only|always|no |not |max|maximum|cap|limit|top-?\d+|up to|within)[^.!?\n]*[.!?\n])/gi;
  let m;
  while ((m = re.exec(text))) {
    const c = m[1].trim();
    if (c.length > 8 && c.length < 200) claims.push(c);
    if (claims.length >= 12) break;
  }
  return claims;
}

export function parseMandate(claims) {
  const mandate = { claims: claims || [], whitelist: [], neverSell: false, maxSpendPct: null, topN: null };
  const all = (claims || []).join(" ");
  const upper = all.toUpperCase();

  // whitelist: "only trades ETH, USDC and BTC" / "only ETH and USDC"
  const wl = upper.match(/ONLY (?:TRADES?|BUYS?|SELLS?|SWAPS?|HOLDS?|TOUCHES?)? ?([A-Z0-9]{2,8}(?:[, ]+(?:AND )?[A-Z0-9]{2,8}){0,9})/);
  if (wl) {
    const syms = wl[1]
      .split(/[^A-Z0-9]+/)
      .filter((s) => s.length >= 2 && s.length <= 8 && s !== "AND" && !WHITELIST_STOPWORDS.has(s));
    for (const s of syms.slice(0, 12)) if (!mandate.whitelist.includes(s)) mandate.whitelist.push(s);
  }
  mandate.neverSell = /NEVER (SELL|DUMP|EXIT)/.test(upper);
  const maxPct = upper.match(/(?:MAX|MAXIMUM|CAP|LIMIT|NEVER (?:SPEND|RISK|USE|EXCEED)(?: MORE THAN| OVER)?)\s*(\d{1,3})\s*(?:%|PERCENT)/);
  if (maxPct) mandate.maxSpendPct = parseInt(maxPct[1], 10);
  const topN = upper.match(/TOP-?(\d{1,2})/);
  if (topN) mandate.topN = parseInt(topN[1], 10);
  return mandate;
}

// ---------- safety findings (wallet hygiene) ----------

export function safetyFindings({ approvals, txs, transfers, balance, address, scanComplete = true }) {
  const f = [];

  if (!approvals || approvals.length === 0) {
    f.push({
      level: "info",
      title: "No approvals found in the scanned window",
      detail: scanComplete
        ? "Vette found no ERC20/ERC721 Approval events owned by this wallet in the recent-block scan. Zero approval surface in the window."
        : "The approval scan did not complete — the absence of findings here is NOT evidence of safety.",
      evidence: { type: "wallet", value: address, label: "wallet" },
    });
    return f;
  }

  const open = approvals.filter((a) => a.value > 0n && a.spender && a.spender !== address);
  const closed = approvals.length - open.length;

  if (open.length === 0) {
    f.push({
      level: "info",
      title: "All scanned approvals are closed (allowance 0)",
      detail: `${closed} approval event(s) found in the scan window, none still open. This wallet has no active third-party spenders.`,
      evidence: { type: "wallet", value: address, label: "wallet" },
    });
    return f;
  }

  f.push({
    level: "info",
    title: `${open.length} live approval(s) found, ${closed} closed`,
    detail: `Of ${approvals.length} approval events indexed, ${open.length} still carry a non-zero allowance. Each one is a door someone else can open.`,
    evidence: { type: "wallet", value: address, label: "wallet" },
  });

  for (const a of open) {
    const unlimited = a.value >= MAX_UINT_BIG - (MAX_UINT_BIG / 1000n);
    const spenderShort = shortAddr(a.spender);
    const meta = a.spenderMeta || {};
    const known = meta.verified && !meta.scam;

    if (meta.scam) {
      f.push({
        level: "critical",
        title: `Live allowance to a scam-flagged contract (${spenderShort})`,
        detail: `Allowance of ${fmtUnits(a.value)} ${a.tokenSymbol || "tokens"} is open to ${meta.name || a.spender}, which Base explorers flag as scam. This is the signature of a drainer. Revoke immediately.`,
        evidence: { type: "tx", value: a.tx, label: "approval tx" },
        action: { type: "revoke", token: a.tokenAddr, spender: a.spender, spenderName: meta.name || null, tokenSymbol: a.tokenSymbol || null },
      });
      continue;
    }

    if (!known && a.value > 0n) {
      f.push({
        level: "danger",
        title: `Allowance open to unverified contract (${spenderShort})`,
        detail: `${fmtUnits(a.value)} ${a.tokenSymbol || "tokens"} approved to ${a.spender}, an unverified contract with no public source code. If it is ever compromised, it can move those funds with no further signature from you.`,
        evidence: { type: "tx", value: a.tx, label: "approval tx" },
        action: { type: "revoke", token: a.tokenAddr, spender: a.spender, spenderName: meta.name || null, tokenSymbol: a.tokenSymbol || null },
      });
      continue;
    }

    if (unlimited) {
      f.push({
        level: "warning",
        title: `Unlimited allowance to ${meta.name || spenderShort} (${fmtUnits(a.value)} ${a.tokenSymbol || "tokens"})`,
        detail: `Standard practice for DeFi, still a permanent risk surface: if ${meta.name || "this contract"} is ever exploited, the full balance is reachable. Vette recommends finite allowances.`,
        evidence: { type: "tx", value: a.tx, label: "approval tx" },
        action: { type: "revoke", token: a.tokenAddr, spender: a.spender, spenderName: meta.name || null, tokenSymbol: a.tokenSymbol || null },
      });
      continue;
    }

    if (a.value > 0n) {
      f.push({
        level: "info",
        title: `Bounded allowance to ${meta.name || spenderShort} (${fmtUnits(a.value)} ${a.tokenSymbol || "tokens"})`,
        detail: "Verified contract, capped allowance. Healthy hygiene.",
        evidence: { type: "tx", value: a.tx, label: "approval tx" },
      });
    }
  }

  // Outflow analysis: biggest ETH outflow vs. peak activity
  const outTxs = (txs || []).filter((t) => t.from === address && t.to && t.value > 0n);
  if (outTxs.length) {
    const totalOut = outTxs.reduce((s, t) => s + t.value, 0n);
    const maxSingle = outTxs.reduce((m, t) => (t.value > m.value ? t : m), outTxs[0]);
    const toScamOrUnknown = outTxs.find((t) => t.toScam || !t.toVerified);
    if (toScamOrUnknown && maxSingle.value > 0n) {
      f.push({
        level: "danger",
        title: `Large outflow to unverified contract (${fmtEth(maxSingle.value)})`,
        detail: `${fmtEth(maxSingle.value)} sent to ${toScamOrUnknown.toName || shortAddr(toScamOrUnknown.to)} in tx ${shortAddr(toScamOrUnknown.hash)}. ${toScamOrUnknown.toScam ? "That contract is scam-flagged." : "That contract is unverified — no public source."}`,
        evidence: { type: "tx", value: toScamOrUnknown.hash, label: "outflow tx" },
      });
    }
    const share = totalOut > 0n ? Number((maxSingle.value * 100n) / (totalOut + (balance || 0n) + 1n)) : 0;
    if (share > 80 && maxSingle.value > 0n) {
      f.push({
        level: "warning",
        title: `Concentrated outflow: one tx = ${share.toFixed(0)}% of tracked ETH movement`,
        detail: `${fmtEth(maxSingle.value)} left in a single transaction to ${maxSingle.toName || shortAddr(maxSingle.to)}. Concentration like this is worth explaining.`,
        evidence: { type: "tx", value: maxSingle.hash, label: "outflow tx" },
      });
    }
  }

  return f;
}

// ---------- mandate deviation findings ----------

export function deviationFindings({ transfers, address, mandate }) {
  const f = [];
  if (!mandate || (!mandate.whitelist.length && !mandate.neverSell && !mandate.topN && !mandate.maxSpendPct)) {
    return { findings: f, deviations: 0 };
  }
  const out = (transfers || []).filter((t) => t.from === address);

  if (mandate.whitelist.length) {
    const off = out.filter((t) => t.token !== "UNKNOWN" && !mandate.whitelist.includes(t.token));
    if (off.length) {
      const example = off[0];
      f.push({
        level: "danger",
        title: `Traded outside its own whitelist (${off.length} transfer(s))`,
        detail: `The mandate claims trading is limited to ${mandate.whitelist.join(", ")}, but the wallet moved ${example.token} (${fmtUnits(example.rawValue, example.decimals)} ${example.token}) to ${shortAddr(example.to)}. Behavior contradicts the stated mandate.`,
        evidence: { type: "tx", value: example.tx, label: "token transfer tx" },
      });
    }
  }

  if (mandate.neverSell) {
    if (out.length) {
      const example = out[0];
      f.push({
        level: "warning",
        title: `Outbound transfers despite a "never sell" mandate`,
        detail: `${out.length} outbound token transfer(s) indexed. The most recent sent ${fmtUnits(example.rawValue, example.decimals)} ${example.token} to ${shortAddr(example.to)}. Either the mandate or the behavior needs correcting.`,
        evidence: { type: "tx", value: example.tx, label: "transfer tx" },
      });
    }
  }

  if (mandate.topN) {
    const outside = out.filter((t) => t.token !== "UNKNOWN" && !TOP20.has(t.token));
    if (outside.length) {
      const example = outside[0];
      f.push({
        level: "warning",
        title: `Traded ${example.token} — outside the top-${mandate.topN} universe it claims`,
        detail: `A "top-${mandate.topN}" mandate should keep activity inside the top-${mandate.topN} assets by consensus ranking. ${example.token} is not in that set.`,
        evidence: { type: "tx", value: example.tx, label: "transfer tx" },
      });
    }
  }

  if (mandate.maxSpendPct != null) {
    const total = out.reduce((s, t) => s + (t.usd || 0), 0);
    const maxOne = out.reduce((m, t) => ((t.usd || 0) > (m?.usd || 0) ? t : m), null);
    if (maxOne && total > 0) {
      const pct = (maxOne.usd / total) * 100;
      if (pct > mandate.maxSpendPct) {
        f.push({
          level: "warning",
          title: `Single position = ${pct.toFixed(0)}% of tracked outbound value (mandate caps at ${mandate.maxSpendPct}%)`,
          detail: `The largest tracked outbound transfer (${maxOne.token}, ~$${maxOne.usd.toFixed(2)}) exceeds the stated ${mandate.maxSpendPct}% cap when measured against total tracked outbound value.`,
          evidence: { type: "tx", value: maxOne.tx, label: "transfer tx" },
        });
      }
    }
  }

  return { findings: f, deviations: f.length };
}

// ---------- scoring ----------

export function scoreFindings(findings) {
  let s = 100;
  for (const f of findings || []) s -= LEVELS[f.level] ?? 4; // ?? — info=0 must actually score 0
  return Math.max(0, Math.min(100, s));
}

export function verdictFrom(score, { addressFound }) {
  if (!addressFound) return "UNVERIFIABLE";
  if (score >= 80) return "COMPLIANT";
  if (score >= 55) return "DEVIATED";
  return "DANGEROUS";
}
