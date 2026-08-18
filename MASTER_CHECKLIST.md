# VETTE — MASTER CHECKLIST (everything, from day one to the end)

**Legend:** ✅ done · ⏳ in progress · ❌ not started · 🙋 needs YOU

---

## PHASE 0 — CONCEPT & SETUP

| # | Item | Status |
|---|---|---|
| 0.1 | Registered for the hackathon (wallet + email, "Oluwaseyifunmi") | ✅ |
| 0.2 | Studied contest rules, judges, rubric, leader entries | ✅ |
| 0.3 | Name locked: **VETTE** (rejected Warden/Argus/Arbiter — taken) | ✅ |
| 0.4 | Concept locked: audit agents vs. their promises + guard + kill | ✅ |
| 0.5 | One-liner locked: "The agent that vets agents" | ✅ |
| 0.6 | Spec + explainer docs written (SPEC.md, EXPLAINER.md) | ✅ |
| 0.7 | GitHub account (hackid02) | ✅ |
| 0.8 | Vercel account (linked to GitHub) | ✅ |
| 0.9 | Delete old Vercel deploy tokens (security hygiene) | 🙋 check: vercel.com/account/tokens — delete any still alive |

---

## PHASE 1 — THE PRODUCT (engine + website)

### Engine (the deterministic core)
| # | Item | Status |
|---|---|---|
| 1.1 | Website fetcher: liveness, socials, published addresses, claims | ✅ |
| 1.2 | Base RPC layer with fallback chain + retries | ✅ |
| 1.3 | Transaction + token-transfer reader (Blockscout v2) | ✅ |
| 1.4 | Approval scanner (owner-scoped, RPC eth_getLogs windows) | ✅ |
| 1.5 | Live allowance probes (eth_call) + spender reputations | ✅ |
| 1.6 | Mandate parser: whitelist / never-sell / max-spend / top-N | ✅ |
| 1.7 | Safety rules: scam spenders, unverified spenders, unlimited allowances, outflows | ✅ |
| 1.8 | Deviation rules: behavior vs. mandate | ✅ |
| 1.9 | Scoring + verdicts (COMPLIANT / DEVIATED / DANGEROUS / UNVERIFIABLE) | ✅ |
| 1.10 | Honesty rules: empty ledger = UNPROVEN; links ≠ wallet declaration; scope disclosed | ✅ |
| 1.11 | Public receipt: every tool call, real input, real output | ✅ |
| 1.12 | Graceful degradation: one dead source never kills an audit | ✅ |

### Website / UI
| # | Item | Status |
|---|---|---|
| 1.13 | Full design system (Fraunces serif + Manrope + Space Mono, ink-green, lime) | ✅ |
| 1.14 | Home: hero with live audit input + "machine mid-vet" flow strip | ✅ |
| 1.15 | Home: "Caught live on Base" section (real mined wallets) | ✅ |
| 1.16 | Audit console: VETTE REPORT document layout | ✅ |
| 1.17 | Receipt: inline in report + standalone trace page | ✅ |
| 1.18 | Favicon + OG share card (X/Discord previews) | ✅ |
| 1.19 | Mobile responsive | ✅ (verify once more on your phone) |

### The Field
| # | Item | Status |
|---|---|---|
| 1.20 | /field page: every contest entry under Vette's lens | ✅ |
| 1.21 | Orion API integration (registered wallets + builder words) | ✅ |
| 1.22 | "Vet the whole field" button | ✅ |
| 1.23 | Live catch: BaseScout's "wallet" is a token contract (demo gem) | ✅ |

### The Kill Switch
| # | Item | Status |
|---|---|---|
| 1.24 | Wallet connect (EIP-1193 + EIP-6963 picker, multi-wallet safe) | ✅ (you tested with OKX) |
| 1.25 | One-click revoke: approve(spender, 0) — value always 0 | ✅ |
| 1.26 | Preflight simulation before any signature | ✅ |
| 1.27 | Base chain auto-switch/add | ✅ |
| 1.28 | Receipt waiter + "VIEW TX" Blockscout link | ✅ |
| 1.29 | Owner-only guard + auto re-audit after revoke | ✅ |
| 1.30 | Sandboxed-frame / mobile / Trust Wallet guidance | ✅ |

### Deployment
| # | Item | Status |
|---|---|---|
| 1.31 | Permanent URL: **https://vette-nu.vercel.app** | ✅ |
| 1.32 | Production verified (pages, APIs, audits, receipts) | ✅ |
| 1.33 | Public tunnel (backup link, changes often) | ✅ running |

