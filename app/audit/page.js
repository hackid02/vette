"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import VerdictBadge from "@/components/VerdictBadge";
import ConnectWallet from "@/components/ConnectWallet";
import RevokeButton from "@/components/RevokeButton";
import ShareCard from "@/components/ShareCard";

const LEVEL_STYLE = {
  critical: { badge: "bg-danger/15 text-danger border-danger/40", label: "CRITICAL" },
  danger: { badge: "bg-danger/15 text-danger border-danger/40", label: "DANGER" },
  warning: { badge: "bg-warn/15 text-warn border-warn/40", label: "WARNING" },
  info: { badge: "bg-[#1D1D26] text-muted border-line", label: "INFO" },
};

const DEMO = "0x61e17391f084ad083FA5C199D4F0d350A4CF4282";

// real JSON for receipt fields — never "[object Object]"
function pretty(v) {
  if (v == null) return "null";
  let s;
  if (typeof v === "string") s = v;
  else {
    try {
      s = JSON.stringify(v);
    } catch {
      s = String(v);
    }
  }
  return s.length > 160 ? s.slice(0, 160) + "…" : s;
}

function Report({ a, account, provider, onRevoked }) {
  return (
    <div className="space-y-6">
      {/* report header */}
      <div className="paper panel p-7">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="overline">VETTE REPORT</div>
          <div className="mono text-xs text-muted">№ {a.traceId}</div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <VerdictBadge verdict={a.verdict} size="lg" icon />
            <p className="mono text-xs text-muted mt-4 break-all">{a.target}</p>
            <p className="mono text-[11px] text-muted mt-1">{new Date(a.ts).toLocaleString()}</p>
            <div className="mt-4">
              <ShareCard verdict={a.verdict} score={a.score} target={a.target} />
            </div>
          </div>
          {a.score != null && (
            <div className="text-right">
              <div className="mono text-6xl font-black text-soft leading-none">{a.score}</div>
              <div className="overline mt-2">/ 100</div>
            </div>
          )}
        </div>
      </div>

      {/* snapshot */}
      {a.wallet && (
        <div className="panel p-6">
          <div className="overline mb-4">onchain snapshot</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              ["Indexed txs", a.wallet.txCount],
              ["Token transfers", a.wallet.transferCount],
              ["Open approvals", a.wallet.openApprovals],
              ["Balance", a.wallet.balanceEth],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-muted mb-1.5">{k}</div>
                <div className="mono text-xl font-bold text-soft">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* findings */}
      {a.findings.length > 0 && (
        <div>
          <div className="overline mb-3">findings — every one traces to a real check</div>
          <ol className="space-y-3">
            {a.findings.map((f, i) => {
              const s = LEVEL_STYLE[f.level] || LEVEL_STYLE.info;
              const bar =
                f.level === "critical" || f.level === "danger" ? "#FF4D5E" : f.level === "warning" ? "#FFB020" : "#1D1D26";
              return (
                <li key={i} className="panel p-5 border-l-2" style={{ borderLeftColor: bar }}>
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="mono text-xs text-[#3A3A47]">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${s.badge}`}>{s.label}</span>
                    <span className="font-bold text-soft text-sm">{f.title}</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed mb-3 pl-6">{f.detail}</p>
                  {f.evidence && (
                    <a
                      href={f.evidence.type === "tx"
                        ? `https://base.blockscout.com/tx/${f.evidence.value}`
                        : `https://base.blockscout.com/address/${f.evidence.value}`}
                      target="_blank" rel="noreferrer"
                      className="mono text-xs text-vet hover:underline pl-6"
                    >
                      ⟶ {f.evidence.label}: {f.evidence.value?.slice(0, 14)}… on Blockscout
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* narrative */}
      <div className="panel p-6">
        <div className="overline mb-4">the verdict, in plain english</div>
        <div className="space-y-3 text-sm leading-relaxed text-soft">
          {a.narrative.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      </div>

      {/* actions */}
      {a.actions.length > 0 && (
        <div className="panel p-6">
          <div className="overline mb-4">what vette would do next</div>
          <ul className="space-y-4">
            {a.actions.map((act, i) =>
              act.type === "revoke" ? (
                <li key={i}>
                  <RevokeButton
                    action={act}
                    account={account}
                    provider={provider}
                    owner={a.address}
                    onRevoked={onRevoked}
                  />
                </li>
              ) : (
                <li key={i} className="flex items-start gap-3 text-sm text-soft">
                  <span className="mono text-vet shrink-0">→</span>
                  <span>{act.label}</span>
                </li>
              )
            )}
          </ul>
          {account && a.address && account.toLowerCase() !== a.address.toLowerCase() && (
            <p className="text-[11px] text-muted mt-4 leading-snug">
              You&apos;re auditing someone else&apos;s wallet — only the owner&apos;s signature can revoke.
              Vette audits anyone; the kill switch belongs to the owner. Vet your own wallet to use it.
            </p>
          )}
        </div>
      )}

      {/* inline receipt — survives any deployment */}
      {a.trace && a.trace.length > 0 && (
        <div id="receipt" className="panel p-6">
          <div className="overline mb-4">the receipt — every tool call, real input, real output</div>
          <ol className="space-y-3">
            {a.trace.map((s) => (
              <li key={s.i} className="border border-[#1E241F] bg-[#0E0E15] rounded-md p-4">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="mono text-xs px-2 py-0.5 rounded bg-[#10140F] border border-[#1E241F] text-vet">{s.i}</span>
                  <span className="mono text-sm font-bold text-soft">{s.tool}</span>
                </div>
                {s.note && <p className="text-xs text-muted mb-2">{s.note}</p>}
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#10140F] border border-[#1E241F] rounded p-3">
                    <div className="mono text-muted mb-1.5">INPUT</div>
                    <pre className="mono text-soft whitespace-pre-wrap break-all">{pretty(s.input)}</pre>
                  </div>
                  <div className="bg-[#10140F] border border-[#1E241F] rounded p-3">
                    <div className="mono text-muted mb-1.5">OUTPUT</div>
                    <pre className="mono text-soft whitespace-pre-wrap break-all">{pretty(s.output)}</pre>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mono text-[11px] text-muted text-center mt-6">
            — END OF TRACE — <span className="text-[#55555F]">verified by a deterministic engine, not vibes</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <a href="#receipt" className="px-6 py-3.5 rounded-md bg-vet text-ink font-extrabold hover:opacity-90 transition-opacity">
          See the receipt ↓
        </a>
        <span className="mono text-[11px] text-muted">
          the receipt below is the canonical one — rendered from this very audit
        </span>
      </div>
    </div>
  );
}

function AuditInner() {
  const sp = useSearchParams();
  const [url, setUrl] = useState(sp.get("url") || "");
  const [address, setAddress] = useState(sp.get("address") || "");
  const [claims, setClaims] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  async function run(body) {
    setBusy(true);
    setError(null);
    setResult(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Audit failed");
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The audit timed out after 90s — Base RPCs are slow right now. Try again in a moment."
          : String(e.message || e)
      );
    } finally {
      clearTimeout(t);
      setBusy(false);
    }
  }

  async function vetMyWallet() {
    if (!account) return; // connect happens in the ConnectWallet picker, nowhere else
    setError(null);
    setAddress(account);
    setUrl("");
    await run({ address: account, url: null, claims: null });
  }

  function handleRevoked() {
    if (account) run({ address: account, url: null, claims: null });
  }

  return (
    <main className="min-h-screen">
      <nav className="max-w-4xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-5">
          <Link href="/field" className="mono text-xs text-muted hover:text-vet transition-colors">field</Link>
          <Link href="/guard" className="mono text-xs text-muted hover:text-vet transition-colors">guard</Link>
          <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div className="overline mb-3">audit console</div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-3">
          Vet an agent<span className="text-vet">.</span>
        </h1>
        <p className="text-muted text-sm leading-relaxed mb-6">
          Website, X, or wallet — with the agent&apos;s own promises if you have them. Real
          fetches, real RPC. 10–30 seconds. No shortcuts, no invention.
        </p>

        {/* wallet bar — audit yourself + the kill switch */}
        <div className="panel p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex flex-col gap-1">
            <span className="overline">your wallet</span>
            <span className="text-xs text-muted leading-snug">
              Connect → Vette audits YOU → dangerous approvals get a kill switch.
              One click, one signature, threat dead.
            </span>
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <ConnectWallet
              account={account}
              onConnect={({ account: acc, provider: p }) => {
                setAccount(acc);
                setProvider(p);
              }}
              onDisconnect={() => {
                setAccount(null);
                setProvider(null);
              }}
            />
            <button
              disabled={busy || !account}
              onClick={vetMyWallet}
              title={!account ? "Connect your wallet first" : "Audit the connected wallet"}
              className="px-4 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              VET MY WALLET →
            </button>
          </div>
        </div>

        <div className="panel p-6 space-y-5 mb-8">
          <div>
            <label className="overline block mb-2">agent website</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://agent.example.com"
              className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm outline-none focus:border-vet/60 placeholder:text-[#55555F]"
            />
          </div>
          <div>
            <label className="overline block mb-2">wallet address on base</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x…"
              className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm mono outline-none focus:border-vet/60 placeholder:text-[#55555F]"
            />
          </div>
          <div>
            <label className="overline block mb-2">the agent&apos;s own promises (its mandate)</label>
            <textarea
              value={claims}
              onChange={(e) => setClaims(e.target.value)}
              rows={2}
              placeholder='e.g. "never sells below entry, only trades top-20 tokens, never risks more than 10% of the wallet"'
              className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm outline-none focus:border-vet/60 placeholder:text-[#55555F] resize-none"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <button
                disabled={busy}
                onClick={() => { setUrl("https://base-scout-seven.vercel.app/"); setAddress(""); }}
                className="mono px-3 py-1.5 rounded-md border border-[#23232E] text-muted hover:border-vet/50 hover:text-vet transition-colors disabled:opacity-40"
              >
                ↳ try: a live contest entry
              </button>
              <button
                disabled={busy}
                onClick={() => { setAddress(DEMO); setUrl(""); }}
                className="mono px-3 py-1.5 rounded-md border border-danger/40 text-danger hover:bg-danger hover:text-white transition-colors disabled:opacity-40"
              >
                🎯 the wallet Vette caught
              </button>
            </div>
            <button
              disabled={busy || (!url.trim() && !address.trim())}
              onClick={() => run({ url: url.trim() || null, address: address.trim() || null, claims: claims.trim() || null })}
              className="px-6 py-3 rounded-md bg-vet text-ink font-extrabold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? "VETTING…" : "VET THIS →"}
            </button>
          </div>
          <p className="text-xs text-muted">
            No wallet? Vette still checks the site — and says <span className="mono text-soft">UNVERIFIABLE</span> rather than invent onchain facts.
          </p>
        </div>

        {error && (
          <div className="panel p-5 border-danger/40 text-danger text-sm mb-8">{error}</div>
        )}

        {busy && !result && (
          <div className="panel p-12 text-center">
            <div className="inline-block w-9 h-9 border-2 border-vet border-t-transparent rounded-full animate-spin mb-5" />
            <p className="mono text-xs text-muted leading-relaxed">
              fetching site → reading Base → decoding approvals → applying rules
            </p>
          </div>
        )}

        {result && (
          <Report
            a={result}
            account={account}
            provider={provider}
            onRevoked={handleRevoked}
          />
        )}
      </div>
    </main>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-10">
            <Logo size={24} />
            <span className="overline">audit console</span>
          </div>
          <div className="panel p-10 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-vet border-t-transparent rounded-full animate-spin" />
            <p className="mono text-xs text-muted">loading the console…</p>
          </div>
        </div>
      </main>
    }>
      <AuditInner />
    </Suspense>
  );
}
