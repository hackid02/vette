"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import VerdictBadge from "@/components/VerdictBadge";
import ConnectWallet from "@/components/ConnectWallet";
import RevokeButton from "@/components/RevokeButton";

const LEVEL_STYLE = {
  critical: { badge: "bg-danger/15 text-danger border-danger/40", label: "CRITICAL", bar: "#FF5A65" },
  danger: { badge: "bg-danger/15 text-danger border-danger/40", label: "DANGER", bar: "#FF5A65" },
  warning: { badge: "bg-warn/15 text-warn border-warn/40", label: "WARNING", bar: "#FFB020" },
  info: { badge: "bg-[#1E241F] text-muted border-line", label: "INFO", bar: "#1E241F" },
};

const BASELINE_PREFIX = "vette.baseline.";
const STREAK_PREFIX = "vette.streak.";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function readBaseline(addr) {
  try {
    return JSON.parse(localStorage.getItem(BASELINE_PREFIX + addr.toLowerCase()));
  } catch {
    return null;
  }
}

function writeBaseline(addr, list) {
  const b = { savedAt: new Date().toISOString(), approvals: list.map((a) => ({ token: a.token, spender: a.spender })) };
  localStorage.setItem(BASELINE_PREFIX + addr.toLowerCase(), JSON.stringify(b));
  return b;
}

function updateStreak(addr, setStreak) {
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const key = STREAK_PREFIX + addr.toLowerCase();
  const prev = localStorage.getItem(key);
  let n = 1;
  if (prev) {
    const [d, v] = prev.split("|");
    if (d === today) n = Number(v); // already checked today
    else if (d === yesterday) n = Number(v) + 1; // consecutive day
    else n = 1; // broke the streak
  }
  localStorage.setItem(key, `${today}|${n}`);
  setStreak(n);
}

// "closed" is decided by LIVE allowance probes (baselineStatus from /api/gm),
// never by a fresh log scan — a door absent from the window is not a closed door.
function diffAgainstBaseline(report, baseline) {
  if (!baseline) return null;
  const live = new Map((report.baselineStatus || []).map((s) => [`${s.token}:${s.spender}`, s]));
  const added = report.approvals.list.filter((a) => {
    const key = `${a.token}:${a.spender}`;
    return !baseline.approvals.some((b) => `${b.token}:${b.spender}` === key);
  });
  const closed = baseline.approvals.filter((b) => {
    const key = `${b.token}:${b.spender}`;
    const status = live.get(key);
    return status && status.open === false; // the chain says 0 right now
  });
  const stillOpenUnseen = baseline.approvals.filter((b) => {
    const key = `${b.token}:${b.spender}`;
    const status = live.get(key);
    return !status || status.open === true; // open or unknown — never reported as closed
  });
  return { added, closed, stillOpenUnseen, baseline };
}

