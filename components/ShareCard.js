"use client";

// ShareCard — the verdict as a shareable OG card. One click copies the link
// (post it on X/Discord and the verdict renders as an image preview).
import { useState } from "react";

export default function ShareCard({ verdict, score, target }) {
  const [copied, setCopied] = useState(false);
  const url = `/api/card?v=${encodeURIComponent(verdict)}${score != null ? `&s=${encodeURIComponent(score)}` : ""}&t=${encodeURIComponent(target || "")}`;
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
