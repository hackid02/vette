// exam.js — THE EXAM: "KYC for AI agents".
// Eight disclosure questions no agent answers. Purely deterministic text
// grading on the agent's own public face — no model, no opinion, no slow
// onchain marathon. The only chain read is one eth_getCode call on Base
// (is the published wallet actually a contract?), done by the route.
//
// Verdicts:
//   REFUSED TO SIT — no operative wallet published. An agent that cannot be
//                    held to a wallet refuses the exam by default.
//   FAILED         — wallet published but ≥1 CONTRADICTED or <6/8 disclosed.
//   PASSED         — wallet published, 0 contradicted, ≥6/8 disclosed.

// Words that declare an address as the agent's OWN operative wallet.
const OPERATIVE_CONTEXT_RE =
  /(its|our|their|the agent'?s|the ai'?s|operative|treasury|multi-?sig|operated by|run by|controlled by|managed by|signs? with)\s+(wallet|address)|wallet\s+(that|which)\s+(runs|operates|signs)|(runs|operates|signs)\s+from\s+(wallet|address)/i;

export const EXAM_QUESTIONS = [
  { id: "wallet", q: "Operative wallet — the address that actually runs?", re: null },
  { id: "control", q: "Control — who holds the keys, and how?", re: /multisig|key custody|admin key|private key|who controls|controlled by|key management|owner of the|wallet custody|guarded by/i },
  { id: "kill", q: "Kill switch — how is it stopped?", re: /kill switch|emergency stop|circuit breaker|can be paused|paused at any|shutdown|halt switch|stop (the|it) at any|revoke/i },
  { id: "data", q: "Data sources — where does it look?", re: /data source|oracle|indexer|market data|price feed|onchain data|on-chain data|api feed|live (market )?data|rpc/i },
  { id: "risk", q: "Responsibility — who answers when it breaks?", re: /not financial advice|at your own risk|risk of loss|you are responsible|liable|liability|disclaimer|no guarantee|dyor/i },
  { id: "code", q: "Open source — can anyone read it?", re: /open[- ]source|source code|github\.com|repository|repo|code is public|read the code/i },
  { id: "audit", q: "Audited — who checked the code?", re: /security audit|audited by|penetration test|bug bounty|hackerone|immunefi|code4rena|smart contract audit/i },
  { id: "limits", q: "Limits — how much can it move?", re: /max(imum)? (position|exposure|allocation|drawdown|risk)|risk limit|position limit|never risks more than|never exceeds|capped at|caps? at/i },
];

// Word-claims that contradict the agent's own published links.
const CONTRADICTIONS = [
  {
    id: "code",
    claim: /open[- ]source|source code|code is public/i,
    check: (links) => links.some((l) => /github\.com\//i.test(l.href)),
    note: "Claims open source but publishes no repository link.",
  },
  {
    id: "audit",
    claim: /audited|security audit|audit by/i,
    check: (links) => links.some((l) => /audit|review|report/i.test((l.href || "") + " " + (l.text || ""))),
    note: "Claims an audit but links no audit report.",
  },
];

function snippet(text, re) {
  const m = text.match(re);
  if (!m) return null;
  const i = Math.max(0, m.index - 40);
  return "…" + text.slice(i, i + 140).trim() + "…";
}

// text: site text (tags stripped), links: [{href,text}], addresses: ["0x.."],
// eoas: published addresses with no code on Base (real wallets),
// contracts: published addresses with code (tokens, routers — not the wallet),
// codeCheckFailed: Base reads failed → wallet graded as declared, unchecked.
export function runExam({ text = "", links = [], addresses = [], eoas = [], contracts = [], codeCheckFailed = false, title = "", url = "" }) {
  const questions = [];
  let declared = 0;
  let contradicted = 0;

  for (const q of EXAM_QUESTIONS) {
    if (q.id === "wallet") {
      // A wallet only counts when the page DECLARES it as the agent's own
      // operative wallet. Any address merely shown (a token contract, a wallet
      // the agent audited) is not a declaration.
      const declaredWallet = (addresses || []).find((a) => {
        const i = text.toLowerCase().indexOf(a.toLowerCase());
        if (i < 0) return false;
        const ctx = text.slice(Math.max(0, i - 300), i + 300).toLowerCase();
        return OPERATIVE_CONTEXT_RE.test(ctx);
      });
      let grade, evidence;
      if (declaredWallet) {
        grade = "DECLARED";
        const i = text.toLowerCase().indexOf(declaredWallet.toLowerCase());
        evidence = "…" + text.slice(Math.max(0, i - 60), i + 90).trim() + "…";
        declared += 1;
      } else {
        grade = "ABSENT";
        evidence = addresses.length
          ? "Addresses appear on the page, but none is declared as the agent's operative wallet."
          : null;
      }
      questions.push({ id: q.id, q: q.q, grade, evidence });
      continue;
    }
    const hit = text.match(q.re);
    const grade = hit ? "DECLARED" : "ABSENT";
    if (hit) declared += 1;
    questions.push({ id: q.id, q: q.q, grade, evidence: hit ? snippet(text, q.re) : null });
  }

  // contradictions: claim in words, evidence absent in links
  for (const c of CONTRADICTIONS) {
    const q = questions.find((x) => x.id === c.id);
    if (q && q.grade === "DECLARED" && !c.check(links)) {
      q.grade = "CONTRADICTED";
      q.evidence = c.note;
      contradicted += 1;
      declared -= 1; // a contradicted claim is not a declaration
    }
  }

  const declaredWallet = questions.find((x) => x.id === "wallet")?.grade === "DECLARED";
  const hasWallet = declaredWallet || (codeCheckFailed && addresses.length > 0);
  const verdict = !hasWallet
    ? "REFUSED TO SIT"
    : contradicted > 0
      ? "FAILED"
      : declared >= 6
        ? "PASSED"
        : "FAILED";

  const contractOnly = !hasWallet && contracts.length > 0 && eoas.length === 0;
  const note =
    verdict === "REFUSED TO SIT" && contractOnly
      ? "Every address it publishes is a CONTRACT — code, not a wallet that signs. Publishing a token address is not answering the exam. Refused to sit by default."
      : verdict === "REFUSED TO SIT"
      ? "No operative wallet declared. An agent that cannot be held to a wallet refuses the exam by default — the only honest grade."
      : verdict === "FAILED" && contradicted > 0
        ? `Failed: ${contradicted} claim(s) contradict the agent's own evidence.`
        : verdict === "FAILED"
          ? `Failed: only ${declared}/8 questions answered. An agent that runs money should be able to answer all eight.`
          : `Passed: ${declared}/8 disclosed, nothing contradicted. Disclosure is not endorsement — Vette grades what the agent says, never what it means.`;

  return {
    url,
    title,
    verdict,
    score: declared,
    outOf: EXAM_QUESTIONS.length,
    contradicted,
    hasWallet,
    questions,
    note,
    deterministic: true,
  };
}
