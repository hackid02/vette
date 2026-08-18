"use client";

// ConnectWallet — pick your wallet, one permission (see your address). Nothing else.
import { useState, useEffect, useRef } from "react";
import { connectWallet, listWallets, isSandboxedFrame, isMobileDevice, disconnectWallet } from "@/lib/wallet";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

function WalletIcon({ icon }) {
  if (!icon) return null;
  return <img src={icon} alt="" className="w-4 h-4" />;
}

export default function ConnectWallet({ account, onConnect, onDisconnect }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noWallet, setNoWallet] = useState(false);
  const [sandboxed, setSandboxed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [disconnectedHint, setDisconnectedHint] = useState(false);
  const ref = useRef(null);
  const listenersRef = useRef(null);

  useEffect(() => {
    setWallets(listWallets());
    setNoWallet(typeof window !== "undefined" && listWallets().length === 0);
    setSandboxed(isSandboxedFrame());
    setMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function doConnect(w) {
    setPickerOpen(false);
    setBusy(true);
    setError(null);
    setDisconnectedHint(false);
    try {
      const { account, chainId, provider } = await connectWallet(w);
      setChainId(chainId);
      // detach previous listeners — no accumulation across reconnects
      if (listenersRef.current) {
        const prev = listenersRef.current;
        prev.provider.off?.("accountsChanged", prev.onAcc);
        prev.provider.off?.("chainChanged", prev.onChain);
      }
      const onAcc = (accs) => {
        if (accs && accs[0]) onConnect?.({ account: accs[0].toLowerCase(), chainId, provider });
        else onDisconnect?.();
      };
      const onChain = (cid) => {
        const id = cid ? parseInt(cid, 16) : null;
        setChainId(id);
        if (id !== null && id !== 8453) {
          setError("Connected wallet is not on Base — switch networks in the wallet, or the revoke will ask you to switch.");
        } else {
          setError(null);
        }
      };
      provider.on?.("accountsChanged", onAcc);
      provider.on?.("chainChanged", onChain);
      listenersRef.current = { provider, onAcc, onChain };
      onConnect?.({ account, chainId, provider });
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  // Real teardown, in the right order:
  //   1. detach OUR listeners first — the stale accountsChanged listener was
  //      what auto-reconnected Vette every time the wallet switched accounts
  //   2. revoke the wallet's permission (EIP-2255) — so the wallet forgets the
  //      site and the NEXT connect shows the wallet's account picker again
  //   3. only then clear the parent state
  async function doDisconnect() {
    const prev = listenersRef.current;
    if (prev) {
      prev.provider.off?.("accountsChanged", prev.onAcc);
      prev.provider.off?.("chainChanged", prev.onChain);
      listenersRef.current = null;
      try {
        await disconnectWallet(prev.provider);
      } catch {
        /* revoke is best-effort — listener detach already stops the reconnect */
      }
    }
    setChainId(null);
    setError(null);
    setDisconnectedHint(true);
    onDisconnect?.();
  }

  // blocked only when a wallet truly cannot work here: sandboxed frame,
  // or a mobile device with NO injected provider (in-wallet browsers work).
  const blocked = sandboxed || (mobile && noWallet);
  if (blocked && !account) {
    return (
      <div className="text-xs leading-snug max-w-xs">
        <span className="text-warn font-bold">
          {mobile && noWallet
            ? "No wallet found on this device."
            : "Wallet connect is blocked inside this preview frame."}
        </span>{" "}
        <span className="text-muted">
          {mobile && noWallet
            ? "Phone browsers don't run wallet extensions, but in-wallet browsers (MetaMask/Coinbase/Rabby app) do inject a provider — open Vette from inside your wallet app. Or use a desktop browser. (Audits work fine here — paste any address below.)"
            : "Browser wallets refuse to inject inside embedded frames. Open Vette in a full browser tab:"}
        </span>{" "}
        {!(mobile && noWallet) && (
          <a
            href="https://vette-nu.vercel.app/audit"
            target="_blank"
            rel="noreferrer"
            className="text-vet underline hover:opacity-80"
          >
            vette-nu.vercel.app/audit
          </a>
        )}
      </div>
    );
  }

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span className="mono text-xs px-3 py-2 rounded-md border border-vet/40 bg-vet/10 text-vet font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-vet inline-block mr-1.5 pulse-dot" />
          {short(account)}
        </span>
        <button
          onClick={doDisconnect}
          className="mono text-[11px] text-muted hover:text-soft transition-colors px-1"
        >
          disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-start relative" ref={ref}>
      <button
        onClick={() => {
          const ws = listWallets();
          setWallets(ws);
          if (ws.length <= 1) doConnect(ws[0]);
          else setPickerOpen((o) => !o);
        }}
        disabled={busy}
        className="px-4 py-2.5 rounded-md border border-vet/50 text-vet font-extrabold text-sm hover:bg-vet hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? "CHECKING WALLET…" : "CONNECT WALLET →"}
      </button>

      {pickerOpen && wallets.length > 1 && (
        <div className="absolute top-full left-0 mt-2 z-30 w-56 panel p-1.5 shadow-2xl">
          <div className="overline px-2.5 py-2">pick your wallet</div>
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => doConnect(w)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded text-sm text-soft hover:bg-vet/10 hover:text-vet transition-colors text-left"
            >
              <WalletIcon icon={w.icon} />
              <span className="font-semibold">{w.name}</span>
            </button>
          ))}
        </div>
      )}

      {wallets.length === 0 && !busy && (
        <p className="text-[11px] text-muted">
          no wallet extension detected — install MetaMask, Rabby, or Coinbase Wallet
        </p>
      )}
      {disconnectedHint && !error && (
        <p className="text-[11px] text-vet leading-snug max-w-xs">
          ✓ disconnected — the wallet has forgotten Vette. Connect again and the wallet
          will show its account picker, so you can switch to a different wallet.
        </p>
      )}
      {error && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-danger leading-snug max-w-xs">{error}</p>
          {wallets.length > 1 && (
            <button
              onClick={() => {
                setError(null);
                setPickerOpen(true);
              }}
              className="mono text-[11px] text-vet hover:underline text-left"
            >
              ↳ pick a different wallet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
