"use client";

// THE ALIBI — "Every court needs a defense."
// Accuse any wallet. Vette rebuilds the money-trail from Base and shows where
// every coin went, hop by hop. Deterministic. Motive is a matter for humans —
// the trail is a matter of receipts.

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const VERDICT_STYLE = {
  "THE MONEY CAME HOME": { badge: "bg-vet/15 text-vet border-vet/40", dot: "bg-vet" },
  "THE MONEY LEFT": { badge: "bg-danger/15 text-danger border-danger/40", dot: "bg-danger" },
  "TRAIL TOO SHALLOW": { badge: "bg-warn/15 text-warn border-warn/40", dot: "bg-warn" },
};

const HOP_STYLE = {
  RETURNED: "bg-vet/15 text-vet border-vet/40",
  "SENT ON": "bg-danger/15 text-danger border-danger/40",
  RESTING: "bg-warn/15 text-warn border-warn/40",
  CONVERTED: "bg-[#1E241F] text-muted border-line",
};

const GROK_CASE = {
  label: "case file 001 — the grok defense",
  charge: "May 4, 2026: the wallet labeled “Grok” on Base lost ~$175K in DRB. Accused: the agent wallet was drained — the money is gone.",
  verdict: "THE MONEY CAME HOME",
  summary:
    "3,000,000,000 DRB left the Grok wallet (0xb1058c…e4f9) to an attacker's intermediate wallet (0xe8e476…686b), moved onward to ilhamrafli.base.eth and dumped into USDC. Within hours the attacker returned ~80–88% of the value in ETH and USDC. Today the wallet holds ~16 ETH — the money is home.",
  hops: [
    { step: "OUT", detail: "3B DRB → 0xe8e476bdd78b0aa6669509ec8d3e1c542d5a686b (attacker intermediate)", label: "SENT ON" },
    { step: "HOP", detail: "DRB onward → ilhamrafli.base.eth, swapped to USDC across wallets", label: "CONVERTED" },
    { step: "IN", detail: "ETH + USDC returned → 0xb1058c…e4f9 (the accused)", label: "RETURNED" },
  ],
  note: "Prompt-injection exploit via the Bankr agent (publicly documented — SlowMist classified it 'AI agent permission chain abuse'). The trail shows a third-party exploit, and the value came home. Vette rebuilds what the chain shows.",
  address: "0xb1058c959987e3513600eb5b4fd82aeee2a0e4f9",
};

