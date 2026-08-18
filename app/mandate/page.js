"use client";

// MandatePage — write your agent's constitution, then make the chain prove it.
// A CREATION tool, not a report tool: pick rules → Vette writes the mandate
// → paste a wallet → every breach is flagged with evidence.
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import VerdictBadge from "@/components/VerdictBadge";

const LEVEL_STYLE = {
  critical: { badge: "bg-danger/15 text-danger border-danger/40", label: "CRITICAL", bar: "#FF5A65" },
  danger: { badge: "bg-danger/15 text-danger border-danger/40", label: "DANGER", bar: "#FF5A65" },
  warning: { badge: "bg-warn/15 text-warn border-warn/40", label: "WARNING", bar: "#FFB020" },
  info: { badge: "bg-[#1E241F] text-muted border-line", label: "INFO", bar: "#1E241F" },
};

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function MandatePage() {
  // rule state
  const [whitelistText, setWhitelistText] = useState("");
  const [neverSell, setNeverSell] = useState(false);
  const [maxPct, setMaxPct] = useState("");
  const [topN, setTopN] = useState(false);

  // audit state
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [mandateText, setMandateText] = useState("");

  const whitelist = whitelistText
    .split(/[\s,]+/)
    .map((s) => s.toUpperCase())
    .filter((s) => s.length >= 2 && s.length <= 8);

  const rules = [];
  if (whitelist.length) rules.push(`only trades ${whitelist.join(", ")}`);
  if (neverSell) rules.push("never sells below entry");
  if (maxPct && /^\d{1,3}$/.test(maxPct)) rules.push(`never risks more than ${maxPct}% of the wallet`);
  if (topN) rules.push("top-20 assets only");

  function buildMandate() {
    if (!rules.length) return "";
    return "The agent " + rules.join("; ") + ".";
  }

  async function verify() {
    setError(null);
    setResult(null);
    const mandate = buildMandate();
    if (!mandate) {
      setError("Pick at least one rule — the mandate needs something to check.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setError("Paste a valid wallet address on Base — that's whose behavior gets checked.");
      return;
    }
    setMandateText(mandate);
    setBusy(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          claims: mandate,
          mandateExplicit: true,
        }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "check failed");
      setResult(data);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The check timed out after 90s — Base RPCs are slow right now. Try again."
          : String(e.message || e)
      );
    } finally {
      clearTimeout(t);
      setBusy(false);
    }
  }

  const deviationFindings = (result?.findings || []).filter((f) =>
    /mandate|whitelist|top-|cap|never|outside/i.test(f.title + " " + (f.detail || ""))
  );

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
        <div className="overline mb-3">the mandate</div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1D1D26] bg-[#0E0E15] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-vet pulse-dot" />
          <span className="mono text-[10px] tracking-[0.15em] text-muted">LIVE ON BASE · MAINNET</span>
        </div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-4">
          Write the rules. <em className="text-vet">Then prove them.</em>
        </h1>
        <p className="text-muted leading-relaxed text-sm max-w-2xl mb-10">
          Every agent needs a constitution — the rules it must never break. Pick yours
          below, Vette writes it, and <span className="text-soft font-semibold">the Base chain answers</span>:
          did the wallet keep the promise? Every check reads Base mainnet directly.
        </p>

        {/* RULE BUILDER */}
        <div className="panel p-6 mb-8 space-y-5">
          <div className="overline mb-1">step 1 · your rules</div>

          <div>
            <label className="text-xs text-muted block mb-2">
              only trades — comma-separated tokens
            </label>
            <input
              value={whitelistText}
              onChange={(e) => setWhitelistText(e.target.value)}
              placeholder="ETH, USDC, BTC"
              className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm mono outline-none focus:border-vet/60 placeholder:text-[#55555F]"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={neverSell}
              onChange={(e) => setNeverSell(e.target.checked)}
              className="w-4 h-4 accent-[#C6FF4A]"
            />
            <span className="text-sm text-soft">never sells below entry</span>
          </label>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={maxPct}
              onChange={(e) => setMaxPct(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="10"
              maxLength={3}
              className="w-20 bg-[#0E0E15] border border-[#23232E] rounded-md px-3 py-2.5 text-sm mono outline-none focus:border-vet/60"
            />
            <span className="text-sm text-muted">% max risk per position</span>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={topN}
              onChange={(e) => setTopN(e.target.checked)}
              className="w-4 h-4 accent-[#C6FF4A]"
            />
            <span className="text-sm text-soft">top-20 assets only</span>
          </label>

          {/* live preview of the mandate */}
          <div className="border border-vet/30 bg-vet/5 rounded-md p-4">
            <div className="mono text-[10px] tracking-widest text-vet mb-2">THE MANDATE, AS WRITTEN</div>
            <p className="serif text-lg text-cream leading-snug">
              {buildMandate() || "pick at least one rule above — the document writes itself."}
            </p>
          </div>
        </div>

        {/* WALLET */}
        <div className="panel p-6 mb-8 space-y-5">
          <div className="overline mb-1">step 2 · whose wallet keeps the promise · on Base</div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… (any wallet on Base mainnet)"
            className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm mono outline-none focus:border-vet/60 placeholder:text-[#55555F]"
          />
          <button
            disabled={busy || !rules.length || !/^0x[a-fA-F0-9]{40}$/.test(address.trim())}
            onClick={verify}
            className="w-full py-3.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {busy ? "CHECKING AGAINST THE CHAIN…" : "VERIFY THE MANDATE →"}
          </button>
        </div>

        {error && <div className="panel p-5 border-danger/40 text-danger text-sm mb-8">{error}</div>}

        {busy && (
          <div className="panel p-10 text-center">
            <div className="inline-block w-8 h-8 border-2 border-vet border-t-transparent rounded-full animate-spin mb-4" />
            <p className="mono text-xs text-muted">reading the wallet → checking every rule → ruling</p>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="paper panel p-6">
              <div className="overline mb-3">mandate ruling · base mainnet</div>
              <div className="flex items-center gap-3 flex-wrap">
                <VerdictBadge verdict={result.verdict} size="lg" icon stamp />
                {result.score != null && (
                  <span className="mono text-3xl font-black text-soft">
                    {result.score}
                    <span className="text-muted text-base">/100</span>
                  </span>
                )}
              </div>
              <p className="mono text-xs text-muted mt-4 break-all">{result.address}</p>
              <p className="serif text-lg text-cream leading-snug mt-4">“{mandateText}”</p>
            </div>

            {deviationFindings.length > 0 ? (
              <div>
                <div className="overline mb-3">breaches — every one carries evidence</div>
                <ol className="space-y-3">
                  {deviationFindings.map((f, i) => {
                    const s = LEVEL_STYLE[f.level] || LEVEL_STYLE.info;
                    return (
                      <li key={i} className="panel p-5 border-l-2" style={{ borderLeftColor: s.bar }}>
                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                          <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${s.badge}`}>{s.label}</span>
                          <span className="font-bold text-soft text-sm">{f.title}</span>
                        </div>
                        <p className="text-sm text-muted leading-relaxed mb-2 pl-6">{f.detail}</p>
                        {f.evidence && (
                          <a
                            href={f.evidence.type === "tx"
                              ? `https://base.blockscout.com/tx/${f.evidence.value}`
                              : `https://base.blockscout.com/address/${f.evidence.value}`}
                            target="_blank" rel="noreferrer"
                            className="mono text-xs text-vet hover:underline pl-6"
                          >
                            ⟶ evidence on Blockscout
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <div className="panel p-6 border-vet/30 bg-vet/5">
                <p className="text-sm text-vet font-bold">
                  ✓ No breaches found in the scanned window — the wallet kept the promise.
                </p>
                <p className="mono text-[11px] text-muted mt-2">
                  {result.scopeLabel ? `scope: ${result.scopeLabel}` : ""}
                </p>
              </div>
            )}

            <p className="mono text-[11px] text-muted text-center">
              every breach carries a receipt on Base — the evidence is in the full report
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
