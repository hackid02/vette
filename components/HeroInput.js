"use client";

// HeroInput — the audit input living in the hero. One field, smart routing.
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroInput({ compact = false }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function go(e) {
    e.preventDefault();
    const v = q.trim();
    if (!v || busy) return;
    setBusy(true);
    if (/^0x[a-fA-F0-9]{40}$/.test(v)) {
      router.push("/audit?address=" + v);
    } else if (/^https?:\/\//i.test(v)) {
      router.push("/audit?url=" + encodeURIComponent(v));
    } else if (/^[\w-]+(\.[\w-]+){1,}(\/\S*)?$/.test(v)) {
      router.push("/audit?url=" + encodeURIComponent("https://" + v));
    } else {
      router.push("/audit?url=" + encodeURIComponent(v));
    }
  }

  return (
    <form
      onSubmit={go}
      className={`flex items-center gap-2 rounded-md border border-[#23232E] bg-[#0E0E15] p-2 focus-within:border-vet/50 transition-colors ${
        compact ? "max-w-md" : "max-w-xl w-full"
      }`}
    >
      <span className="mono text-vet pl-3 text-sm shrink-0">▸</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="paste an agent's website, X, or wallet — e.g. base-scout-seven.vercel.app"
        className="flex-1 bg-transparent outline-none text-sm text-soft placeholder:text-[#55555F] min-w-0"
      />
      <button
        type="submit"
        disabled={!q.trim() || busy}
        className="shrink-0 px-4 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
      >
        VET IT →
      </button>
    </form>
  );
}
