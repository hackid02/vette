"use client";

// ShareCard — the verdict as a shareable, SIGNED OG card. The link only
// renders because the server signed it with the real audit result; a card
// without a signature is rejected by the card endpoint (no fabrication).
import { useState } from "react";

export default function ShareCard({ verdict, score, target, cardSig }) {
  const [copied, setCopied] = useState(false);

  // No signature → no share card. Honest.
  if (!cardSig) return null;

  const url = `/api/card?v=${encodeURIComponent(verdict)}${score != null ? `&s=${encodeURIComponent(score)}` : ""}&t=${encodeURIComponent(target || "")}&sig=${encodeURIComponent(cardSig)}`;
  const full = typeof window !== "undefined" ? window.location.origin + url : url;

  function copy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      window.open(full, "_blank");
    }
  }

  return (
    <button
      onClick={copy}
      className="mono text-xs px-4 py-2 rounded-md border border-[#1E241F] text-muted hover:border-vet/50 hover:text-vet transition-colors"
    >
      {copied ? "✓ link copied — post it" : "📣 share this verdict"}
    </button>
  );
}
