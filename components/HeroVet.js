"use client";

// HeroVet — the audit lives IN the hero. Paste → VET IT → the verdict
// renders right here on the main page. No navigation, no second click.
import { useState } from "react";
import Link from "next/link";
import VerdictBadge from "@/components/VerdictBadge";
import ShareCard from "@/components/ShareCard";

const LEVEL = {
  critical: ["bg-danger/15 text-danger border-danger/40", "CRITICAL", "#FF5A65"],
  danger: ["bg-danger/15 text-danger border-danger/40", "DANGER", "#FF5A65"],
  warning: ["bg-warn/15 text-warn border-warn/40", "WARNING", "#FFB020"],
  info: ["bg-[#1E241F] text-muted border-line", "INFO", "#1E241F"],
};

const isAddr = (v) => /^0x[a-fA-F0-9]{40}$/.test(v);
const isUrl = (v) => /^https?:\/\//i.test(v);
const looksLikeDomain = (v) => /^[\w-]+(\.[\w-]+){1,}(\/\S*)?$/.test(v);

function buildBody(v) {
  if (isAddr(v)) return { address: v };
  if (isUrl(v)) return { url: v };
  if (looksLikeDomain(v)) return { url: "https://" + v };
  return { url: v };
}

function ResultCard({ a }) {
  const fullLink = a.address
    ? `/audit?address=${a.address}`
    : `/audit?url=${encodeURIComponent(a.url || a.target)}`;
  const revokable = (a.actions || []).filter((x) => x.type === "revoke").length;

  return (
    <div id="hero-result" className="text-left">
      <div className="panel p-6 sm:p-8 border-vet/30">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="overline mb-3">vette says</div>
            <div className="flex items-center gap-3 flex-wrap">
              <VerdictBadge verdict={a.verdict} size="lg" icon />
              {a.score != null && (
                <span className="mono text-3xl font-black text-soft">
                  {a.score}
                  <span className="text-muted text-base">/100</span>
                </span>
              )}
            </div>
            {a.scopeLabel && a.wallet && (
              <p className="mono text-[11px] text-muted mt-2">scope: {a.scopeLabel}</p>
            )}
            <p className="mono text-xs text-muted mt-3 break-all">{a.target}</p>
          </div>
          <Link
            href={fullLink}
            className="shrink-0 px-5 py-3 rounded-md border border-vet/40 text-vet font-bold text-sm hover:bg-vet hover:text-ink transition-colors"
          >
            open the full report →
          </Link>
        </div>

        {a.narrative && a.narrative.length > 0 && (
          <p className="text-sm text-muted leading-relaxed mt-5">
            {a.narrative[1] || a.narrative[0]}
          </p>
        )}

        {a.findings && a.findings.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {a.findings.slice(0, 3).map((f, i) => {
              const [badge, label, bar] = LEVEL[f.level] || LEVEL.info;
              return (
                <li key={i} className="border border-[#1E241F] bg-[#0E0E15] rounded-md p-3.5 border-l-2" style={{ borderLeftColor: bar }}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`mono text-[9px] font-bold px-2 py-0.5 rounded border tracking-widest ${badge}`}>{label}</span>
                    <span className="text-sm font-bold text-soft">{f.title}</span>
                  </div>
                  {f.evidence && (
                    <a
                      href={f.evidence.type === "tx"
                        ? `https://base.blockscout.com/tx/${f.evidence.value}`
                        : `https://base.blockscout.com/address/${f.evidence.value}`}
                      target="_blank" rel="noreferrer"
                      className="mono text-[11px] text-vet hover:underline"
                    >
                      ⟶ evidence on Blockscout: {f.evidence.value?.slice(0, 14)}…
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 mt-6 pt-5 border-t border-[#1E241F]">
          <span className="mono text-[11px] text-muted">
            every verdict → a receipt · {a.trace?.length || 0} checks in the receipt
          </span>
          <ShareCard verdict={a.verdict} score={a.score} target={a.target} cardSig={a.cardSig} />
          {revokable > 0 && (
            <Link
              href={fullLink}
              className="mono text-xs px-4 py-2 rounded-md bg-danger text-white font-bold hover:opacity-90 transition-opacity"
            >
              ⚡ {revokable} kill switch{revokable > 1 ? "es" : ""} ready — connect to revoke
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeroVet() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function run(e) {
    e.preventDefault();
    const v = q.trim();
    if (!v || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    fetch("/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildBody(v)),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || d.detail || "Audit failed");
        setResult(d);
        setTimeout(() => {
          document.getElementById("hero-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      })
      .catch((e) => setError(String(e.message || e)))
      .finally(() => setBusy(false));
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <form
        onSubmit={run}
        className="flex items-center gap-2 rounded-md border border-[#23232E] bg-[#0E0E15] p-2 focus-within:border-vet/50 transition-colors"
      >
        <span className="mono text-vet pl-3 text-sm shrink-0">▸</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="paste any Base agent, website, or wallet — e.g. aixbt.tech"
          className="flex-1 bg-transparent outline-none text-sm text-soft placeholder:text-[#55555F] min-w-0"
        />
        <button
          type="submit"
          disabled={!q.trim() || busy}
          className="shrink-0 px-4 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {busy ? "VETTING…" : "VET IT →"}
        </button>
      </form>

      {error && (
        <p className="text-left text-xs text-danger mt-3 leading-snug">{error}</p>
      )}

      {busy && (
        <div className="panel p-8 mt-5 text-center">
          <div className="inline-block w-7 h-7 border-2 border-vet border-t-transparent rounded-full animate-spin mb-3" />
          <p className="mono text-xs text-muted">fetching site → reading Base → applying rules…</p>
        </div>
      )}

      {result && !busy && <div className="mt-5"><ResultCard a={result} /></div>}
    </div>
  );
}
