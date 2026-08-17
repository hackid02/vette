// FeedPage — The Ledger: every entry below is a real event.
// Server-rendered straight from the feed builder (live GitHub log + milestones),
// so the timeline is in the HTML judges get before any JS runs.
import Link from "next/link";
import Logo from "@/components/Logo";
import { buildFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Ledger — Vette's public record | VETTE",
  description:
    "Every autonomous run, every catch, every refusal — Vette keeps a public, append-only ledger of what it did and when. The agent audited by its own receipts.",
};

const TYPE_STYLE = {
  RUN: { badge: "bg-vet/15 text-vet border-vet/40", label: "RUN", dot: "#C6FF4A" },
  DRIFT: { badge: "bg-warn/15 text-warn border-warn/40", label: "DRIFT", dot: "#FFB020" },
  CATCH: { badge: "bg-danger/15 text-danger border-danger/40", label: "CATCH", dot: "#FF5A65" },
  REFUSAL: { badge: "bg-[#1E241F] text-soft border-[#3A3A47]", label: "REFUSAL", dot: "#E4E7DF" },
  LOG: { badge: "bg-vet/15 text-vet border-vet/40", label: "LOG", dot: "#C6FF4A" },
  SCORE: { badge: "bg-[#1E241F] text-soft border-[#3A3A47]", label: "SCORE", dot: "#E4E7DF" },
  LAUNCH: { badge: "bg-vet/15 text-vet border-vet/40", label: "LAUNCH", dot: "#C6FF4A" },
};

export default async function FeedPage() {
  const data = await buildFeed();
  const feed = data?.feed || [];
  const stats = data?.stats || null;

  return (
    <main className="min-h-screen">
      <nav className="max-w-4xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-5">
          <Link href="/activity" className="mono text-xs text-muted hover:text-vet transition-colors">activity</Link>
          <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div className="overline mb-3">the ledger</div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-4">
          Every entry here <em className="text-vet">really happened.</em>
        </h1>
        <p className="text-muted leading-relaxed text-sm max-w-2xl mb-8">
          Vette keeps a public, append-only record of what it did and when — autonomous
          runs, catches, refusals, and the days the chain moved. Machine entries come
          straight from the run log on GitHub; the rest carry evidence links.
        </p>

        {stats && (
          <div className="panel p-6 mb-10">
            <div className="overline mb-4">ledger stats</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                ["runs logged", stats.runs],
                ["last run", stats.lastRunAt ? new Date(stats.lastRunAt).toLocaleDateString() : "—"],
                ["entries watched", stats.entriesWatched],
                ["catches", stats.catches],
                ["refusals", stats.refusals],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-muted mb-1">{k}</div>
                  <div className="mono text-lg font-bold text-soft">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {feed.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-muted mb-3">The ledger is empty right now.</p>
            <Link href="/activity" className="mono text-xs text-vet hover:underline">run the agent → it will write the first line</Link>
          </div>
        ) : (
          <ol className="relative border-l border-[#1E241F] ml-3 space-y-8">
            {feed.map((e, i) => {
              const s = TYPE_STYLE[e.type] || TYPE_STYLE.LOG;
              return (
                <li key={i} className="pl-8 relative">
                  <span
                    className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full"
                    style={{ background: s.dot, boxShadow: `0 0 12px ${s.dot}66` }}
                  />
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${s.badge}`}>
                      {s.label}
                    </span>
                    <span className="mono text-[11px] text-muted">
                      {e.date}
                      {e.auto && e.runId ? ` · ${e.runId}` : ""}
                    </span>
                    {e.auto && (
                      <span className="mono text-[10px] text-muted">· machine-written</span>
                    )}
                  </div>
                  <h2 className="font-bold text-soft leading-snug">{e.title}</h2>
                  <p className="text-sm text-muted leading-relaxed mt-1.5">{e.detail}</p>
                  {e.links && e.links.length > 0 && (
                    <div className="flex gap-4 mt-2 flex-wrap">
                      {e.links.map((l, j) => (
                        <a
                          key={j}
                          href={l.href}
                          target={l.href.startsWith("http") ? "_blank" : undefined}
                          rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                          className="mono text-[11px] text-vet hover:underline"
                        >
                          ⟶ {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mono text-[11px] text-muted mt-12 text-center leading-relaxed">
          {data?.source === "live" ? (
            <>source: live run log on GitHub · milestones recorded with evidence links</>
          ) : (
            <>source: bundled fallback — GitHub unreachable at render time, milestones still shown</>
          )}
          <br />
          <span className="text-[#55555F]">an agent is a schedule, and this is its diary</span>
        </div>
      </div>
    </main>
  );
}
