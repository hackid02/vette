// engine.js — VETTE's deterministic audit engine.
// Order of operations is sacred: deterministic checks FIRST, narration LAST.
// The engine never invents evidence. "Unverifiable" is a valid answer.
// Honesty invariants (audited 2026-08-16):
//   1. A FAILED scan is never presented as clean — incomplete evidence = UNVERIFIABLE.
//   2. Deviation findings run ONLY on a mandate the user explicitly supplied.
//   3. An empty ledger is UNPROVEN, never COMPLIANT.
//   4. Every number is labeled with what it counts (e.g. "top N probed").

import {
  getBalance, getCode, getTxs, getTokenTransfers, getApprovalLogs,
  currentAllowance, getSmartContract, fetchSite, fmtEth, shortAddr,
  EXPLORER_ADDR, EXPLORER_TX, APPROVAL_SCOPE,
} from "./providers";
import {
  extractClaims, parseMandate, safetyFindings, deviationFindings,
  scoreFindings, verdictFrom,
} from "./rules";
import { makeId, beginTrace, record, finishTrace, getTrace } from "./trace";
import { llmConfigured, narrateWithLlm } from "./llm";

const MAX_APPROVALS_TO_PROBE = 8;

export async function runAudit({
  url = null,
  address = null,
  claims = null,
  mandateExplicit = false,
} = {}) {
  const id = makeId();
  const target = url || address || "unknown";
  beginTrace(id, { target });

  // Policy (audited v3): ONLY a wallet explicitly declared by the caller gets
  // an onchain verdict. Addresses found in site copy are disclosed, never
  // audited as the agent's wallet — a site can publish a treasury, a partner,
  // or a contract, and none of them are the wallet unless the owner says so.

  const audit = {
    id,
    ts: new Date().toISOString(),
    target,
    url: null,
    address: null,
    site: null,
    claimsFound: [],
    mandate: null,
    mandateExplicit: !!(mandateExplicit && claims),
    wallet: null,
    findings: [],
    verdict: null,
    score: null,
    narrative: [],
    actions: [],
    traceId: id,
    notes: [],
    scanComplete: null, // null = no wallet; true/false once scanned
    narrationBy: "engine",
    scopeLabel: `recent ~${APPROVAL_SCOPE.APPROVAL_WINDOWS * APPROVAL_SCOPE.LOG_WINDOW} blocks + live allowance probes`,
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
        audit.publishedAddresses = site.addresses.slice(0, 5);
        audit.publishedAddressCount = site.addresses.length;
        audit.notes.push(
          `No wallet declared. The site publishes ${site.addresses.length} address(es), starting with ${shortAddr(site.addresses[0])}. Published addresses are NOT audited as the agent's wallet — paste one into the wallet field to run onchain checks.`
        );
        record(id, "publish_note", { count: site.addresses.length }, { first: site.addresses[0] }, "Published addresses disclosed — not audited as a wallet");
      }
      // claims from site copy are stored for display — they never trigger
      // deviation findings (see rule below: deviations need an explicit mandate)
      const found = extractClaims(site.text);
      if (found.length) {
        audit.claimsFound = found.slice(0, 6);
        record(id, "extract_claims", { source: url }, { count: found.length, sample: found[0] }, "Pulled stated claims from the site's own copy (display only)");
      }
    } else {
      audit.notes.push(`Website could not be fetched: ${site.error}. Onchain checks will still run.`);
    }
  }

  // claims explicitly provided by the user are the ONLY basis for deviation rulings
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

    let balance, code, txs, transfers, scan;

    [balance, code, txs, transfers, scan] = await Promise.all([
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
        const r = await getApprovalLogs(address);
        record(id, "explorer_approval_logs", { address }, { count: r.logs.length, complete: r.complete }, r.complete ? "Approval events scanned (the attack surface)" : "Approval scan INCOMPLETE — partial evidence only");
        return r;
      }),
    ]);

    const isContract = (code || "0x") !== "0x" && code !== "0x";

    // all data sources dead = we cannot say anything true about this wallet.
    // Computed BEFORE coercion so nulls are detectable.
    const allSourcesDead = txs === null && transfers === null && scan === null;
    audit.allSourcesDead = allSourcesDead;

    txs = txs || [];
    transfers = transfers || [];
    const logs = scan?.logs || [];
    audit.scanComplete = scan?.complete === true;
    balance = balance || 0n;

    if (allSourcesDead) {
      audit.notes.push("Every data source failed for this wallet — Vette cannot say anything true about it, so the verdict is UNVERIFIABLE.");
    }

    // probe live allowances for open approvals (owner = the wallet itself)
    const open = logs
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

    const probedOpen = probed.filter((p) => p.value > 0n);
    const moreThanProbed = logs.filter(
      (l) => l.value > 0n && l.spender && l.owner === address && l.spender !== address
    ).length > MAX_APPROVALS_TO_PROBE;

    audit.wallet = {
      address,
      isContract,
      balanceEth: fmtEth(balance),
      txCount: txs.length,
      transferCount: transfers.length,
      approvalEvents: logs.length,
      openApprovals: probedOpen.length,
      openApprovalsCapped: moreThanProbed,
      lastActiveDaysAgo: txs.length ? Math.max(0, Math.round((Date.now() - txs[0].ts) / 86400000)) : null,
    };
    audit.notes.push(
      `Approval scan scope: the most recent ~${APPROVAL_SCOPE.APPROVAL_WINDOWS * APPROVAL_SCOPE.LOG_WINDOW} blocks of Approval events owned by this wallet, plus live allowance probes. Older approvals beyond that window are not claimed either way.`
    );

    // ---------- STEP 3: rules ----------
    // Deviations ONLY from an explicit user mandate. Site copy and contest
    // descriptions are displayed, never ruled on — marketing words are not a mandate.
    audit.mandate = audit.mandateExplicit ? parseMandate(audit.claimsFound) : { claims: audit.claimsFound, whitelist: [], neverSell: false, maxSpendPct: null, topN: null, note: "No explicit mandate supplied — deviation checks skipped." };
    const safety = safetyFindings({ approvals: probed, txs, transfers, balance, address, scanComplete: audit.scanComplete });
    const dev = audit.mandateExplicit ? deviationFindings({ transfers, address, mandate: audit.mandate }) : { findings: [] };
    audit.findings = [...safety, ...dev.findings];
    if (isContract) {
      // a contract explicitly declared by the caller may be a multisig/smart
      // wallet — flagged, but audited normally since the owner declared it.
      audit.findings.unshift({
        level: "warning",
        title: "Declared wallet is a CONTRACT, not a standard EOA wallet",
        detail: "The address has bytecode deployed. Most agent wallets are EOAs. If this is claimed as a trading wallet, verify what the contract actually is and who controls it.",
        evidence: { type: "wallet", value: address, label: "contract code" },
      });
    }
    record(id, "rule_engine", { approvalsProbed: probed.length, txs: txs.length, transfers: transfers.length }, { findings: audit.findings.length }, "Deterministic rules applied to raw evidence");
  } else {
    audit.notes.push("No wallet address declared — onchain checks skipped. Site-level checks only.");
    // Published-address disclosure: if the first published address is a
    // CONTRACT, name the disclosure miss (the BaseScout catch). No wallet
    // verdict is ever issued from a published address.
    if (audit.publishedAddresses && audit.publishedAddresses.length) {
      const first = audit.publishedAddresses[0];
      try {
        const code = await getCode(first);
        record(id, "rpc_code_published", { address: first }, { bytecodeBytes: (code?.length - 2) / 2 }, "Is the first published address a contract?");
        if (code && code !== "0x") {
          audit.findings.push({
            level: "warning",
            title: "The only address on the agent's page is a CONTRACT, not a wallet",
            detail: "No wallet was declared, and the address the site publishes has bytecode deployed — a token or protocol contract, not a wallet. A published address is not an auditable wallet, so no wallet verdict is issued. This is the disclosure miss itself.",
            evidence: { type: "wallet", value: first, label: "published contract" },
          });
        }
      } catch {
        // code check failed — no claim either way
      }
    }
  }

  // ---------- STEP 4: verdict ----------
  const hasActivity = !!audit.wallet && (audit.wallet.txCount > 0 || audit.wallet.transferCount > 0 || audit.wallet.approvalEvents > 0);
  const substantive = audit.findings.filter((f) => f.level !== "info");

  if (audit.address && !audit.scanComplete && !audit.allSourcesDead) {
    audit.notes.push(
      "The approval scan did not complete (public RPC limits). Vette will not call a wallet safe on partial evidence — the safety verdict is UNVERIFIABLE."
    );
    audit.findings.push({
      level: "warning",
      title: "Approval scan incomplete — safety unverified",
      detail: "The windowed approval scan could not complete against public RPCs. This wallet may still hold older approvals Vette could not see. Treat the safety verdict as unknown, not clean.",
      evidence: { type: "wallet", value: audit.address, label: "wallet" },
    });
  }

  if (audit.address && !hasActivity && substantive.length === 0 && audit.scanComplete) {
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

  const brokenEvidence =
    !audit.address ||
    (audit.wallet && !audit.scanComplete) ||
    audit.allSourcesDead ||
    (audit.address && !hasActivity && substantive.length === 0);

  audit.score = substantive.length ? scoreFindings(substantive) : audit.address ? 100 : null;
  if (brokenEvidence) {
    audit.verdict = "UNVERIFIABLE";
    audit.score = null;
  } else {
    audit.verdict = verdictFrom(audit.score ?? 0, { addressFound: !!audit.address });
  }

  // ---------- STEP 5: narration ----------
  audit.narrative = buildNarrative(audit);
  audit.actions = buildActions(audit);
  // optional model narration — the engine's numbers never change, only the words
  if (llmConfigured()) {
    const modelLines = await narrateWithLlm(audit);
    if (modelLines && modelLines.length) {
      audit.narrative = modelLines;
      audit.narrationBy = "model";
      record(id, "narrate_llm", { findings: audit.findings.length }, { lines: modelLines.length }, "Model wrote the narrative from engine facts (numbers unchanged)");
    }
  }
  record(id, "narrate", { findings: audit.findings.length, score: audit.score }, { verdict: audit.verdict }, "Verdict written, every sentence citing a check above");

  finishTrace(id, { verdict: audit.verdict, score: audit.score });
  // embed the receipt in the response so it survives serverless deployments
  audit.trace = getTrace(id)?.steps || [];
  return audit;
}

