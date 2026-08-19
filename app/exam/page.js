"use client";

// THE EXAM — "KYC for AI agents." Eight disclosure questions, graded from the
// agent's own public face. Instant, deterministic, no model, no marathon scan:
// the only chain read is one call on Base (is the published wallet a contract?).

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { EXAM_QUESTIONS } from "@/lib/exam";

const VERDICT_STYLE = {
  "REFUSED TO SIT": { badge: "bg-warn/15 text-warn border-warn/40", dot: "bg-warn" },
  FAILED: { badge: "bg-danger/15 text-danger border-danger/40", dot: "bg-danger" },
  PASSED: { badge: "bg-vet/15 text-vet border-vet/40", dot: "bg-vet" },
};

const GRADE_STYLE = {
  DECLARED: "bg-vet/15 text-vet border-vet/40",
  ABSENT: "bg-[#1E241F] text-muted border-line",
  CONTRADICTED: "bg-danger/15 text-danger border-danger/40",
};

export default function ExamPage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function startExam() {
    setError(null);
    setResult(null);
    if (!url.trim()) {
      setError("Paste an agent's website — that's who sits the exam.");
      return;
    }
    setBusy(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "exam failed");
      setResult(data);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The exam timed out — try again, it completes in seconds."
          : String(e.message || e)
      );
    } finally {
      clearTimeout(t);
      setBusy(false);
    }
  }

  const vs = result && !result.unreachable ? VERDICT_STYLE[result.verdict] : null;

  return (
    <main className="min-h-screen">
      <nav className="max-w-4xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-5">
          <Link href="/audit" className="mono text-xs text-muted hover:text-vet transition-colors">audit</Link>
          <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div className="overline mb-3">the exam</div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1D1D26] bg-[#0E0E15] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-vet pulse-dot" />
          <span className="mono text-[10px] tracking-[0.15em] text-muted">LIVE ON BASE · MAINNET</span>
        </div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-4">
          Sit the agent down.
          <br />
          <em className="text-vet">Ask the questions no agent answers.</em>
        </h1>
        <p className="text-muted leading-relaxed text-sm max-w-2xl mb-10">
          KYC for AI agents. Eight questions every agent that moves money should answer:
          operative wallet, control, kill switch, data sources, risk, code, audits, limits.
          Vette grades the agent&apos;s own published words — instantly, deterministically, no
          model, no opinion. The only chain read is one call on <span className="text-soft font-semibold">Base mainnet</span>:
          is the published wallet actually a contract?
        </p>

        <div className="panel p-6 mb-8 space-y-5">
          <div className="overline mb-1">the sheet — eight questions</div>
          <ol className="space-y-2">
            {EXAM_QUESTIONS.map((q, i) => (
              <li key={q.id} className="flex gap-3 text-sm">
                <span className="mono text-muted shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-soft">{q.q}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="panel p-6 mb-8 space-y-4">
          <div className="overline mb-1">who sits</div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="paste any Base agent, website, or X — e.g. aixbt.tech"
            className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm mono outline-none focus:border-vet/60 placeholder:text-[#55555F]"
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => { setUrl("https://aixbt.tech"); }}
              className="mono px-3 py-1.5 rounded-md border border-[#23232E] text-muted hover:border-vet/50 hover:text-vet transition-colors disabled:opacity-40"
            >
              ↳ try: a famous Base agent
            </button>
            <button
              disabled={busy}
              onClick={startExam}
              className="px-6 py-3 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? "GRADING…" : "START THE EXAM →"}
            </button>
          </div>
        </div>

        {error && (
          <div className="panel p-5 border-danger/40 text-danger text-sm mb-8">{error}</div>
        )}

        {busy && (
          <div className="panel p-10 text-center">
            <div className="inline-block w-8 h-8 border-2 border-vet border-t-transparent rounded-full animate-spin mb-4" />
            <p className="mono text-xs text-muted">reading the agent's words → grading every answer</p>
          </div>
        )}

        {result && !result.unreachable && vs && (
          <div className="space-y-5">
            <div className="paper panel p-6">
              <div className="overline mb-3">exam paper · base mainnet</div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`mono inline-flex items-center gap-1.5 rounded-full border font-bold tracking-widest px-5 py-2 text-xs ${vs.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vs.dot} pulse-dot`} />
                  {result.verdict}
                </span>
                <span className="mono text-3xl font-black text-soft">
                  {result.score}
                  <span className="text-muted text-base">/{result.outOf} disclosed</span>
                </span>
              </div>
              <p className="mono text-xs text-muted mt-4 break-all">{result.url}</p>
              {result.title && (
                <p className="serif text-lg text-cream leading-snug mt-4">“{result.title}”</p>
              )}
              <p className="text-sm text-muted leading-relaxed mt-4">{result.note}</p>
              {result.chainRead && (
                <p className="mono text-[11px] text-warn mt-2">{result.chainRead}</p>
              )}
            </div>

            <div>
              <div className="overline mb-3">answers — every grade carries the agent's own words</div>
              <ol className="space-y-3">
                {result.questions.map((q, i) => {
                  const gs = GRADE_STYLE[q.grade] || GRADE_STYLE.ABSENT;
                  return (
                    <li key={q.id} className="panel p-5 border-l-2" style={{ borderLeftColor: q.grade === "CONTRADICTED" ? "#FF5A65" : q.grade === "DECLARED" ? "#C6FF4A" : "#23232E" }}>
                      <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        <span className="mono text-[10px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${gs}`}>{q.grade}</span>
                        <span className="font-bold text-soft text-sm">{q.q}</span>
                      </div>
                      {q.evidence && (
                        <p className="text-xs text-muted leading-relaxed pl-6 mono break-words">{q.evidence}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <p className="mono text-[11px] text-muted text-center">
              grades the agent's own published words, never its intent — disclosure is not endorsement
            </p>
          </div>
        )}

        {result && result.unreachable && (
          <div className="panel p-6 border-warn/40 bg-warn/5">
            <p className="text-sm text-warn font-bold">⚠ The agent didn&apos;t show up.</p>
            <p className="text-sm text-muted leading-relaxed mt-2">{result.note}</p>
          </div>
        )}
      </div>
    </main>
  );
}