export default function AlibiPage() {
  const [address, setAddress] = useState("");
  const [charge, setCharge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function run() {
    setError(null);
    setResult(null);
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setError("Paste a valid wallet address on Base — that's the accused.");
      return;
    }
    setBusy(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 55000);
    try {
      const res = await fetch("/api/alibi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: address.trim(), charge: charge.trim() }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "alibi failed");
      setResult(data);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The trail rebuild timed out — the chain is slow right now. Try again."
          : String(e.message || e)
      );
    } finally {
      clearTimeout(t);
      setBusy(false);
    }
  }

  const vs = result ? VERDICT_STYLE[result.verdict] : null;

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
        <div className="overline mb-3">the alibi</div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1D1D26] bg-[#0E0E15] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-vet pulse-dot" />
          <span className="mono text-[10px] tracking-[0.15em] text-muted">LIVE ON BASE · MAINNET</span>
        </div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-4">
          Every court needs
          <br />
          <em className="text-vet">a defense.</em>
        </h1>
        <p className="text-muted leading-relaxed text-sm max-w-2xl mb-10">
          Accuse any wallet. Vette rebuilds its money-trail from <span className="text-soft font-semibold">Base mainnet</span> —
          every inflow, every outflow, and where each coin went next — and hands back the
          receipts. Convict <em>and</em> acquit. Vette never decides motive: the trail is a
          matter of receipts, not opinions.
        </p>

        {/* CASE FILE */}
        <div className="panel p-6 mb-8 space-y-5 border-vet/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="overline">📁 {GROK_CASE.label}</div>
            <button
              disabled={busy}
              onClick={() => { setAddress(GROK_CASE.address); setCharge(GROK_CASE.charge); }}
              className="mono text-[10px] px-2.5 py-1 rounded-full border border-vet/40 text-vet hover:bg-vet hover:text-ink transition-colors"
            >
              USE THIS CASE ↓
            </button>
          </div>
          <p className="text-sm text-soft leading-relaxed">{GROK_CASE.charge}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="mono inline-flex items-center gap-1.5 rounded-full border font-bold tracking-widest px-5 py-2 text-xs bg-vet/15 text-vet border-vet/40">
              <span className="w-1.5 h-1.5 rounded-full bg-vet" />
              {GROK_CASE.verdict}
            </span>
            <span className="mono text-[11px] text-muted">on the evidence of the chain</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">{GROK_CASE.summary}</p>
          <ol className="space-y-2">
            {GROK_CASE.hops.map((h, i) => (
              <li key={i} className="flex items-center gap-3 text-sm flex-wrap">
                <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded border ${HOP_STYLE[h.label] || HOP_STYLE.RESTING}`}>{h.label}</span>
                <span className="text-muted">{h.detail}</span>
              </li>
            ))}
          </ol>
          <p className="mono text-[11px] text-muted leading-relaxed">{GROK_CASE.note}</p>
          <a
            href="https://base.blockscout.com/address/0xb1058c959987e3513600eb5b4fd82aeee2a0e4f9"
            target="_blank" rel="noreferrer"
            className="mono text-xs text-vet hover:underline"
          >
            ⟶ the accused on Blockscout
          </a>
        </div>

        {/* LIVE ALIBI */}
        <div className="panel p-6 mb-8 space-y-4">
          <div className="overline mb-1">run a live alibi</div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… (the accused — any wallet on Base)"
            className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm mono outline-none focus:border-vet/60 placeholder:text-[#55555F]"
          />
          <input
            value={charge}
            onChange={(e) => setCharge(e.target.value)}
            placeholder="the charge (optional) — e.g. “it drained its users”"
            className="w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm mono outline-none focus:border-vet/60 placeholder:text-[#55555F]"
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => { setAddress("0x61e17391f084ad083FA5C199D4F0d350A4CF4282"); setCharge(""); }}
              className="mono px-3 py-1.5 rounded-md border border-danger/40 text-danger hover:bg-danger hover:text-white transition-colors disabled:opacity-40"
            >
              🎯 the wallet Vette caught
            </button>
            <button
              disabled={busy}
              onClick={run}
              className="px-6 py-3 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? "REBUILDING THE TRAIL…" : "RUN THE ALIBI →"}
            </button>
          </div>
        </div>

        {error && (
          <div className="panel p-5 border-danger/40 text-danger text-sm mb-8">{error}</div>
        )}

        {busy && (
          <div className="panel p-10 text-center">
            <div className="inline-block w-8 h-8 border-2 border-vet border-t-transparent rounded-full animate-spin mb-4" />
            <p className="mono text-xs text-muted">reading the chain → following every coin → writing the receipt</p>
          </div>
        )}

        {result && vs && (
          <div className="space-y-5">
            <div className="paper panel p-6">
              <div className="overline mb-3">alibi receipt · base mainnet</div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`mono inline-flex items-center gap-1.5 rounded-full border font-bold tracking-widest px-5 py-2 text-xs ${vs.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vs.dot} pulse-dot`} />
                  {result.verdict}
                </span>
                {result.balanceEth != null && (
                  <span className="mono text-sm text-muted">
                    {(Number(result.balanceEth) / 1e18).toFixed(3)} ETH resting in the wallet
                  </span>
                )}
              </div>
              <p className="mono text-xs text-muted mt-4 break-all">{result.address}</p>
              <p className="serif text-lg text-cream leading-snug mt-4">“{result.charge}”</p>
              <p className="text-sm text-muted leading-relaxed mt-4">{result.verdictDetail}</p>
              <p className="mono text-[11px] text-muted mt-3">scope: {result.scope}</p>
              <a href={result.link} target="_blank" rel="noreferrer" className="mono text-xs text-vet hover:underline block mt-2">
                ⟶ the accused on Blockscout
              </a>
            </div>

            {result.hops.length > 0 && (
              <div>
                <div className="overline mb-3">the trail — hop by hop</div>
                <ol className="space-y-3">
                  {result.hops.map((h, i) => (
                    <li key={i} className="panel p-5 border-l-2" style={{ borderLeftColor: h.label === "RETURNED" ? "#C6FF4A" : h.label === "RESTING" ? "#FFB020" : "#FF5A65" }}>
                      <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${HOP_STYLE[h.label] || HOP_STYLE.RESTING}`}>{h.label}</span>
                        <span className="font-bold text-soft text-sm">{h.token || "tokens"} → {h.to?.slice(0, 12)}…</span>
                      </div>
                      <a
                        href={`https://base.blockscout.com/tx/${h.tx}`}
                        target="_blank" rel="noreferrer"
                        className="mono text-xs text-vet hover:underline pl-6"
                      >
                        ⟶ evidence on Blockscout
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="mono text-[11px] text-muted text-center">
              motive is a matter for humans — the trail is a matter of receipts
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
