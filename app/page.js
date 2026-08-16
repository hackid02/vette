import Link from "next/link";
import Logo from "@/components/Logo";
import VerdictBadge from "@/components/VerdictBadge";
import HeroVet from "@/components/HeroVet";
import { shortAddr } from "@/lib/providers";
import demoData from "../data/demo.json";
import catchesData from "../data/catches.json";

export const dynamic = "force-dynamic";

function readDemo() {
  return demoData || null;
}

function Flow({ children, label, tone = "neutral" }) {
  const border = tone === "danger" ? "border-danger/40" : tone === "vet" ? "border-vet/40" : "border-[#1D1D26]";
  return (
    <div className={`panel border ${border} p-5 relative overflow-hidden`}>
      <div className="overline mb-3">{label}</div>
      {children}
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-[#33333F] font-black text-2xl select-none">
      →
    </div>
  );
}

export default async function Home() {
  const demo = readDemo();
  const top = demo?.targets?.find((t) => t.verdict === "DANGEROUS") || demo?.targets?.[0] || null;
  const topFinding = demo?.topFinding || null;

  return (
    <main className="min-h-screen">
      {/* NAV */}
      <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-7 text-sm text-muted">
          <Link href="/audit" className="hover:text-soft transition-colors">Audit</Link>
          <Link href="/field" className="hover:text-soft transition-colors">The Field</Link>
          <Link href="/guard" className="hover:text-soft transition-colors">Guard</Link>
          <Link href="/activity" className="hover:text-soft transition-colors">Activity</Link>
          <a href="https://github.com/hackid02" target="_blank" rel="noreferrer" className="hover:text-soft transition-colors">GitHub</a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-soft transition-colors">X</a>
          <Link href="/audit" className="px-4 py-2 rounded-md bg-vet text-ink font-extrabold hover:opacity-90 transition-opacity">
            Vet an agent
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative hero-glow bg-grid border-b border-[#1D1D26]">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#1D1D26] bg-[#0E0E15] mb-8">
            <span className="w-2 h-2 rounded-full bg-vet pulse-dot" />
            <span className="mono text-[11px] tracking-[0.2em] text-muted">
              LIVE ON BASE · ORION BUILDER HACKATHON ENTRY
            </span>
          </div>

          <h1 className="serif text-[11vw] sm:text-8xl font-light tracking-tight leading-[1.02] text-cream">
            VETTE is the agent<br />
            <em className="text-vet">that vets</em> agents.
          </h1>

          <p className="max-w-2xl mx-auto mt-8 text-lg text-muted leading-relaxed">
            Every AI agent makes promises. Vette checks the chain, delivers a verdict,
            and kills the danger — <span className="text-soft font-semibold">one click</span>.
            No vibes. No invention. Every claim traces to a real transaction.
          </p>

          <div className="flex justify-center mt-9">
            <HeroVet />
          </div>

          <div className="mono text-xs text-muted mt-6 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-vet">✓ COMPLIANT</span>
            <span className="text-[#33333F]">·</span>
            <span className="text-warn">⚠ DEVIATED</span>
            <span className="text-[#33333F]">·</span>
            <span className="text-danger">🚨 DANGEROUS</span>
            <span className="text-[#55555F]">— and the honest fourth: UNVERIFIABLE. The words an agent economy runs on</span>
          </div>
        </div>
      </header>

      {/* DEMO FLOW — the product working, Rigel-style */}
      {top && (
        <section className="max-w-6xl mx-auto px-6 py-14">
          <div className="overline mb-3">
            live run · re-verified on Base {demo.foundAt ? new Date(demo.foundAt).toLocaleDateString() : ""}
          </div>
          <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight mb-3">
            The machine, <em className="text-vet">mid-vet.</em>
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-8">
            One real wallet, run through the engine today. The chain moves — click any card
            below to see the live numbers.
          </p>
          <div className="grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 items-stretch">
            <Flow label="01 · ENGINE">
              <p className="mono text-3xl font-black text-soft">{top.score}/100</p>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                Real reads only: balance, decoded transfers, approval events, live allowances, contract reputations.
              </p>
              <p className="mono text-xs text-muted mt-3">{shortAddr(top.address)}</p>
            </Flow>
            <Arrow />
            <Flow label="02 · ENGINE DECISION">
              <p className="text-sm text-soft leading-relaxed">
                {topFinding
                  ? `The rule engine picked the scariest open door: ${topFinding.title.toLowerCase()}`
                  : "The rule engine scans the surface, then probes what matters most."}
              </p>
              <p className="mono text-xs text-muted mt-3">rules decide → probes verify → numbers only</p>
            </Flow>
            <Arrow />
            <Flow label="03 · VERDICT" tone={top.verdict === "DANGEROUS" ? "danger" : top.verdict === "COMPLIANT" ? "vet" : "neutral"}>
              <VerdictBadge verdict={top.verdict} size="lg" icon />
              <p className="text-sm text-muted mt-3 leading-relaxed">
                {top.verdict === "DANGEROUS"
                  ? `${top.openApprovals} live approval(s) still open. A stranger's wallet, exposed right now.`
                  : "Evidence, not opinion. Follow the trace."}
              </p>
              <p className="mono text-xs text-muted mt-3">every claim → a tx hash</p>
            </Flow>
            <Arrow />
            <Flow label="04 · ACTION" tone="vet">
              <p className="text-sm text-soft leading-relaxed">
                Connect your wallet and the kill switch is <span className="font-bold text-vet">live</span>:
                one click, one signature, the approval dies onchain. Vette doesn&apos;t warn — it <span className="font-bold text-vet">fixes</span>.
              </p>
              <Link href={`/audit?address=${top.address}`} className="inline-block mt-3 mono text-xs text-vet hover:underline">
                re-run this audit live →
              </Link>
            </Flow>
          </div>
        </section>
      )}

      {/* CAUGHT LIVE */}
      {demo?.targets && demo.targets.length > 0 && (
        <section className="border-y border-[#1D1D26] bg-[#0D0D13]">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="overline mb-3">caught on base</div>
            <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight mb-4">
              Real wallets. <em className="text-vet">Not actors.</em>
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-10">
              Mined from real Approval events, re-verified on Base{" "}
              {demo.foundAt ? new Date(demo.foundAt).toLocaleDateString() : ""}.
              The chain keeps moving — open any card for today&apos;s live audit.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {demo.targets.map((t) => (
                <Link
                  key={t.address}
                  href={`/audit?address=${t.address}`}
                  className="panel p-6 hover:border-vet/40 transition-colors group flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <VerdictBadge verdict={t.verdict} icon />
                    <span className="mono text-2xl font-black text-soft">
                      {t.score}
                      <span className="text-muted text-sm font-normal">/100</span>
                    </span>
                  </div>

                  <div>
                    <p className="mono text-sm text-soft">{shortAddr(t.address)}</p>
                    <p className="text-xs text-muted mt-1.5 leading-relaxed">
                      {t.verdict === "DANGEROUS"
                        ? `${t.openApprovals} live approval(s) — each one a door.`
                        : `${t.openApprovals} open approval(s).`}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[#1E241F] flex items-center justify-between">
                    <span className="mono text-[11px] text-muted group-hover:text-vet transition-colors">
                      open the report
                    </span>
                    <span className="mono text-[11px] text-vet">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* THE CATCH — the story, not the feature list */}
      <section className="border-b border-[#1E241F]">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_1.3fr] gap-10 items-start">
          <div>
            <div className="overline mb-3">the catch</div>
            <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight">
              Vette audited a top entry
              <em className="text-vet"> in this contest.</em>
            </h2>
            <p className="text-muted leading-relaxed text-sm mt-5">
              We gave Vette {catchesData.entry}&apos;s website. It pulled the address the agent
              publishes as its wallet, checked it against Base, and the deterministic engine
              returned a finding no human had flagged: the &quot;wallet&quot; is a token contract.
              Every check behind it is in the public receipt.
            </p>
            <a
              href={catchesData.website}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-5 mono text-xs text-vet hover:underline"
            >
              re-run this audit yourself — paste the site in the hero ↑
            </a>
          </div>
          <div className="paper panel p-7">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <span className="overline">vette report — {catchesData.entry}</span>
              <span className="mono text-[11px] text-muted">{new Date(catchesData.caughtAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <VerdictBadge verdict={catchesData.verdict} icon size="lg" />
              <span className="mono text-3xl font-black text-soft">
                {catchesData.score}
                <span className="text-muted text-base">/100</span>
              </span>
            </div>
            <div className="border border-[#1E241F] bg-[#0E0E15] rounded-md p-4 border-l-2" style={{ borderLeftColor: "#FFB020" }}>
              <span className="mono text-[9px] font-bold px-2 py-0.5 rounded border tracking-widest bg-warn/15 text-warn border-warn/40">WARNING</span>
              <p className="text-sm font-bold text-soft mt-2">{catchesData.findingTitle}</p>
              <p className="text-sm text-muted leading-relaxed mt-2">{catchesData.findingDetail}</p>
              <a
                href={`https://base.blockscout.com/address/${catchesData.evidenceValue}`}
                target="_blank"
                rel="noreferrer"
                className="mono text-[11px] text-vet hover:underline mt-3 inline-block"
              >
                ⟶ evidence: {catchesData.evidenceValue.slice(0, 14)}… on Blockscout
              </a>
            </div>
            <p className="mono text-[11px] text-muted mt-4 leading-relaxed">{catchesData.note}</p>
          </div>
        </div>
      </section>

      {/* THE FIELD */}
      <section className="border-b border-[#1E241F]">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <div className="overline mb-3">the field</div>
            <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight">
              Every entry in this contest.
              <em className="text-vet"> Under Vette.</em>
            </h2>
            <p className="text-muted leading-relaxed text-sm mt-5 max-w-xl">
              The contest itself publishes every entry's registered wallet, words, and links.
              Vette takes each one — the builder's own promises, their registered wallet, their
              website — and rules on whether behavior matches the mandate. One page. The whole
              field. Same lens the judges use.
            </p>
          </div>
          <Link
            href="/field"
            className="panel p-8 hover:border-vet/50 transition-colors group flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="mono text-xs text-muted">live from the Orion API</span>
              <span className="mono text-xs px-2.5 py-1 rounded border border-vet/40 text-vet">LIVE</span>
            </div>
            <p className="serif text-3xl font-light text-soft leading-snug">
              BaseScout. Rigel.<br />
              <em className="text-vet">And yours, when you submit.</em>
            </p>
            <p className="mono text-xs text-muted group-hover:text-vet transition-colors mt-auto">
              open The Field →
            </p>
          </Link>
        </div>
      </section>

      {/* THREE MOVES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="overline mb-3">the moves</div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-soft mb-10">
          Watch. <span className="serif italic font-normal text-muted">Then act.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              n: "01",
              icon: "🕵️",
              title: "AUDIT",
              status: "LIVE",
              statusTone: "bg-vet/15 text-vet border-vet/40",
              body: "Give Vette any agent — website, X, or wallet. It extracts the agent's own promises, pulls the real onchain history, and rules on whether behavior matches the mandate.",
            },
            {
              n: "02",
              icon: "🛡️",
              title: "GUARD",
              status: "LIVE",
              statusTone: "bg-vet/15 text-vet border-vet/40",
              body: "Vette watches your wallet. The daily GM report greets you in plain English, and a saved baseline means new approvals can't slip in unnoticed — every guard check diffs the live chain against it.",
            },
            {
              n: "03",
              icon: "⚡",
              title: "KILL",
              status: "LIVE",
              statusTone: "bg-vet/15 text-vet border-vet/40",
              body: "One click, one signature, and a dangerous approval is revoked live on Base — preflight-simulated first, so you never sign a failing tx. Every other entry describes problems. Vette ends them.",
            },
          ].map((m) => (
            <div key={m.n} className="panel p-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="mono text-4xl font-black text-[#23232E]">{m.n}</span>
                <span className={`mono text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-widest ${m.statusTone}`}>
                  {m.status}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-soft">{m.title} <span className="text-lg">{m.icon}</span></h3>
              <p className="text-sm text-muted leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ENGINE / RECEIPT */}
      <section className="border-t border-[#1D1D26]">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_1.4fr] gap-12">
          <div>
            <div className="overline mb-3">the engine</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-soft leading-tight">
              It doesn&apos;t vibe-check.
              <br />
              <span className="serif italic font-normal text-muted">It checks.</span>
            </h2>
            <p className="text-muted mt-5 leading-relaxed text-sm">
              The deterministic engine runs first and decides what is true. The rule engine
              chooses where to look, every number traces to a live read, and the narration
              is deterministic — an optional model hook can write the words, never the numbers.
              This is the receipt. Nothing on this page is an opinion that cannot be followed
              back to a tool call.
            </p>
            <Link href="/activity" className="inline-block mt-6 px-5 py-3 rounded-md border border-vet/40 text-vet font-bold hover:bg-vet hover:text-ink transition-colors">
              Watch it work on its own →
            </Link>
          </div>
          <ol className="space-y-0">
            {[
              ["fetch_website()", "liveness · socials · published addresses · the agent's own words"],
              ["rpc_balance() / rpc_code()", "ETH balance, is it a contract, Base mainnet"],
              ["explorer_transactions()", "decoded history — what it actually did"],
              ["rpc_allowance()", "live allowances probed onchain, right now"],
              ["rule_engine()", "mandate-vs-behavior + wallet-safety heuristics"],
              ["narrate() → verdict", "plain English, every sentence citing the steps above"],
            ].map(([fn, desc], i) => (
              <li key={fn} className="flex gap-5 py-4 hairline last:border-b-0">
                <span className="mono text-xs text-[#3A3A47] w-6 shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="mono text-sm text-vet">{fn}</div>
                  <div className="text-xs text-muted mt-1">{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1D1D26]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size={22} />
          <p className="mono text-xs text-muted">Every claim traces to a tool call. Trust, but verified.</p>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/guard" className="hover:text-vet transition-colors">Guard</Link>
            <Link href="/activity" className="hover:text-vet transition-colors">Activity</Link>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-vet transition-colors">X</a>
            <a href="https://github.com/hackid02" target="_blank" rel="noreferrer" className="hover:text-vet transition-colors">GitHub</a>
            <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-vet transition-colors">Discord</a>
            <Link href="/audit" className="hover:text-vet transition-colors">Audit</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-6 mono text-[10px] text-[#55555F] leading-relaxed">
          Vette is a security tool for the Base network. It never holds keys or custody — you sign every
          transaction in your own wallet. Verdicts are evidence-based, not financial advice.
        </div>
      </footer>
    </main>
  );
}
