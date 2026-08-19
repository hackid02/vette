# 🧪 VETTE — Manual Test-Run Checklist (hunt bugs yourself)

> Go to https://vette-nu.vercel.app. Work through each feature in order.
> If anything shows a verdict/state you don't expect, note: (1) what you did,
> (2) what you saw, (3) what you expected. That's a bug report — send it here.

---

## 1 · HOMEPAGE (the tour)

- [ ] Hero loads; the live ticker is moving; the score ring shows a real number (28-ish, NOT 0)
- [ ] Badge top-right says `VETTING LIVE ON BASE · ORION HACKATHON ENTRY`
- [ ] Scroll: ENGINE 01–04 → the catch (three wallets) → the refusal story → THE FIELD card → THE MOVES (Audit · Alibi · Kill) → the receipt section
- [ ] The Field card shows `LIVE` (Orion API is back up) — if it says OFFLINE, note it
- [ ] Footer links: Audit · The Alibi · The Ledger · GitHub · X — all open the right page
- [ ] Mobile (narrow the window or use your phone): no horizontal scrolling, hamburger menu opens, ticker doesn't overflow

## 2 · AUDIT (the deep console) — /audit

**The neutral example (aixbt):**
- [ ] Click `↳ try: a famous Base agent` → it fills `aixbt.tech` → **VET THIS**
- [ ] The report loads in seconds: verdict is **UNVERIFIABLE** (no operative wallet published)
- [ ] The receipt shows each check (site fetch, published addresses) with real inputs/outputs
- [ ] Every evidence link opens Blockscout and shows the right address/tx

**The demo wallet:**
- [ ] Click `🎯 the wallet Vette caught` → **VET THIS**
- [ ] Verdict **DANGEROUS** with a score; findings list the open approvals
- [ ] If any finding has an open door, the **KILL** row appears with REVOKE
- [ ] **Do NOT confirm a revoke during testing** — connect + popup + REJECT is the safe rehearsal
- [ ] No wallet-connect UI appears anywhere else on the page (only inside the report)

**Error paths:**
- [ ] Paste `not-a-website` → graceful error, no crash
- [ ] Paste `0x123` (too short) → validation error, no crash
- [ ] Empty input → VET THIS does nothing or shows a hint

## 3 · THE ALIBI — /alibi

- [ ] Case file 001 (GROK DEFENSE) renders: THE MONEY CAME HOME + the 3 hop labels
- [ ] Case file 002 (AUGUST DRAIN) renders: THE MONEY LEFT + drain tx link
- [ ] Click **USE THIS CASE** on the drain → the attacker's wallet fills in → **RUN THE ALIBI**
- [ ] Live verdict lands (THE MONEY LEFT or TRAIL TOO SHALLOW — both are honest; depends on explorer/RPC health that hour)
- [ ] The receipt shows the wallet's real ETH balance and the scope line
- [ ] Grok case, live run: THE MONEY CAME HOME, ~16 ETH resting
- [ ] Paste a random never-used address → TRAIL TOO SHALLOW (honest, no invented trail)
- [ ] Paste `xyz` → validation error, no crash

## 4 · THE FIELD — /field

- [ ] All 4 entries render: Rigel · BaseScout · Drift-d · CoinOp
- [ ] Each card has **VET THIS ENTRY** (4 buttons)
- [ ] Click VET THIS on ONE entry → the audit runs and the verdict appears on that card
- [ ] The card shows the wallet and evidence links
- [ ] Nothing crashes if the Orion API flakes mid-load (OFFLINE state instead)

## 5 · THE LEDGER — /feed

- [ ] Timeline renders: CATCH / RUN / REFUSAL / LAUNCH / SCORE / LOG entries
- [ ] Every entry has a date and a machine-written tone; RUN entries say what happened honestly
- [ ] If any run has `fieldError` (Orion was down), the entry says so — no silent fake results
- [ ] The kill-tx entry from the drill links to Blockscout

## 6 · KILL SWITCH (only if you have your own wallet with an open approval)

- [ ] Open /audit with your wallet → connect (one popup, no account-switching)
- [ ] REVOKE → MetaMask shows the approve(0) call → **REJECT to rehearse**
- [ ] The preflight row appears before signing (gas + canAfford)
- [ ] revoke.cash fallback link is present in the report

## 7 · GLOBAL CHECKS

- [ ] All pages respond on mobile (rotate through: /, /audit, /alibi, /field, /feed)
- [ ] Dead routes 404: /mandate, /exam, /guard (try them in the URL bar)
- [ ] X share card: paste `https://vette-nu.vercel.app` into a DM draft or https://cards-dev.twitter.com/validator → the OG card image shows (may be X's cached old one — that's X, not us)
- [ ] Every Blockscout link opens the right record
- [ ] The site never shows a wallet Vette doesn't label as demo/example — demo wallets must say what they are

## How to report a bug

> `WHERE` (page/URL) · `WHAT YOU DID` · `WHAT YOU SAW` · `WHAT YOU EXPECTED`

One-line examples:
- "/alibi → ran case 002 → TRAIL TOO SHALLOW but yesterday it showed hops → expected a hop list"
- "/field → clicked VET on CoinOp → spinner ran 2 minutes → expected <90s"

*Honest states are NOT bugs:* UNVERIFIABLE, TRAIL TOO SHALLOW, OFFLINE, and rate-limit
messages are the product refusing to invent data. Bug = crash, wrong link, contradiction,
or a verdict that disagrees with the evidence shown on screen.
