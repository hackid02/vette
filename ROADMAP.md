# VETTE — Master Procedure (Aug 14 → Sep 2)

**Deadline: Sept 2, 2026 23:59 UTC · 19 days left · target: submit by ~Aug 26 to farm upvotes**

## Phase 1 — LOOK (Aug 14–19) · UI rebuild + permanent URL
- [x] Rebuild the UI to leader standard: typography-first hero, demo-as-hero (live verdict flow on the landing page), editorial spacing, one accent color, mono data + big headline contrast
- [x] Home = Rigel-style story: engine step → agent step → verdict → action, all real data
- [x] Landing page hero includes the audit input directly (no dead "run an audit" detour)
- [x] Trace page polish: numbered steps, clean table, "receipt" aesthetic
- [x] Favicon + OG social card (lime shield; card previews on X/Discord)
- [x] Vercel deploy → PERMANENT URL: **https://vette-nu.vercel.app** (verified: landing, audit console, /api/status on Base, /api/audit with embedded 13-step receipt, favicon, OG image)
- [x] Vercel-safety: demo.json bundled as import; trace embedded in audit response; .vercelignore set
- [ ] GitHub repo public (user: hackid02; README/screenshots/diagram ready — need repo push)
- [ ] Put the permanent URL everywhere (submission, X, GitHub, README)

## Phase 2 — ACT (Aug 19–24) · the 10/10 moves
- [x] **KILL**: connect wallet → revoke approval tx → onchain confirmation, live on Base
  - EIP-1193 wallet layer (no keys, no custody; approve(spender,0) only; value always 0)
  - preflight eth_call simulation before any signature (never sign a failing tx)
  - Base chain auto-switch/add; receipt polling; tx link to Blockscout
  - only the owner can revoke (guard); auto re-audit after revoke
  - encoding verified onchain against the demo wallet's live spender (eth_call succeeds)
  - multi-wallet: EIP-6963 discovery + picker (fixed popup-storm bug + Trust Wallet guidance)
- [x] **GUARD**: /guard page — GM report + baseline diff + streak (built, tested locally)
  - /api/gm: morning digest — balance, 7d/30d activity, approval surface w/ risk levels, verdict line, kill actions
  - baseline saved in the user's browser; every check diffs live chain vs baseline (new approvals red, closed green)
  - daily streak counter; honest mechanics note (checks run on open; 24/7 backend is next milestone)
- [x] **GM Report**: shipped inside Guard (the daily digest IS the GM report)
- [ ] Demo video: 60–90s, script = audit → danger found → one-click kill → tx hash (script ready: DEMO_SCRIPT.md)

## Phase 3 — SHIP (Aug 24–26) · submission requirements
- [x] Submission copy: name, description, category (risk), links (SUBMISSION.md)
- [x] X copy: bio, pinned tweet, 5 launch posts, reply templates (CAMPAIGN.md)
- [x] Discord/TG copy: server name, channels, welcome message (CAMPAIGN.md)
- [x] Demo video script: 60–90s, 6-shot structure (DEMO_SCRIPT.md)
- [x] GitHub repo content: README, MIT license, architecture diagram — committed locally (git)
- [ ] X account live (user creates — copy ready)
- [ ] Discord or Telegram link live (user creates — copy ready)
- [ ] GitHub repo public (user: hackid02 — create empty repo `vette` + PAT for push)
- [ ] Wire real social URLs into README/footer → redeploy
- [ ] **SUBMIT** from the registered wallet (Oluwaseyifunmi)
- [ ] Pay ignition fee (~$10 ETH)

## Phase 4 — WIN (Aug 26–Sep 2) · upvote campaign
- [ ] Post the demo clip on X with the receipts angle ("Vette caught this wallet TODAY")
- [ ] Share in builder communities (Orion Discord/TG, Base builders)
- [ ] "Vette-verified" angle: offer free audits to other entrants → they share/upvote
- [ ] Daily audit of a fresh live wallet → post the catch → visibility loop
- [ ] Respond to judge questions fast; keep the site green (uptime!)

## Standing rules
- Every claim on the site traces to a tool call (the 86/100 formula)
- Demo never 500s: pre-computed gallery + live runs
- "Unverifiable" is always an acceptable verdict — never invent
- One vibe: trusted referee, not cop. "Trust, but verified."