function GuardInner() {
  const sp = useSearchParams();
  const [address, setAddress] = useState(sp.get("address") || "");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [diff, setDiff] = useState(null);
  const [streak, setStreak] = useState(0);

  async function load(addr) {
    setBusy(true);
    setError(null);
    setDiff(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    try {
      const b = readBaseline(addr);
      const res = await fetch("/api/gm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: addr, baseline: b?.approvals || null }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Guard check failed");
      setReport(data);
      setBaseline(b);
      const d = diffAgainstBaseline(data, b);
      setDiff(d);
      updateStreak(addr, setStreak);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "The check timed out after 90s — Base RPCs are slow right now. Try again in a moment."
          : String(e.message || e)
      );
    } finally {
      clearTimeout(t);
      setBusy(false);
    }
  }

  async function guardMyWallet() {
    setError(null);
    try {
      // Read whichever account is active in the wallet RIGHT NOW
      let current = account;
      if (provider) {
        const { getCurrentAccount } = await import("@/lib/wallet");
        const fresh = await getCurrentAccount(provider);
        if (fresh) {
          if (fresh !== account) {
            setAccount(fresh);
            setAddress(fresh);
          }
          current = fresh;
        }
      }
      if (!current) {
        setError("Connect your wallet first — Vette reads whichever account is active in the wallet.");
        return;
      }
      await load(current);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  function saveBaseline() {
    if (!report) return;
    const b = writeBaseline(address, report.approvals.list);
    setBaseline(b);
    setDiff({ added: [], closed: [], stillOpenUnseen: [], baseline: b });
  }

  const isOwner = account && address && account.toLowerCase() === address.toLowerCase();
  const shareUrl = address ? `/guard?address=${address}` : null;

  return (
    <main className="min-h-screen">
      <nav className="max-w-4xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-5">
          <Link href="/audit" className="mono text-xs text-muted hover:text-vet transition-colors">audit</Link>
          <Link href="/field" className="mono text-xs text-muted hover:text-vet transition-colors">field</Link>
          <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        <div className="overline mb-3">guard mode</div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-3">
          Your wallet, <em className="text-vet">watched.</em>
        </h1>
        <p className="text-muted text-sm leading-relaxed mb-8 max-w-xl">
          The GM report every morning — balance, activity, open doors. Save a
          baseline and every check tells you exactly what changed. New approvals
          can't slip in unnoticed.
        </p>

        {/* input bar */}
        <div className="panel p-5 mb-8">
          <label className="overline block mb-3">wallet on base</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x…"
              className="flex-1 w-full bg-[#0E0E15] border border-[#23232E] rounded-md px-4 py-3 text-sm mono outline-none focus:border-vet/60 placeholder:text-[#55555F]"
            />
            <button
              disabled={busy || !/^0x[a-fA-F0-9]{40}$/.test(address.trim())}
              onClick={() => load(address.trim())}
              className="w-full sm:w-auto shrink-0 px-5 py-3 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? "RUNNING…" : "RUN CHECK →"}
            </button>
          </div>
        </div>

        {/* wallet bar */}
        <div className="panel p-5 mb-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="overline">your wallet</span>
            <span className="text-xs text-muted leading-snug">
              Connect → guard your own wallet → dangerous approvals get the kill switch.
            </span>
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <ConnectWallet
              account={account}
              onConnect={({ account: acc, provider: p }) => {
                setAccount(acc);
                setProvider(p);
                setAddress(acc);
              }}
              onDisconnect={() => {
                setAccount(null);
                setProvider(null);
              }}
            />
            <button
              disabled={busy || !account}
              onClick={guardMyWallet}
              className="px-4 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              GUARD MY WALLET →
            </button>
          </div>
        </div>

        {error && <div className="panel p-5 border-danger/40 text-danger text-sm mb-8">{error}</div>}

        {busy && !report && (
          <div className="panel p-12 text-center">
            <div className="inline-block w-9 h-9 border-2 border-vet border-t-transparent rounded-full animate-spin mb-5" />
            <p className="mono text-xs text-muted">reading Base → probing allowances → writing the GM report…</p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* GM report */}
            <div className="paper panel p-7">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="overline">gm report · {streak > 0 && `🔥 ${streak}-day streak`}</div>
                <div className="mono text-[11px] text-muted">{new Date(report.ts).toLocaleString()}</div>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-soft">
                {report.narrative.map((line, i) => (
                  <p key={i} className={i === 0 ? "serif text-2xl text-cream font-light" : ""}>{line}</p>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-[#1E241F] grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ["Balance", report.balanceEth],
                  ["Txs (7d)", report.activity.tx7d],
                  ["Transfers (7d)", report.activity.transfers7d],
                  ["Live approvals", report.approvals.total],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-muted mb-1">{k}</div>
                    <div className="mono text-lg font-bold text-soft">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* guard diff */}
            <div className="panel p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="overline">guard baseline</div>
                {baseline && (
                  <span className="mono text-[11px] text-muted">saved {new Date(baseline.savedAt).toLocaleString()}</span>
                )}
              </div>

              {diff && (
                <div className="space-y-3 mb-5">
                  {diff.added.length === 0 && diff.closed.length === 0 && (
                    <p className="text-sm text-vet font-semibold">
                      ✓ No new approvals since your baseline (within the scanned window).
                    </p>
                  )}
                  {diff.added.length > 0 && (
                    <div className="border border-danger/40 bg-danger/10 rounded-md p-4">
                      <p className="text-danger font-extrabold text-sm mb-2">
                        🚨 {diff.added.length} NEW approval(s) since your baseline:
                      </p>
                      <ul className="space-y-1.5">
                        {diff.added.map((a, i) => (
                          <li key={i} className="mono text-xs text-soft">
                            {a.tokenSymbol || "token"} → {a.spenderName || a.spender.slice(0, 10) + "…"}
                            <span className="text-danger"> — wasn&apos;t there before. Verify it or kill it.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diff.closed.length > 0 && (
                    <div className="border border-vet/40 bg-vet/10 rounded-md p-4">
                      <p className="text-vet font-extrabold text-sm mb-2">
                        ✓ {diff.closed.length} approval(s) closed since your baseline — verified onchain, allowance reads 0 right now:
                      </p>
                      <ul className="space-y-1.5">
                        {diff.closed.map((b, i) => (
                          <li key={i} className="mono text-xs text-soft">
                            {b.spender.slice(0, 10)}… — door closed.
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diff.stillOpenUnseen && diff.stillOpenUnseen.length > 0 && (
                    <div className="border border-[#1E241F] bg-[#0E0E15] rounded-md p-4">
                      <p className="text-muted font-bold text-sm mb-2">
                        {diff.stillOpenUnseen.length} baseline approval(s) still open — unchanged, not closed.
                      </p>
                      <p className="text-[11px] text-muted leading-snug">
                        A door that leaves the scan window is not a closed door. These were re-checked
                        with live allowance probes; the chain still says open.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={saveBaseline}
                  disabled={!report}
                  className="px-4 py-2.5 rounded-md border border-vet/50 text-vet font-bold text-sm hover:bg-vet hover:text-ink transition-colors disabled:opacity-30"
                >
                  {baseline ? "RE-SAVE BASELINE" : "SAVE BASELINE"}
                </button>
                <button
                  onClick={() => load(address)}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  {busy ? "CHECKING…" : "RUN GUARD CHECK →"}
                </button>
              </div>
              <p className="text-[11px] text-muted mt-4 leading-snug">
                Honest mechanics: guard checks run when you open this page — true 24/7 monitoring needs an
                always-on backend, which is the next milestone. Until then, open Guard daily and the streak keeps score.
                The baseline lives in <span className="mono">your browser</span>, nowhere else.
              </p>
            </div>

            {/* approvals + kill switches */}
            {report.approvals.list.length > 0 && (
              <div>
                <div className="overline mb-3">open doors — every one traces to a live onchain read</div>
                <ol className="space-y-3">
                  {report.approvals.list.map((a, i) => {
                    const s = LEVEL_STYLE[a.level] || LEVEL_STYLE.info;
                    return (
                      <li key={i} className="panel p-5 border-l-2" style={{ borderLeftColor: s.bar }}>
                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                          <span className="mono text-xs text-[#3A3A47]">{String(i + 1).padStart(2, "0")}</span>
                          <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${s.badge}`}>{s.label}</span>
                          <span className="font-bold text-soft text-sm">{a.title}</span>
                        </div>
                        <p className="text-sm text-muted leading-relaxed mb-3 pl-6">{a.detail}</p>
                        {a.action && (
                          <div className="pl-6">
                            <RevokeButton
                              action={a.action}
                              account={account}
                              provider={provider}
                              owner={report.address}
                              onRevoked={() => load(address)}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {shareUrl && (
              <p className="mono text-[11px] text-muted text-center">
                share this report → <span className="text-vet">{shareUrl}</span>
              </p>
            )}
          </div>
        )}

        {!report && !busy && !error && (
          <div className="panel p-10 text-center text-muted text-sm">
            <p className="mb-2">No report yet — connect your wallet, or paste any Base address above.</p>
            <p className="mono text-xs text-muted">try the demo catch: 0x61e17391f084ad083FA5C199D4F0d350A4CF4282</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function GuardPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-10">
            <Logo size={24} />
            <span className="overline">guard mode</span>
          </div>
          <div className="panel p-10 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-vet border-t-transparent rounded-full animate-spin" />
            <p className="mono text-xs text-muted">loading guard…</p>
          </div>
        </div>
      </main>
    }>
      <GuardInner />
    </Suspense>
  );
}
