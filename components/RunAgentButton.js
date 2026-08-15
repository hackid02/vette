"use client";

// RunAgentButton — wakes the agent on demand and renders the run report live.
import { useState } from "react";

export default function RunAgentButton() {
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);

  async function runNow() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setRun(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch("/api/cron/field-watch", {
        method: "POST",
        signal: ctrl.signal,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "run failed");
      setRun(d.run);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The run timed out after 60s — the field or the chain is slow right now."
          : String(e.message || e)
      );
    } finally {
      clearTimeout(t);
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={runNow}
        disabled={busy}
        className="px-6 py-3 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {busy ? "VETTE IS RUNNING…" : "RUN THE AGENT NOW →"}
      </button>

      {error && <p className="text-xs text-danger leading-snug mt-3">{error}</p>}

      {run && (
        <div className="mt-5 border-t border-[#1E241F] pt-5">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="mono text-[10px] px-2.5 py-1 rounded border border-vet/40 text-vet">
              RUN {run.id.toUpperCase()}
            </span>
            <span className="mono text-[11px] text-muted">{new Date(run.at).toLocaleString()} · {run.reason}</span>
            {run.persisted ? (
              <span className="mono text-[10px] px-2.5 py-1 rounded border border-vet/40 text-vet">LOGGED TO REPO</span>
            ) : (
              <span className="mono text-[10px] px-2.5 py-1 rounded border border-[#1E241F] text-muted">permanent log pending repo</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              ["entries checked", run.entriesChecked],
              ["base block", run.block ?? "—"],
              ["sites up", run.checks.filter((c) => c.site?.note === "up").length],
              ["active wallets", run.checks.filter((c) => c.wallet?.note === "active").length],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-muted mb-1">{k}</div>
                <div className="mono text-lg font-bold text-soft">{v}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {run.checks.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border border-[#1E241F] bg-[#0E0E15] rounded-md p-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-soft truncate">{c.name}</div>
                  <div className="mono text-[11px] text-muted truncate">{c.website || "no website"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`mono text-[11px] font-bold ${c.site?.note === "up" ? "text-vet" : "text-warn"}`}>
                    site: {c.site?.note || "?"}{c.site?.status ? ` ${c.site.status}` : ""}
                  </div>
                  <div className={`mono text-[11px] font-bold ${c.wallet?.note === "active" ? "text-vet" : "text-muted"}`}>
                    wallet: {c.wallet?.note || "?"}{c.wallet?.txCount != null ? ` · ${c.wallet.txCount} txs` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
