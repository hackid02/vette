import Link from "next/link";
import Logo from "@/components/Logo";
import VerdictBadge from "@/components/VerdictBadge";
import HeroVet from "@/components/HeroVet";
import LiveTicker from "@/components/LiveTicker";
import ScoreRing from "@/components/ScoreRing";
import SiteNav from "@/components/SiteNav";
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

  // The Field section badge reflects ACTUAL reachability — checked right now,
  // with a short timeout so a slow contest API can't stall the homepage.
  let fieldLive = false;
  let fieldCount = 0;
  try {
    const { fetchEntries } = await import("@/lib/orion");
    const entries = await Promise.race([
      fetchEntries(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000)),
    ]);
    fieldLive = true;
    fieldCount = entries.length;
  } catch {
    fieldLive = false;
  }

  return (
    <main className="min-h-screen">
      {/* NAV */}
      <SiteNav />

      {/* LIVE TICKER — the moving proof */}
      <LiveTicker />

      {/* HERO */}
      <header className="relative hero-glow bg-grid border-b border-[#1D1D26] overflow-hidden">
        {/* floating shield watermark — the mark, not text */}
        <svg
          viewBox="0 0 24 28"
          className="absolute right-[6%] top-[12%] w-40 h-48 sm:w-56 sm:h-64 opacity-[0.07] float-slow pointer-events-none"
          aria-hidden
        >
          <path d="M12 1.5 L21.5 5.2 V13.4 C21.5 19.6 17.8 24.4 12 26.5 C6.2 24.4 2.5 19.6 2.5 13.4 V5.2 Z" fill="#C6FF4A" />
          <path d="M7.2 13.8 L10.4 17 L17 9.4" stroke="#0A0D0B" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 text-center">
          <div className="inline-flex items-center justify-center gap-2.5 px-4 py-1.5 rounded-full border border-[#1D1D26] bg-[#0E0E15] mb-10 max-w-full">
            <span className="w-2 h-2 rounded-full bg-vet pulse-dot shrink-0" />
            <span className="mono text-[10px] sm:text-[11px] tracking-[0.15em] text-muted leading-snug">
              VETTING LIVE ON BASE · ORION HACKATHON ENTRY
            </span>
          </div>

          <h1 className="serif text-[11vw] sm:text-8xl font-light tracking-tight leading-[1.04] text-cream">
            VETTE is the agent<br />
            <em className="text-vet">that vets</em> agents.
          </h1>

          <p className="max-w-xl mx-auto mt-10 text-base sm:text-lg text-muted leading-8">
            Every agent makes promises. Vette checks the chain, stamps a verdict,
            and closes the danger — <span className="text-soft font-semibold">one click</span>.
          </p>

          <div className="flex justify-center mt-12">
            <HeroVet />
          </div>

          <div className="mt-12 flex items-center justify-center gap-3 flex-wrap">
            <VerdictBadge verdict="COMPLIANT" stamp />
            <VerdictBadge verdict="DEVIATED" stamp />
            <VerdictBadge verdict="DANGEROUS" stamp />
            <VerdictBadge verdict="UNVERIFIABLE" stamp />
            <span className="mono text-[11px] text-muted w-full sm:w-auto mt-2 sm:mt-0">
              the words an agent economy runs on
            </span>
          </div>
        </div>
      </header>

      {/* DEMO FLOW — the product working, Rigel-style */}
      {top && (
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="overline mb-3">
            live run · re-verified on Base {demo.foundAt ? new Date(demo.foundAt).toLocaleDateString() : ""}
          </div>
          <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight">
            The machine, <em className="text-vet">mid-vet.</em>
          </h2>
          <p className="text-muted leading-relaxed text-sm mt-6">
            One real wallet, through the engine today.
          </p>
          <div className="grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-4 items-stretch mt-12">
            <Flow label="01 · ENGINE">
              <ScoreRing score={top.score} verdict={top.verdict} size={110} />
              <p className="text-sm text-muted mt-2 leading-relaxed">
                Real reads only.
              </p>
              <p className="mono text-xs text-muted mt-3">{shortAddr(top.address)}</p>
            </Flow>
            <Arrow />
            <Flow label="02 · DECISION">
              <p className="text-sm text-soft leading-relaxed">
                {topFinding
                  ? `Picked the scariest open door: ${topFinding.title.toLowerCase()}`
                  : "Probes what matters most."}
              </p>
              <p className="mono text-xs text-muted mt-3">rules decide → probes verify</p>
            </Flow>
            <Arrow />
            <Flow label="03 · VERDICT" tone={top.verdict === "DANGEROUS" ? "danger" : top.verdict === "COMPLIANT" ? "vet" : "neutral"}>
              <VerdictBadge verdict={top.verdict} size="lg" icon stamp />
              <p className="text-sm text-muted mt-3 leading-relaxed">
                {top.verdict === "DANGEROUS"
                  ? `${top.openApprovals} live door(s) still open.`
                  : "Evidence, not opinion."}
              </p>
              <p className="mono text-xs text-muted mt-3">every claim → a tx hash</p>
            </Flow>
            <Arrow />
            <Flow label="04 · ACTION" tone="vet">
              <p className="text-sm text-soft leading-relaxed">
                One click, one signature. The door dies onchain.
              </p>
              <Link href={`/audit?address=${top.address}`} className="inline-block mt-3 mono text-xs text-vet hover:underline">
                re-run live →
              </Link>
            </Flow>
          </div>
        </section>
      )}

      {/* CAUGHT LIVE */}
      {demo?.targets && demo.targets.length > 0 && (
        <section className="border-y border-[#1D1D26] bg-[#0D0D13]">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="overline mb-3">caught on base</div>
            <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight">
              Real wallets. <em className="text-vet">Not actors.</em>
            </h2>
            <p className="text-muted leading-relaxed text-sm mt-5">
              Mined from real Approval events, re-verified on Base{" "}
              {demo.foundAt ? new Date(demo.foundAt).toLocaleDateString() : ""}.
              The chain keeps moving — open any card for today&apos;s live audit.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 mt-10">
              {demo.targets.map((t) => (
                <Link
                  key={t.address}
                  href={`/audit?address=${t.address}`}
                  className="panel p-6 hover:border-vet/40 transition-colors group flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <VerdictBadge verdict={t.verdict} icon stamp />
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
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-[1fr_1.3fr] gap-10 items-start">
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
          <div className="paper panel p-7 receipt-in">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <span className="overline">vette report — {catchesData.entry}</span>
              <span className="mono text-[11px] text-muted">{new Date(catchesData.caughtAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <VerdictBadge verdict={catchesData.verdict} icon size="lg" stamp />
              {catchesData.score != null ? (
                <span className="mono text-3xl font-black text-soft">
                  {catchesData.score}
                  <span className="text-muted text-base">/100</span>
                </span>
              ) : (
                <span className="mono text-xs text-muted">no wallet declared — no score issued</span>
              )}
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
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
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
              <span className="mono text-xs text-muted">
                {fieldLive ? "live from the Orion API" : "checked right now — Orion API unreachable"}
              </span>
              <span
                className={`mono text-xs px-2.5 py-1 rounded border ${
                  fieldLive ? "border-vet/40 text-vet" : "border-warn/40 text-warn"
                }`}
              >
                {fieldLive ? "LIVE" : "OFFLINE"}
              </span>
            </div>
            <p className="serif text-3xl font-light text-soft leading-snug">
              {fieldLive ? (
                <>
                  BaseScout. Rigel. Drift-d.
                  <br />
                  <em className="text-vet">CoinOp. And yours, when you submit.</em>
                </>
              ) : (
                <>
                  The contest's entry API is down right now.
                  <br />
                  <em className="text-warn">Vette's own engine is fine — check back.</em>
                </>
              )}
            </p>
            <p className="mono text-xs text-muted group-hover:text-vet transition-colors mt-auto">
              open The Field →
            </p>
          </Link>
        </div>
      </section>

      {/* THREE MOVES */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="overline mb-3">the moves</div>
        <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight">
          Watch. <em className="text-vet">Then act.</em>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
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
              icon: "⚖️",
              title: "THE ALIBI",
              status: "LIVE",
              statusTone: "bg-vet/15 text-vet border-vet/40",
              body: "Every court needs a defense. Accuse any wallet — Vette rebuilds its money-trail from Base, hop by hop, and shows where every coin went. Convict and acquit on receipts, not vibes.",
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
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-[1fr_1.4fr] gap-12">
          <div>
            <div className="overline mb-3">the engine</div>
            <h2 className="serif text-4xl sm:text-5xl font-light tracking-tight text-cream leading-tight">
              It doesn&apos;t vibe-check.
              <br />
              <em className="text-vet">It checks.</em>
            </h2>
            <p className="text-muted mt-5 leading-relaxed text-sm">
              The deterministic engine runs first and decides what is true. The rule engine
              chooses where to look, every number traces to a live read, and the narration
              is deterministic — an optional model hook can write the words, never the numbers.
              This is the receipt. Nothing on this page is an opinion without one.
            </p>
            <Link href="/activity" className="inline-block mt-6 px-5 py-3 rounded-md border border-vet/40 text-vet font-bold hover:bg-vet hover:text-ink transition-colors">
              Watch it work on its own →
            </Link>
          </div>
          <div className="paper panel p-7 receipt-in relative">
            <div className="flex items-center justify-between mb-2">
              <span className="overline">vette receipt · engine trace</span>
              <span className="mono text-[10px] text-muted">№ {top?.address ? shortAddr(top.address) : "live"}</span>
            </div>
            <ol className="space-y-0">
              {[
                ["fetch_website()", "liveness · socials · published addresses"],
                ["rpc_balance() / rpc_code()", "ETH balance, is it a contract"],
                ["explorer_transactions()", "decoded history — what it actually did"],
                ["rpc_allowance()", "live allowances probed onchain, right now"],
                ["rule_engine()", "safety + mandate heuristics"],
                ["narrate() → verdict", "every sentence cites the steps above"],
              ].map(([fn, desc], i) => (
                <li key={fn} className="flex gap-5 py-3.5 hairline last:border-b-0">
                  <span className="mono text-xs text-[#3A3A47] w-6 shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="mono text-sm text-vet">{fn}</div>
                    <div className="text-xs text-muted mt-1">{desc}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="absolute -bottom-4 right-6 rotate-[-6deg]">
              <VerdictBadge verdict={top?.verdict || "UNVERIFIABLE"} stamp />
            </div>
            <p className="mono text-[10px] text-muted text-center mt-6">
              — end of trace — verified by a deterministic engine, not vibes
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1D1D26]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size={22} />
          <p className="mono text-xs text-muted">Receipts, not opinions. Trust, but verified.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted">
            <Link href="/alibi" className="hover:text-vet transition-colors">The Alibi</Link>
            <Link href="/feed" className="hover:text-vet transition-colors">The Ledger</Link>
            <Link href="/activity" className="hover:text-vet transition-colors">Activity</Link>
            <a href="https://x.com/vetteagents" target="_blank" rel="noreferrer" className="hover:text-vet transition-colors">X</a>
            <a href="https://github.com/hackid02/vette" target="_blank" rel="noreferrer" className="hover:text-vet transition-colors">GitHub</a>
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
