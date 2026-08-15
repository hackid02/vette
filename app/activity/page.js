// ActivityPage — proof that Vette works alone.
// Server-rendered: the self-check runs at request time, so the HTML shows
// live engine readings even before any JS runs.
import Link from "next/link";
import Logo from "@/components/Logo";
import { fetchEntries } from "@/lib/orion";
import RunAgentButton from "@/components/RunAgentButton";
import { RPC_URLS, BASESCAN } from "@/lib/providers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activity — Vette runs by itself | VETTE",
  description:
    "Every hour a cron wakes Vette and it re-checks the whole hackathon field — websites, registered wallets, approval surfaces — without a human asking.",
};

export default async function ActivityPage() {
  // live self-check, rendered into the HTML
  let entries = 0;
  let block = null;
  let selfStatus = "degraded";
  try {
    const e = await fetchEntries();
    entries = e.length;
  } catch {}
  try {
    const res = await fetch(RPC_URLS[0], {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    const j = await res.json();
    if (j.result) {
      block = parseInt(j.result, 16);
      selfStatus = "operational";
    }
  } catch {}

  return (
    <main className="min-h-screen">
      <nav className="max-w-4xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-5">
          <Link href="/field" className="mono text-xs text-muted hover:text-vet transition-colors">field</Link>
          <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div className="overline mb-3">the agent, working alone</div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-4">
          Vette runs <em className="text-vet">by itself.</em>
        </h1>
        <p className="text-muted leading-relaxed text-sm max-w-2xl mb-8">
          Every day at 06:00 UTC, a cron wakes the engine. No human clicks anything. Vette
          fetches the contest field, then re-checks every entry — is the website still up?
          Is the registered wallet still behaving? Same deterministic reads as every audit,
          run on a schedule.
        </p>

        {/* live self-check */}
        <div className="panel p-6 mb-6">
          <div className="overline mb-4">engine self-check · rendered right now</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted mb-1">status</div>
              <div className="mono text-lg font-bold text-vet">
                {selfStatus === "operational" ? "OPERATIONAL" : "DEGRADED"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">base block</div>
              <div className="mono text-lg font-bold text-soft">{block ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">field entries</div>
              <div className="mono text-lg font-bold text-soft">{entries}</div>
            </div>
          </div>
        </div>

        {/* the loop */}
        <div className="panel p-6 mb-6">
          <div className="overline mb-4">the loop</div>
          <ol className="space-y-3">
            {[
              ["fetch_field()", `read the contest API (${entries} entries right now)`],
              ["check_site()", "is every entry's website still up?"],
              ["check_wallet()", "registered wallets: activity, balance, approval surface"],
              ["report()", "the run summary — visible below when you trigger one"],
              ["repeat", "every day at 06:00 UTC, scheduled by vercel.json — until the contest ends"],
            ].map(([fn, desc], i) => (
              <li key={fn} className="flex gap-5 py-2 border-b border-[#1E241F] last:border-b-0">
                <span className="mono text-xs text-[#3A3A47] w-6 shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="mono text-sm text-vet">{fn}</div>
                  <div className="text-xs text-muted mt-1">{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* run now */}
        <div className="panel p-6 mb-6">
          <div className="overline mb-3">run it now, on demand</div>
          <p className="text-xs text-muted leading-snug mb-4">
            The scheduled runs are on the clock (see vercel.json in the repo). You can also
            wake the agent yourself and watch the run report come back live.
          </p>
          <RunAgentButton />
        </div>

        {/* honest note */}
        <div className="panel p-6">
          <div className="overline mb-3">where the permanent log lives</div>
          <p className="text-xs text-muted leading-relaxed">
            Every run writes its history to the public repo file{" "}
            <span className="mono text-soft">data/agent-log.json</span> (via the GitHub API),
            so anyone can audit Vette&apos;s behavior the way Vette audits everyone else&apos;s.
            That channel activates when the repo is connected; until then, runs execute and
            report live — only the permanent archive is pending. Honest, like everything here.
          </p>
        </div>

        <div className="mono text-[11px] text-muted mt-10 text-center">
          an agent is a schedule, not a screenshot
        </div>
      </div>
    </main>
  );
}
