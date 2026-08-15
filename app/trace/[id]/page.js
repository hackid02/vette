import Link from "next/link";
import Logo from "@/components/Logo";
import VerdictBadge from "@/components/VerdictBadge";
import { getTrace } from "@/lib/trace";

export const dynamic = "force-dynamic";

function shorten(s) {
  if (s == null) return "null";
  const str = typeof s === "string" ? s : JSON.stringify(s);
  return str.length > 120 ? str.slice(0, 120) + "…" : str;
}

export default async function TracePage({ params }) {
  const { id } = await params;
  // traces are filesystem-keyed — only allow our own id format
  const trace = /^v[a-z0-9]{6,24}$/i.test(id || "") ? getTrace(id) : null;

  return (
    <main className="min-h-screen">
      <nav className="max-w-4xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {!trace ? (
          <div className="panel p-12 text-center mt-10">
            <p className="text-muted mb-3">No trace found for <span className="mono text-vet">{id}</span>.</p>
            <p className="text-xs text-muted">Traces live on the server that ran the audit. Run one to see it here.</p>
            <Link href="/audit" className="inline-block mt-5 px-5 py-3 rounded-md bg-vet text-ink font-extrabold">Run an audit →</Link>
          </div>
        ) : (
          <>
            <div className="mt-2 mb-10 paper panel p-7">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div className="overline">VETTE — RECEIPT</div>
                <div className="mono text-xs text-muted">{id}</div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <VerdictBadge verdict={trace.meta.summary?.verdict} size="lg" icon />
                  <p className="mono text-xs text-muted mt-4 break-all">{trace.meta.target}</p>
                </div>
                <div className="text-right">
                  {trace.meta.summary?.score != null && (
                    <div className="mono text-5xl font-black text-soft leading-none">{trace.meta.summary.score}</div>
                  )}
                  <div className="overline mt-2">
                    {trace.steps.length} tool calls · {(trace.meta.durationMs / 1000).toFixed(1)}s · {new Date(trace.meta.startedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-[#1D1D26] text-sm text-muted leading-relaxed">
                🔒 <span className="text-soft font-bold">This is the receipt.</span> Every check Vette ran is listed
                below with its real input and output. If a claim in the verdict isn&apos;t in this list,
                it isn&apos;t a Vette claim.
              </div>
            </div>

            <div className="overline mb-4">tool calls</div>
            <ol className="space-y-3">
              {trace.steps.map((s) => (
                <li key={s.i} className="panel p-5">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className="mono text-xs px-2.5 py-1 rounded bg-[#0E0E15] border border-[#1D1D26] text-vet">{s.i}</span>
                    <span className="mono text-sm font-bold text-soft">{s.tool}</span>
                    <span className="mono text-[11px] text-muted ml-auto">{new Date(s.at).toLocaleTimeString()}</span>
                  </div>
                  {s.note && <p className="text-xs text-muted mb-2.5 pl-9">{s.note}</p>}
                  <div className="grid sm:grid-cols-2 gap-3 text-xs pl-9">
                    <div className="bg-[#0E0E15] border border-[#1D1D26] rounded-md p-3">
                      <div className="mono text-muted mb-1.5">INPUT</div>
                      <pre className="mono text-soft whitespace-pre-wrap break-all">{shorten(s.input)}</pre>
                    </div>
                    <div className="bg-[#0E0E15] border border-[#1D1D26] rounded-md p-3">
                      <div className="mono text-muted mb-1.5">OUTPUT</div>
                      <pre className="mono text-soft whitespace-pre-wrap break-all">{shorten(s.output)}</pre>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mono text-[11px] text-muted text-center mt-10">
              — END OF TRACE —<br />
              <span className="text-[#55555F]">verified by a deterministic engine, not vibes</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
