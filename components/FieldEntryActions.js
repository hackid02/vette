"use client";

// FieldEntryActions — the interactive part of one field card.
// Server renders the card; this component runs the audit on demand.
// Listens for the global "vette:vet-all" event (fired by VetAllButton).
import { useState, useEffect, useRef } from "react";
import VerdictBadge from "@/components/VerdictBadge";

const LEVEL = {
  critical: ["bg-danger/15 text-danger border-danger/40", "CRITICAL"],
  danger: ["bg-danger/15 text-danger border-danger/40", "DANGER"],
  warning: ["bg-warn/15 text-warn border-warn/40", "WARNING"],
  info: ["bg-[#1E241F] text-muted border-line", "INFO"],
};

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

export default function FieldEntryActions({ entry }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);

  async function vet() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setResult(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: entry.website || null,
          address: entry.wallet || null,
          claims: entry.description || null,
          mandateExplicit: false, // contest copy is displayed, never ruled on
        }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "audit failed");
      setResult(data);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The audit timed out after 60s — Base or the site being vetted is slow. Try again."
          : String(e.message || e)
      );
    } finally {
      clearTimeout(t);
      busyRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    function onVetAll() {
      vet();
    }
    window.addEventListener("vette:vet-all", onVetAll);
    return () => window.removeEventListener("vette:vet-all", onVetAll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          disabled={busy}
          onClick={vet}
          className="px-5 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "VETTING…" : "VET THIS ENTRY →"}
        </button>
        <span className="text-xs text-muted">their words vs. their chain</span>
      </div>

      {error && (
        <p className="text-xs text-danger leading-snug mt-3">{error}</p>
      )}

      {result && (
        <div className="mt-4 border-t border-[#1E241F] pt-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <VerdictBadge verdict={result.verdict} size="lg" icon />
            {result.score != null && (
              <span className="mono text-2xl font-black text-soft">
                {result.score}
                <span className="text-muted text-sm">/100</span>
              </span>
            )}
          </div>
          {result.notes && result.notes.length > 0 && (
            <p className="text-xs text-muted leading-relaxed">{result.notes[0]}</p>
          )}
          <div className="space-y-2">
            {(result.findings || []).slice(0, 3).map((f, i) => {
              const [badge, label] = LEVEL[f.level] || LEVEL.info;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`mono text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${badge}`}>{label}</span>
                  <span className="text-xs text-muted leading-relaxed">{f.title}</span>
                </div>
              );
            })}
          </div>
          <p className="mono text-[11px] text-muted">
            every verdict → a receipt · target wallet: {result.address ? short(result.address) : "none published"}
          </p>
        </div>
      )}
    </div>
  );
}
