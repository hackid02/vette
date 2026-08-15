// engine.js — VETTE's deterministic audit engine.
// Order of operations is sacred: deterministic checks FIRST, narration LAST.
// The engine never invents evidence. "Unverifiable" is a valid answer.

import {
  getBalance, getCode, getTxs, getTokenTransfers, getApprovalLogs,
  currentAllowance, getSmartContract, fetchSite, fmtEth, shortAddr,
  ageDays, EXPLORER_ADDR, EXPLORER_TX, APPROVAL_SCOPE,
} from "./providers";
import {
  extractClaims, parseMandate, safetyFindings, deviationFindings,
  scoreFindings, verdictFrom,
} from "./rules";
import { makeId, beginTrace, record, finishTrace, getTrace } from "./trace";

const MAX_APPROVALS_TO_PROBE = 8;

export async function runAudit({ url = null, address = null, claims = null } = {}) {
  const id = makeId();
  const target = url || address || "unknown";
  beginTrace(id, { target });

  const audit = {
    id,
    ts: new Date().toISOString(),
    target,
    url: null,
    address: null,
    site: null,
    claimsFound: [],
    mandate: null,
    wallet: null,
    findings: [],
    verdict: null,
    score: null,
    narrative: [],
    actions: [],
    traceId: id,
    notes: [],
  };

  // ---------- STEP 1: website (if given) ----------
  if (url) {
    const site = await fetchSite(url);
    record(id, "fetch_website", { url }, { ok: site.ok, status: site.status || null, title: site.title }, "Fetched the agent's website");
    audit.url = url;
    if (site.ok) {
      audit.site = {
        status: site.status,
        title: site.title,
        desc: site.desc,
        socials: site.socials,
        demo: site.demo,
        addresses: site.addresses,
      };
      audit.notes.push(`Website loads (HTTP ${site.status}${site.title ? ` — "${site.title.slice(0, 60)}"` : ""}).`);
      if (!address && site.addresses && site.addresses.length) {
        address = site.addresses[0];
        audit.notes.push(`No wallet provided — Vette took the first address published on the site (${shortAddr(address)}). The verdict below applies to THAT wallet, not to the website itself.`);
      }
      // claims from site text
      const found = extractClaims(site.text);
      if (found.length) {
        audit.claimsFound = found.slice(0, 6);
        record(id, "extract_claims", { source: url }, { count: found.length, sample: found[0] }, "Pulled stated claims from the site's own copy");
      }
    } else {
      audit.notes.push(`Website could not be fetched: ${site.error}. Onchain checks will still run.`);
    }
  }

  // claims explicitly provided by the user win over site text
  if (claims) {
    audit.claimsFound = [claims];
  }

  // ---------- STEP 2: onchain snapshot ----------
  if (address) {
    address = address.toLowerCase();
    audit.address = address;

    // each source fetched independently — one slow endpoint must not kill the audit
    const grab = async (name, fn) => {
      try {
        return await fn();
      } catch (e) {
        record(id, name, { address }, { error: String(e.message || e) }, "source failed — audit continues without it");
        audit.notes.push(`${name} failed (${String(e.message || e).slice(0, 80)}) — the audit continues on the remaining sources.`);
        return null;
      }
    };

    const [balance, code, txs, transfers, logs] = await Promise.all([
      grab("rpc_balance", async () => {
        const b = await getBalance(address);
        record(id, "rpc_balance", { address }, { wei: b.toString() }, "ETH balance via Base RPC");
        return b;
      }),
      grab("rpc_code", async () => {
        const c = await getCode(address);
        record(id, "rpc_code", { address }, { bytecodeBytes: (c?.length - 2) / 2 }, "Is the wallet a contract?");
        return c;
      }),
      grab("explorer_transactions", async () => {
        const t = await getTxs(address);
        record(id, "explorer_transactions", { address }, { count: t.length }, "Wallet transaction history (indexed page)");
        return t;
      }),
      grab("explorer_token_transfers", async () => {
        const t = await getTokenTransfers(address);
        record(id, "explorer_token_transfers", { address }, { count: t.length }, "ERC20/721/1155 transfer history");
        return t;
      }),
      grab("explorer_approval_logs", async () => {
        const l = await getApprovalLogs(address);
        record(id, "explorer_approval_logs", { address }, { count: l.length }, "Approval events (the attack surface)");
        return l;
      }),
    ]);

    const isContract = (code || "0x") !== "0x" && code !== "0x";
    txs = txs || [];
    transfers = transfers || [];
    logs = logs || [];
    balance = balance || 0n;

    // probe live allowances for open approvals (owner = the wallet itself)
    const open = (logs || [])
      .filter((l) => l.value > 0n && l.spender && l.owner === address && l.spender !== address)
      .slice(0, MAX_APPROVALS_TO_PROBE);
    const probed = [];
    for (const l of open) {
      const [allow, meta] = await Promise.all([
        currentAllowance(l.tokenAddr, address, l.spender).then((v) => {
          record(id, "rpc_allowance", { token: l.tokenAddr, owner: address, spender: l.spender }, { allowance: v.toString() }, "Live allowance read onchain");
          return v;
        }),
        getSmartContract(l.spender).then((m) => {
          record(id, "explorer_contract_meta", { address: l.spender }, { name: m?.name || null, verified: m?.verified || false, scam: m?.scam || false }, "Spender contract reputation");
          return m;
        }),
      ]);
      probed.push({
        ...l,
        value: allow, // live allowance, not the event value
        spenderMeta: meta || {},
        tokenSymbol: (transfers || []).find((t) => t.tokenAddr?.toLowerCase() === (l.tokenAddr || "").toLowerCase())?.token || null,
      });
    }

    audit.wallet = {
      address,
      isContract,
      balanceEth: fmtEth(balance),
      txCount: txs.length,
      transferCount: transfers.length,
      approvalEvents: logs.length,
      openApprovals: probed.filter((p) => p.value > 0n).length,
      firstSeenDaysAgo: txs.length ? ageDays(txs[txs.length - 1]?.ts) : null,
      lastActiveDaysAgo: txs.length ? ageDays(txs[0]?.ts) : null,
    };
    audit.notes.push(
      `Approval scan scope: the most recent ~${APPROVAL_SCOPE.APPROVAL_WINDOWS * APPROVAL_SCOPE.LOG_WINDOW} blocks of Approval events owned by this wallet, plus live allowance probes. Older approvals beyond that window are not claimed either way.`
    );

    // ---------- STEP 3: rules ----------
    audit.mandate = parseMandate(audit.claimsFound);
    const safety = safetyFindings({ approvals: probed, txs, transfers, balance, address });
    const dev = deviationFindings({ transfers, address, mandate: audit.mandate });
    audit.findings = [...safety, ...dev.findings];
    if (isContract) {
      audit.findings.unshift({
        level: "warning",
        title: "Published wallet is a CONTRACT, not a standard EOA wallet",
        detail: "The address on this agent's page has bytecode deployed. Most agent wallets are EOAs. If the agent claims this is its trading wallet, verify what the contract actually is and who controls it — publishing a token or protocol contract as 'the wallet' is a common disclosure miss.",
        evidence: { type: "wallet", value: address, label: "contract code" },
      });
    }
    record(id, "rule_engine", { approvalsProbed: probed.length, txs: txs.length, transfers: transfers.length }, { findings: audit.findings.length }, "Deterministic rules applied to raw evidence");
  } else {
    audit.notes.push("No wallet address found or provided — onchain checks skipped. Site-level checks only.");
  }

  // ---------- STEP 4: verdict ----------
  const hasActivity = !!audit.wallet && (audit.wallet.txCount > 0 || audit.wallet.transferCount > 0 || audit.wallet.approvalEvents > 0);
  if (audit.address && !hasActivity && audit.findings.length === 0) {
    audit.notes.push(
      "This wallet has NO indexed activity — no transactions, no transfers, no approvals. Behavior cannot be audited from an empty ledger, so Vette will not call it compliant. It is UNPROVEN."
    );
    audit.findings.push({
      level: "info",
      title: "Empty ledger — behavior unproven",
      detail: "Zero onchain activity found for this wallet. A wallet that has never acted can neither prove nor break its mandate. Treat the agent's claims as untested until the operative wallet acts — or until the agent publishes the wallet that actually runs.",
      evidence: { type: "wallet", value: audit.address, label: "wallet" },
    });
  }
  audit.score = audit.findings.length ? scoreFindings(audit.findings) : audit.address ? 100 : null;
  if (audit.address && !hasActivity) {
    audit.verdict = "UNVERIFIABLE";
    audit.score = null;
  } else {
    audit.verdict = verdictFrom(audit.score ?? 0, {
      addressFound: !!audit.address,
      anyEvidence: audit.findings.length > 0 || !!audit.wallet,
    });
  }

  // ---------- STEP 5: narration (template today; LLM-hook ready) ----------
  audit.narrative = buildNarrative(audit);
  audit.actions = buildActions(audit);
  record(id, "narrate", { findings: audit.findings.length, score: audit.score }, { verdict: audit.verdict }, "Verdict written, every sentence citing a check above");

  finishTrace(id, { verdict: audit.verdict, score: audit.score });
  // embed the receipt in the response so it survives serverless deployments
  audit.trace = getTrace(id)?.steps || [];
  return audit;
}