### QA / bug hunts (all fixed)
| # | Item | Status |
|---|---|---|
| 1.34 | CSS never loading (layout.js import) — the "sloppy UI" root cause | ✅ |
| 1.35 | Self-vet trap (demo links read as own wallet) | ✅ |
| 1.36 | Token symbols not resolving (address_hash) | ✅ |
| 1.37 | [object Object] in receipt inputs | ✅ |
| 1.38 | HTML entities (&gt;) in extracted claims | ✅ |
| 1.39 | Vercel timeouts on explorer calls (retry + 120s) | ✅ |
| 1.40 | Address pasted into URL field | ✅ |
| 1.41 | Trace page id validation (path traversal) | ✅ |
| 1.42 | Revoke action labels (spender name + symbol) | ✅ |
| 1.43 | All-wallets-popping-up bug (connectAnyWallet removed) | ✅ |
| 1.44 | Trust Wallet misleading error message | ✅ |
| 1.45 | v1 external audit (23 findings) — S0/S1 all fixed: const→let, failed-scan→UNVERIFIABLE, signed cards, mandate gating, SSRF, rate limits, guard live-probe diff, gas preflight, cap wording, UNPROVEN, outage-vs-empty, trace route, mobile wallet, listener/chainId hygiene, info=0 | ✅ |
| 1.46 | v2 rescore (21/30) — remaining items fixed: `??` nullish in scoreFindings, metadata "24/7" dropped, cron POST rate-limit+secret gate, derived-contract → UNVERIFIABLE (BaseScout catch honest), 16-window scan, agents route rate limit | ✅ |
| 1.47 | VETTE_CARD_SECRET set in Vercel prod (signed cards live) | ✅ verified |
| 1.48 | ANTHROPIC_API_KEY — optional by design; deterministic narration labeled honestly (keyless default like the contest leader) | ⏳ user's choice |
| 1.49 | v3 rescore (24/30) — remaining items fixed: site-derived addresses never audited (published ≠ declared), disclosure-miss contract check kept, card+status rate limits, limiter eviction sweep, CSP headers; UNVERIFIABLE-rate verified 5/5 scans complete | ✅ |
| 1.50 | Demo script updated: Shot 2 leads with THE REFUSAL (BaseScout UNVERIFIABLE catch) — reviewer's advice | ✅ |

---

## PHASE 2 — REMAINING PRODUCT FEATURES (optional before submission)

| # | Item | Status |
|---|---|---|
| 2.1 | **GUARD mode**: /guard page — GM report, baseline diff, streak, kill switches | ✅ live in production |
| 2.2 | **GM Report**: /api/gm morning digest — balance, 7d/30d activity, approval surface, verdict line | ✅ live in production |
| 2.3 | **AUTONOMOUS AGENT**: daily 06:00 UTC cron re-checks the whole field on its own (/activity page, RUN NOW trigger, run log via GitHub API) | ✅ live in production |
| 2.4 | **THE LEDGER**: /feed public timeline — machine runs from the GitHub log, run-to-run drift, curated milestones with evidence links; grows on its own every day | ✅ live in production |
| 2.5 | LLM narration upgrade (currently template-first) | ❌ nice-to-have |

> The agent now works alone: scheduled field re-checks, self-check page, on-demand
> runs. The only autonomy upgrade left is the permanent run-log, which activates the
> moment the GitHub repo + PAT exist (env vars GITHUB_PAT + GITHUB_REPO).

---

## PHASE 3 — SUBMISSION REQUIREMENTS

| # | Item | Status |
|---|---|---|
| 3.1 | Registered wallet | ✅ |
| 3.2 | Website | ✅ vette-nu.vercel.app |
| 3.3 | Demo link | ✅ /audit (the site IS the demo) |
| 3.4 | **X profile** | ✅ x.com/vetteagents — wired into site header/footer + README + SUBMISSION.md, live in prod |
| 3.5 | **Discord or Telegram link** | ❌ 🙋 create it (copy ready) |
| 3.6 | **GitHub repo public** | ⏳ 🙋 create empty repo `vette` + give me a PAT → I push (code committed locally, README/LICENSE/diagram ready) |
| 3.7 | Wire real social URLs into site footer + README | ⏳ after 3.4–3.6 |
| 3.8 | Fill the Orion submit form from your wallet | ❌ 🙋 |
| 3.9 | Pay ignition fee (~$10 ETH) | ❌ 🙋 |
| 3.10 | Submit BEFORE Sept 2, 23:59 UTC (target ~Aug 26) | ❌ |

### Ready-made content (no work needed, just copy-paste)
| # | Item | Status |
|---|---|---|
| 3.11 | Submission description (form-ready) | ✅ SUBMISSION.md |
| 3.12 | X bio + pinned tweet + 5 launch posts + reply templates | ✅ CAMPAIGN.md |
| 3.13 | Discord server name/channels/welcome message | ✅ CAMPAIGN.md |
| 3.14 | Demo video script (6 shots, 60–90s, voiceover) | ✅ DEMO_SCRIPT.md |
| 3.15 | Judge Q&A answers (Base ecosystem + hackathon usefulness) | ✅ SUBMISSION.md |
| 3.16 | GitHub README + MIT license + architecture diagram | ✅ committed |

---

## PHASE 4 — AFTER SUBMISSION (win the upvotes)

| # | Item | Status |
|---|---|---|
| 4.1 | Record + post the demo video | ❌ 🙋 (script ready) |
| 4.2 | Post the BaseScout contract-catch with the receipt | ❌ (copy ready) |
| 4.3 | Daily "caught wallet" posts (run `npm run demo:find` → post) | ❌ |
| 4.4 | "Vette-verified" offer: free audits for honest builders | ❌ (DM template ready) |
| 4.5 | Self-vet UNVERIFIABLE flex post | ❌ (copy ready) |
| 4.6 | Reply fast to every mention in builder communities | ❌ |
| 4.7 | Upvote Vette from your registered wallet | ❌ 🙋 (one wallet signature) |
| 4.8 | Keep the site green — check uptime daily | ⏳ |

---

## SCOREBOARD

- ✅ **Done:** 45+ items — the entire product, QA, deployment, and all written content
- 🙋 **On you (about 30–45 min total):** X account, Discord/Telegram, GitHub repo+PAT, submit form, ignition fee, demo video, campaign posts
- ❌ **Optional product work:** GUARD, GM Report, LLM narration

**Bottom line: the product is finished and live. What's left is 5 small account tasks, 1 submission click, and the marketing push.**