function buildNarrative(a) {
  const lines = [];
  lines.push(`VETTE verdict: ${a.verdict}${a.score != null ? ` — ${a.score}/100` : ""}${a.scopeLabel && a.wallet ? ` (scope: ${a.scopeLabel})` : ""}.`);
  if (a.url) lines.push(`Target: ${a.url}${a.address ? ` (wallet ${shortAddr(a.address)})` : ""}.`);
  else if (a.address) lines.push(`Target wallet: ${a.address}.`);

  if (a.notes.length) lines.push(...a.notes);

  if (a.wallet) {
    lines.push(
      `Onchain snapshot: ${a.wallet.txCount} indexed transaction(s), ${a.wallet.transferCount} token transfer(s), ${a.wallet.approvalEvents} approval event(s) — ${a.wallet.openApprovals} still open${a.wallet.openApprovalsCapped ? " (cap reached: at least this many)" : ""}. Balance ${a.wallet.balanceEth}.`
    );
  }

  if (a.claimsFound.length) {
    lines.push(
      a.mandateExplicit
        ? `Mandate supplied explicitly — ${a.claimsFound[0].slice(0, 110)}${a.claimsFound[0].length > 110 ? "…" : ""}`
        : `The agent's copy made ${a.claimsFound.length} claim(s). Marketing words are displayed, never ruled on — deviations only run on a mandate you supply yourself.`
    );
  }

  if (a.findings.length === 0) {
    lines.push("No findings. Either the wallet is clean, or the evidence is too thin to judge — check the receipt to see exactly what was examined.");
  } else {
    const crit = a.findings.filter((f) => f.level === "critical").length;
    const dang = a.findings.filter((f) => f.level === "danger").length;
    lines.push(
      `Findings: ${crit} critical, ${dang} dangerous, ${a.findings.filter((f) => f.level === "warning").length} warning(s), ${a.findings.filter((f) => f.level === "info").length} informational.`
    );
    const top = a.findings.find((f) => f.level === "critical" || f.level === "danger") || a.findings[0];
    lines.push(`The decision turns on: ${top.title} — ${top.detail}`);
  }

  if (!a.address) lines.push("Vette never invents evidence: with no wallet declared, onchain claims are UNVERIFIABLE by design.");
  lines.push("Every claim above traces to a step in the receipt. Nothing here is an opinion that cannot be followed back to a tool call.");
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
