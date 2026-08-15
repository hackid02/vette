"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import VerdictBadge from "@/components/VerdictBadge";

const LEVEL_STYLE = {
  critical: { badge: "bg-danger/15 text-danger border-danger/40", label: "CRITICAL" },
  danger: { badge: "bg-danger/15 text-danger border-danger/40", label: "DANGER" },
  warning: { badge: "bg-warn/15 text-warn border-warn/40", label: "WARNING" },
  info: { badge: "bg-[#1E241F] text-muted border-line", label: "INFO" },
};

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

function EntryResult({ a, entryName }) {
  if (!a) return null;
  return (
    <div className="mt-4 border-t border-[#1E241F] pt-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <VerdictBadge verdict={a.verdict} size="lg" icon />
        {a.score != null && <span className="mono text-2xl font-black text-soft">{a.score}<span className="text-muted text-sm">/100</span></span>}
      </div>
      {a.notes && a.notes.length > 0 && (
        <p className="text-xs text-muted leading-relaxed">{a.notes[0]}</p>
      )}
      <div className="space-y-2">
        {a.findings.slice(0, 3).map((f, i) => {
          const s = LEVEL_STYLE[f.level] || LEVEL_STYLE.info;
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`mono text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${s.badge}`}>{s.label}</span>
              <span className="text-xs text-muted leading-relaxed">{f.title}</span>
            </div>
          );
        })}
      </div>
      <p className="mono text-[11px] text-muted">
        every claim → a tool call · target wallet: {a.address ? short(a.address) : "none published"}
      </p>
    </div>
  );
}

function EntryCard({ e, vetting, onVet }) {
  return (
    <div className="panel p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-soft">{e.name}</h3>
          <p className="mono text-xs text-muted mt-1">by {e.builder}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="mono text-[10px] px-2.5 py-1 rounded border border-[#1E241F] text-muted">{e.category}</span>
          <span className="mono text-[10px] px-2.5 py-1 rounded border border-vet/40 text-vet">orion {e.intelligenceScore}</span>
          <span className="mono text-[10px] px-2.5 py-1 rounded border border-[#1E241F] text-muted">{e.votes} votes</span>
        </div>
      </div>

      <p className="text-sm text-muted leading-relaxed line-clamp-3">{e.description}</p>

      <div className="mono text-xs text-muted space-y-1">
        <p>wallet (registered with Orion): <span className="text-soft">{short(e.wallet)}</span></p>
        <p>
          links:{" "}
          {e.website && <a href={e.website} target="_blank" rel="noreferrer" className="text-vet hover:underline">site</a>}
          {" · "}
          {e.demo && <a href={e.demo} target="_blank" rel="noreferrer" className="text-vet hover:underline">demo</a>}
          {" · "}
          {e.socials.github && <a href={e.socials.github} target="_blank" rel="noreferrer" className="text-vet hover:underline">github</a>}
          {" · "}
          {e.socials.twitter && <a href={e.socials.twitter} target="_blank" rel="noreferrer" className="text-vet hover:underline">x</a>}
        </p>
      </div>

      <div className="flex items-center gap-3 mt-auto">
        <button
          disabled={vetting}
          onClick={onVet}
          className="px-5 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {vetting ? "VETTING…" : "VET THIS ENTRY →"}
        </button>
        <span className="text-xs text-muted">their words vs. their chain</span>
      </div>
    </div>
  );
}

export default function FieldPage() {
  const [entries, setEntries] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [results, setResults] = useState({}); // entryId -> audit
  const [busy, setBusy] = useState({}); // entryId -> true
  const [batch, setBatch] = useState(false);

  useEffect(() => {
    fetch("/api/field")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setEntries(d.entries);
      })
      .catch((e) => setLoadError(String(e.message || e)));
  }, []);

  async function vetEntry(e) {
    setBusy((b) => ({ ...b, [e.id]: true }));
    setResults((r) => ({ ...r, [e.id]: null }));
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: e.website || null,
          address: e.wallet || null,
          claims: e.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "audit failed");
      setResults((r) => ({ ...r, [e.id]: data }));
    } catch (err) {
      setResults((r) => ({ ...r, [e.id]: { error: String(err.message || err) } }));
    } finally {
      setBusy((b) => ({ ...b, [e.id]: false }));
    }
  }

  async function vetAll() {
    if (!entries || batch) return;
    setBatch(true);
    for (const e of entries) {
      if (results[e.id]) continue;
      await vetEntry(e);
      await new Promise((r) => setTimeout(r, 400));
    }
    setBatch(false);
  }

  return (
    <main className="min-h-screen">
      <nav className="max-w-5xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="overline mb-3">the field, under vette</div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-4">
          Every entry. <em className="text-vet">Under the lens.</em>
        </h1>
        <p className="text-muted leading-relaxed text-sm max-w-2xl mb-8">
          Vette takes each contest entry <span className="text-soft">exactly as the contest registered it</span> —
          the builder's own words, their registered wallet, their website — and rules on whether
          behavior matches promise. Same rubric the judges use: usefulness, execution, originality.
          Every claim traces to a tool call.
        </p>

        {loadError && (
          <div className="panel p-5 border-danger/40 text-danger text-sm mb-8">
            Couldn't load the field: {loadError}
          </div>
        )}

        {entries && (
          <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
            <p className="mono text-xs text-muted">
              {entries.length} entries live on the Orion API
            </p>
            <button
              disabled={batch}
              onClick={vetAll}
              className="px-5 py-2.5 rounded-md border border-vet/40 text-vet font-bold text-sm hover:bg-vet hover:text-ink transition-colors disabled:opacity-40"
            >
              {batch ? "VETTING THE WHOLE FIELD…" : "VET THE WHOLE FIELD →"}
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {(entries || []).map((e) => {
            const r = results[e.id];
            return (
              <div key={e.id}>
                <EntryCard e={e} vetting={!!busy[e.id]} onVet={() => vetEntry(e)} />
                {r && r.error ? (
                  <div className="panel p-4 mt-2 text-danger text-xs border-danger/40">{r.error}</div>
                ) : r ? (
                  <div className="panel p-4 mt-2">{<EntryResult a={r} entryName={e.name} />}</div>
                ) : null}
              </div>
            );
          })}
          {entries && entries.length === 0 && (
            <div className="panel p-10 text-center col-span-2">
              <p className="text-muted">No entries on the API yet. Vette will be ready when the field grows.</p>
            </div>
          )}
          {!entries && !loadError && (
            <div className="panel p-10 text-center col-span-2">
              <div className="inline-block w-7 h-7 border-2 border-vet border-t-transparent rounded-full animate-spin" />
              <p className="mono text-xs text-muted mt-4">loading the field from Orion…</p>
            </div>
          )}
        </div>

        <div className="mono text-[11px] text-muted mt-12 text-center leading-relaxed">
          data: Orion public API · audits: Vette deterministic engine on Base<br />
          <span className="text-[#55555F]">Vette never invents. If a wallet is empty, the verdict is UNVERIFIABLE — not flattering, and not fiction.</span>
        </div>
      </div>
    </main>
  );
}
