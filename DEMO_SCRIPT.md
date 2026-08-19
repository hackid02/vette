# VETTE — Demo Video Script v4 (full product tour + live demos)

> Plain screen record, no theatrics. Follow the steps, record the screen, add
> the AI voiceover. Total ≈ 2 minutes. Everything on https://vette-nu.vercel.app
>
> **What this version adds:** a homepage scroll-tour so the judge sees EVERY
> part of the product before the deep dives — engine, catch, field, receipt —
> not just the three demo moments.

## Before you start recording (one-time, ~5 min)

1. Open OBS (or QuickTime) — 1080p, window capture, **no mic**
2. Open Chrome at https://vette-nu.vercel.app
3. Open a **second tab** with the audit report on the UNLIMITED burner already
   loaded (paste `0xD5ea62CFe596FBdB19d604FD183258C8C500e5d1` → VET IT → wait
   for the report → leave it open)
4. Burner imported in MetaMask on Base (see ACT V notes)
5. Rehearse the kill flow **once** off-camera: REVOKE → popup → **REJECT**
   (rejecting sends nothing; the door stays open for the real take)

Record one clip per act (7 clips) — fumble a step, redo just that clip.

---

## ACT I — Hero (0:00–0:10)

**Do:** nothing. Let the hero sit — headline, live ticker, vet box.

**Voice 1:** "AI agents are coming to Base. They'll hold wallets, make promises,
move money. Almost nothing checks what they actually do."

---

## ACT II — THE TOUR (0:10–0:38) ← the homepage scroll

**Do:** scroll the homepage slowly, top to bottom. Pause ~4 seconds on each of
these, in order:

| Pause at (section heading) | What the judge sees |
|---|---|
| **01 ENGINE → 02 DECISION → 03 VERDICT → 04 ACTION** | the four-step machine |
| **caught on base — the catch** | the three real wallets it flagged (DANGEROUS / WARNING / COMPLIANT) |
| **Vette audited a top entry** | the refusal story |
| **the field** | "Every entry in this contest." |
| **the moves** | the four tools: Audit · Exam · Field · Ledger |
| **the engine — "It doesn't vibe-check"** | the receipt: every claim traceable |

**Voice 2:** "Here's the whole product. The engine: four steps, every one a
real check. The catch: real wallets it flagged on Base. The field: every entry
in this contest. And the receipt: nothing here is an opinion without one."

> Note: if the field badge shows OFFLINE (the contest API goes down sometimes),
> don't stop — keep scrolling. The section copy still reads.

---

## ACT III — The Refusal (0:38–0:58)

**Do, in order:**
1. Scroll back up to the hero vet box
2. Paste `base-scout-seven.vercel.app`
3. Click **VET IT →**
4. Wait for the report (a few seconds — don't rush)
5. Scroll to the verdict + the stamp

**On screen:** report loads → **UNVERIFIABLE** stamp → finding: "the only
address on the agent's page is a CONTRACT".

**Voice 3:** "First: audit. I pointed Vette at a real entry in this hackathon.
It loaded the site, read the copy — and refused to score it. The only address
on the page is a contract, not a wallet. No wallet, no verdict. The refusal is
the finding."

---

## ACT IV — The Exam (0:58–1:15)

**Do, in order:**
1. Click **The Exam** in the nav
2. Paste `aixbt.tech` (or click the "try: a famous Base agent" chip)
3. Click **START THE EXAM →**
4. Wait ~2 seconds — the paper lands almost instantly
5. Point at the verdict, then scroll the eight graded answers

**On screen:** the sheet → the paper → **REFUSED TO SIT** → the contract line
("code, not the wallet that signs").

**Voice 4:** "Sit down. Eight questions no agent answers: operative wallet,
control, kill switch, data, code, audits, limits. I gave the exam to the
biggest agent on Base. Refused to sit."

---

## ACT V — The Kill (1:18–1:45) ⚡ live on camera

**Do, in order:**
1. Quick look at **The Ledger** (nav) — scroll to the live-fire drill entry,
   2–3 seconds only
2. Switch to the **pre-loaded second tab** (UNLIMITED burner report)
3. Scroll to the revoke row — *∞ USDC → SwapRouter02*
4. Click **REVOKE**
5. MetaMask popup appears → click **Confirm** ← the real kill, on camera
6. Wait for the tx hash to appear in the report
7. Click the tx link → **Blockscout** shows the confirmed transaction

**Voice 5:** "Kill. We fired live rounds at Vette: three fresh wallets, four
real Base transactions. Unlimited USDC. A thousand USDC to an unverified
contract. Vette caught all three. And one door is still open — right now.
Watch Vette close it. Live."

**If the popup misbehaves:** Ledger → drill entry → its kill tx link →
Blockscout. Voice line still fits. (Plan B.)

---

## ACT VI — The Ledger (1:45–1:58)

**Do, in order:**
1. Go to **The Ledger** (`/feed`)
2. Scroll the timeline slowly, top to bottom — point at the machine-written
   entries (CATCH, RUN, REFUSAL)

**Voice 6:** "And every day, it runs alone. Checks the field. Hunts exposed
wallets. Writes its diary to a public log. All machine-written. All
evidence-linked."

---

## ACT VII — Self-audit + outro (1:58–2:10)

**Do, in order:**
1. Back to the hero
2. Paste `vette-nu.vercel.app` into the vet box → **VET IT →**
3. Wait for the stamp → **UNVERIFIABLE**

**Voice 7:** "We even vetted Vette with Vette: unverifiable. Even we don't get
special treatment. Every other entry tells you what's wrong. Vette fixes it.
Vette — the agent that vets agents."

---

## End card (hold ~4s)

Shield logo + **VETTE** · `vette-nu.vercel.app`
*"They tell you what's wrong. Vette fixes it."*
*Orion Builder Hackathon · built by Oluwaseyifunmi*

---

## Practical notes

- **Captions ON** in the final edit (judges watch muted)
- **Don't rush the clicks** — pause one beat between steps
- The AI voiceover lines are in `VOICEOVER.md` — generate each separately,
  drop each onto its clip
- **Burner key** (ACT V import): in the chat history above; also in
  `data/staging.json` (gitignored)
- After the kill the burner is clean — don't re-run the old kill scripts
- Export 1080p, ~2:15 total with the end card