function buildNarrative(a) {
  const lines = [];
  lines.push(`VETTE verdict: ${a.verdict}${a.score != null ? ` — ${a.score}/100` : ""}.`);
  if (a.url) lines.push(`Target: ${a.url}${a.address ? ` (wallet ${shortAddr(a.address)})` : ""}.`);
  else if (a.address) lines.push(`Target wallet: ${a.address}.`);

  if (a.notes.length) lines.push(...a.notes);

  if (a.wallet) {
    lines.push(
      `Onchain snapshot: ${a.wallet.txCount} indexed transaction(s), ${a.wallet.transferCount} token transfer(s), ${a.wallet.approvalEvents} approval event(s) — ${a.wallet.openApprovals} still open. Balance ${a.wallet.balanceEth}.`
    );
  }

  if (a.claimsFound.length) {
    lines.push(
      a.mandate && (a.mandate.whitelist.length || a.mandate.neverSell || a.mandate.topN || a.mandate.maxSpendPct)
        ? `Mandate extracted from the agent's own words — ${a.claimsFound[0].slice(0, 110)}${a.claimsFound[0].length > 110 ? "…" : ""}`
        : `The agent's copy made ${a.claimsFound.length} claim(s), none of which constrain onchain behavior in a checkable way.`
    );
  }

  if (a.findings.length === 0) {
    lines.push("No negative findings. Either the wallet is clean, or the evidence is too thin to judge — check the trace to see exactly what was examined.");
  } else {
    const crit = a.findings.filter((f) => f.level === "critical").length;
    const dang = a.findings.filter((f) => f.level === "danger").length;
    lines.push(
      `Findings: ${crit} critical, ${dang} dangerous, ${a.findings.filter((f) => f.level === "warning").length} warning(s), ${a.findings.filter((f) => f.level === "info").length} informational.`
    );
    const top = a.findings.find((f) => f.level === "critical" || f.level === "danger") || a.findings[0];
    lines.push(`The decision turns on: ${top.title} — ${top.detail}`);
  }

  if (!a.address) lines.push("Vette never invents evidence: with no wallet published, onchain claims are UNVERIFIABLE by design.");
  lines.push("Every claim above traces to a step in the trace. Nothing here is an opinion that cannot be followed back to a tool call.");
  return lines;
}

function buildActions(a) {
  const actions = [];
  for (const f of a.findings) {
    if (f.action && f.action.type === "revoke" && !actions.some((x) => x.spender === f.action.spender && x.token === f.action.token)) {
      actions.push({
        type: "revoke",
        token: f.action.token,
        spender: f.action.spender,
        spenderName: f.action.spenderName || null,
        tokenSymbol: f.action.tokenSymbol || null,
        label: `Revoke allowance to ${f.action.spenderName || shortAddr(f.action.spender)} (${f.action.tokenSymbol || "token"})`,
      });
    }
  }
  if (!a.address) {
    actions.push({ type: "info", label: "Publish a wallet address (or link one) so Vette can run onchain checks." });
  }
  if (a.address && a.wallet && a.wallet.openApprovals === 0 && a.verdict === "COMPLIANT") {
    actions.push({ type: "info", label: "Nothing to revoke. Re-run Vette after any new approval to keep the streak." });
  }
  return actions.slice(0, 6);
}

// ---------- small helpers for UI ----------

export function txLink(hash) {
  return EXPLORER_TX + hash;
}

export function addrLink(addr) {
  return EXPLORER_ADDR + addr;
}
