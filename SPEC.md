# VETTE 🛡️ — The Agent That Vets Agents

> **Contest:** Orion Builder Hackathon · Deadline Sept 2, 2026 23:59 UTC
> **Builder:** Oluwaseyifunmi (registered)
> **Category:** Autonomous safety + action agent (Base)

---

## 1. The One-Liner

**Every agent makes promises. Vette checks — and when something's wrong, Vette fixes it.**

Every other entry in the contest tells you what's wrong. Vette is the only one that *acts*.

---

## 2. The Problem (why this is important)

1. AI agents are about to control real money — trading, posting, moving funds.
2. The moment an agent touches a wallet, one question matters: **"Is it doing what it promised?"**
3. Nobody answers that question. Orion itself vets *submissions*, but nobody vets *behavior*.
4. Meanwhile, wallets are exposed: live approvals sit forever, worth millions in aggregate. (Reference: a single wallet was found with $1,293 reachable through 19 live approvals.)
5. A rogue, buggy, or compromised agent doesn't send a warning — it just drains.

**Vette is the answer to all three: behavior audits, live guard, one-click kill.**

---

## 3. What Vette Does — Three Moves

### ① AUDIT — vet any agent against its own promises
- Input: an agent's Orion page / website / X profile / wallet address.
- Vette extracts the agent's **stated mandate** ("I only trade top-20 tokens", "never spends >10% of wallet", "never produces untraceable numbers").
- Vette pulls the agent's **actual onchain behavior**: decoded approves, transfers, swaps, outflows.
- Verdict: ✅ **COMPLIANT** · ⚠️ **DEVIATED** · 🚨 **DANGEROUS** — with a score, evidence list, and a public trace showing every check behind every claim.
- Hard rule: **no claim without a decoded transaction behind it.** "Unverifiable" is a valid verdict when a wallet isn't published. Vette never invents evidence.

### ② GUARD — watch your wallet like a bodyguard
- Continuous monitoring of a connected (or manually entered) wallet on Base.
- Detects: new approvals to unverified contracts, suspicious spenders, unusual outflows, drainer patterns, dormant-but-dangerous approvals.
- Every alert in plain English: what happened, what's at risk, how dangerous, what to do.
- No code, no charts to decode — a sentence + a button.

### ③ KILL — one-click revoke, onchain
- The 10/10 move. Vette doesn't hand you a scary list and walk away.
- One click → wallet signature → the approval is revoked live on Base → tx hash on screen.
- "Every other entry tells you what's wrong. Vette fixes it."

---

## 4. Why It Scores 10/10 Territory on the Judges' Rubric

| Criterion | Argument |
|---|---|
| **Usefulness** | Agent risk is the #1 open question in the judges' own industry (exchange execs from WEEX, BingX, Up10, HuoStarter, Noah AI, Pivot). Every Base wallet holder is a potential user. Not a niche. |
| **Execution** | Standard, well-documented Base stack (RPC, tx decoding, wallet connect, revoke tx). Deterministic engine → LLM narration → live trace: the exact architecture that scored 86/100 at the top of the leaderboard. |
| **Originality** | Zero overlap: BaseScout analyzes tokens, Rigel analyzes wallets. Nobody audits *agents*, and nobody in the contest *acts*. Agent-audits-agent + one-click defense is untouched. |

### Judge script (the pitch in one breath)
> "AI agents are about to control billions. When one goes rogue or gets compromised, who checks? Vette audits any agent against its own promises, guards your wallet around the clock, and kills dangerous approvals with one click. Every other entry describes problems. Vette ends them."

---

## 5. The Demo (10 seconds, unforgettable)

1. Show a wallet with live, dangerous approvals (pre-computed).
2. Vette flags them in plain English with severity scores.
3. One click → signature → revoke confirmed **live on Base mainnet** → tx hash displayed.
4. Bonus: run an audit on a *live contest entry's* published wallet behavior for the "referee" moment.

Demo never 500s: pre-computed gallery + cached results + fresh runs on demand.

---

## 6. Architecture (winning formula)

```
Input (URL / wallet / agent name)
        │
        ▼
DETERMINISTIC ENGINE  (always runs first)
├─ fetch website, demo, X, GitHub  → liveness checks
├─ extract stated mandate (from public text)
├─ Base RPC: decoded txs, approvals, spenders, outflows
├─ rule engine: deviation from mandate, danger heuristics
        │
        ▼
LLM NARRATION  (never invents facts)
├─ writes the verdict + plain-English explanation
├─ every sentence cites a real check/tx
        │
        ▼
PUBLIC TRACE PAGE
└─ every tool call, every tx hash, every claim → evidence
```

**Golden rule:** the model chooses where to look; the engine decides what's true.

---

## 7. Product Positioning

- Not a cop. A referee. A trust badge.
- Honest builders *want* to be Vette-audited → "**Vette-verified**" as a marketing asset.
- Tone: calm, precise, a little sharp. *"Trust, but verified."*

---

## 8. Delivery Checklist (contest requirements)

- [x] Wallet registered (Oluwaseyifunmi)
- [ ] Website (we build)
- [ ] X profile (you create)
- [ ] GitHub repo (we scaffold)
- [ ] Discord or Telegram link (you create — free, 10 min)
- [ ] Demo link (the website IS the demo)
- [ ] ~$10 ETH ignition fee at submission (you pay)
- [ ] Submit before Sept 2, 23:59 UTC — target: ship ~Aug 25 to farm upvotes

---

## 9. Timeline (19 days)

| Days | Deliverable |
|---|---|
| 1–3 | App scaffold: Next.js + Base RPC + tx decoding |
| 4–6 | Audit engine + verdict writer + trace page |
| 7–9 | Guard mode + one-click revoke (wallet connect + revoke tx) |
| 10–12 | Landing page, demo video, GitHub README, X/Discord copy |
| 13 | **SUBMIT** |
| 13–19 | Buffer: upvote campaign, fixes from feedback |

---

## 10. Open Questions

1. Builder coding skills / languages (drives build split).
2. Final name lock: **VETTE** ✅
3. Demo target: a famous Base agent vs. a live contest entry — decide at demo time.
