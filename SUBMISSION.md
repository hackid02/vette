# VETTE — Submission Kit

> Fill the Orion submit form from the registered wallet before Sept 2, 23:59 UTC.
> Target: submit ~Aug 26 to farm upvotes.

## Form fields

| Field | Value |
|---|---|
| **Name** | VETTE |
| **Category** | risk (matches the closest existing category; if "safety/security" exists, use it) |
| **Chain** | base |
| **Website** | https://vette-nu.vercel.app |
| **Demo link** | https://vette-nu.vercel.app/audit |
| **X** | (your X profile URL — create it, then paste) |
| **GitHub** | https://github.com/hackid02/vette |
| **Discord or Telegram** | (your invite link — create it, then paste) |

## Description (paste into the form — mirrors the leaders' format)

VETTE is the agent that vets agents. Give it any agent's website or wallet and
it reads what the agent promised, checks what it actually did on Base, and rules
on whether behavior matches the mandate: COMPLIANT, DEVIATED, or DANGEROUS — with
a score and a public receipt tracing every claim to a real tool call.

The deterministic engine runs first and decides what is true: it fetches the
agent's own copy and extracts its stated mandate, then reads the wallet's real
history — decoded transactions, token transfers, owner-scoped approval events,
live allowances probed onchain, and contract reputations. A rule engine scores
mandate-vs-behavior deviation and wallet safety. The rule engine chooses where to
look; it never invents evidence. If a wallet is empty or unpublished, the verdict
is UNVERIFIABLE — not flattering, and not fiction.

Then Vette acts. Connect your wallet and every dangerous approval becomes a
one-click kill switch: approve(spender, 0), preflight-simulated onchain before
any signature, confirmed with the tx hash on screen. Every other entry describes
problems. Vette ends them.

Vette also vets the whole field: it pulls the hackathon's own entry API and puts
every registered wallet and builder claim under the same lens. Its first live
catch: a leading entry whose published "wallet" is actually a token contract.

Every claim traces to a tool call. Trust, but verified.

## Judge Q&A prep (if anyone asks)

**"How is this useful to the Base ecosystem?"**
Base is onboarding users and agents onto a chain where approvals are the #1
attack surface and agents have zero accountability. Vette closes both: it
measures and kills dangerous approvals in one click, and it holds agents to
their own promises with verifiable onchain evidence. That's the trust layer the
agent economy needs before people hand agents money.

**"How is it useful for this hackathon?"**
Three ways: for the judges, it's a working first pass on the exact rubric they
must score. For the builders who vote, The Field tells them what Vette says
about their own entry — honest builders want a clean verdict. For the platform,
it extends Orion's vetting from launch-day to every day after. And it's the only
entry that acts instead of analyzing.

**"Why should I trust Vette?"**
You don't have to — that's the design. Every claim traces to a real tool call
with a public receipt. Nothing is invented; unverifiable is a valid verdict.
The engine is deterministic; narration is template-first, with an optional model hook that writes the words — never the numbers.

**"What's next?"**
Guard mode: live watch + daily GM Report for any wallet. Agents are coming;
someone has to referee them.

## What only you can do (checklist)

- [ ] Create the X account (copy in CAMPAIGN.md)
- [ ] Create the Discord server or Telegram group (copy in CAMPAIGN.md)
- [ ] Create the GitHub repo (empty, public, name `vette`) + PAT for the push
- [ ] Wire the real URLs into README/footer + redeploy
- [ ] Submit from the registered wallet + pay ~$10 ETH ignition fee
