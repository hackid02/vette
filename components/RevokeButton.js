"use client";

// RevokeButton — the kill switch. One click → one signature → approve(spender, 0)
// goes onchain. Vette preflights the call first; if it would revert, you're told
// why before any signature is requested.
import { useState } from "react";
import {
  ensureBase,
  preflightRevoke,
  sendRevoke,
  waitForReceipt,
} from "@/lib/wallet";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
const TX_URL = "https://base.blockscout.com/tx/";

export default function RevokeButton({ action, account, provider, owner, onRevoked }) {
  const [stage, setStage] = useState("idle"); // idle | preflight | signing | waiting | done | error
  const [msg, setMsg] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const isOwner = account && owner && account.toLowerCase() === owner.toLowerCase();
  const sym = action.tokenSymbol || "token";
  const spenderShort = short(action.spender);

  async function kill() {
    if (!account || !provider) {
      setStage("error");
      setMsg("Connect the wallet that owns this address first.");
      return;
    }
    if (!isOwner) {
      setStage("error");
      setMsg(`Only the owner can revoke — this wallet isn't the connected account. Vette can audit anyone; the kill switch belongs to the owner.`);
      return;
    }
    try {
      setStage("preflight");
      setMsg("Simulating the revoke onchain before asking for a signature…");
      await ensureBase(provider);
      const pre = await preflightRevoke(action.token, account, action.spender);
      if (!pre.ok) {
        setStage("error");
        setMsg("Preflight failed — the revoke would revert: " + pre.reason);
        return;
      }
      setStage("signing");
      setMsg("Confirm the revoke in your wallet — approve(spender, 0). No ETH moves.");
      const hash = await sendRevoke({
        provider,
        account,
        token: action.token,
        spender: action.spender,
      });
      setTxHash(hash);
      setStage("waiting");
      setMsg("Onchain. Waiting for Base to confirm…");
      const receipt = await waitForReceipt(hash);
      if (!receipt.ok) {
        setStage("error");
        setMsg(receipt.error);
        return;
      }
      if (receipt.status !== "success") {
        setStage("error");
        setMsg("The transaction reverted onchain. The approval is still live — try again or revoke manually in your wallet.");
        return;
      }
      setStage("done");
      setMsg(`Allowance to ${action.spenderName || spenderShort} revoked. The threat is dead.`);
      onRevoked?.();
    } catch (e) {
      if (e && (e.code === 4001 || String(e.message).includes("rejected"))) {
        setStage("idle");
        setMsg(null);
        return; // user closed the wallet popup — no drama
      }
      setStage("error");
      setMsg(String(e.message || e).slice(0, 200));
    }
  }

  const base =
    "w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-extrabold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  if (stage === "done") {
    return (
      <div className="flex flex-col gap-1.5">
        <a
          href={TX_URL + txHash}
          target="_blank"
          rel="noreferrer"
          className={`${base} bg-vet text-ink hover:opacity-90`}
        >
          ✓ REVOKED — VIEW TX ↗
        </a>
        <p className="text-[11px] text-vet">{msg}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={kill}
        disabled={stage === "preflight" || stage === "signing" || stage === "waiting"}
        className={`${base} ${
          isOwner
            ? "bg-danger text-white hover:opacity-90"
            : "bg-danger/15 text-danger border border-danger/40"
        }`}
      >
        {stage === "preflight" && "⟳ PREFLIGHTING…"}
        {stage === "signing" && "✍ CONFIRM IN WALLET…"}
        {stage === "waiting" && "⏳ WAITING ONCHAIN…"}
        {(stage === "idle" || stage === "error") && (
          <>⚡ REVOKE {sym} → {spenderShort}</>
        )}
      </button>
      {msg && <p className={`text-[11px] leading-snug ${stage === "error" ? "text-danger" : "text-muted"}`}>{msg}</p>}
    </div>
  );
}
