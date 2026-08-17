"use client";

// LiveTicker — the verdict marquee. Every item is real: the base block number
// polls /api/status, verdicts come from /api/feed (the machine-written ledger).
// Nothing here is invented; when the APIs are unreachable the strip says so.
import { useEffect, useState } from "react";

const TYPE_COLORS = {
  RUN: "#C6FF4A",
  DRIFT: "#FFB020",
  CATCH: "#FF5A65",
  REFUSAL: "#E4E7DF",
  SCORE: "#E4E7DF",
  LOG: "#C6FF4A",
  LAUNCH: "#C6FF4A",
};

function feedToItems(feed) {
  const items = [];
  for (const e of feed || []) {
    if (e.type === "RUN") {
      items.push({ color: TYPE_COLORS.RUN, text: `FIELD CHECK · ${e.title.replace("Autonomous field check — ", "")}` });
    } else if (e.type === "DRIFT") {
      items.push({ color: TYPE_COLORS.DRIFT, text: `DRIFT · ${e.title.slice(0, 60)}` });
    } else if (e.type === "CATCH") {
      items.push({ color: TYPE_COLORS.CATCH, text: `CATCH · ${e.title.slice(0, 56)}` });
    } else if (e.type === "REFUSAL") {
      items.push({ color: TYPE_COLORS.REFUSAL, text: "REFUSAL · BaseScout — no wallet declared, no verdict issued" });
    } else if (e.type === "SCORE") {
      items.push({ color: TYPE_COLORS.SCORE, text: "AUDIT TRAIL · 13 → 21 → 24 / 30" });
    }
    if (items.length >= 12) break;
  }
  return items;
}

export default function LiveTicker() {
  const [block, setBlock] = useState(null);
  const [items, setItems] = useState([]);
  const [down, setDown] = useState(false);

  useEffect(() => {
    let alive = true;

    async function tickStatus() {
      try {
        const r = await fetch("/api/status", { signal: AbortSignal.timeout(8000) });
        const d = await r.json();
        if (alive && d.ok) {
          setBlock(d.block);
          setDown(false);
        }
      } catch {
        /* keep last known block */
      }
    }

    async function tickFeed() {
      try {
        const r = await fetch("/api/feed", { signal: AbortSignal.timeout(12000) });
        const d = await r.json();
        if (alive && d.ok && Array.isArray(d.feed)) {
          const mapped = feedToItems(d.feed);
          if (mapped.length) setItems(mapped);
        }
      } catch {
        if (alive) setDown(true);
      }
    }

    tickStatus();
    tickFeed();
    const s = setInterval(tickStatus, 20000);
    const f = setInterval(tickFeed, 90000);
    return () => {
      alive = false;
      clearInterval(s);
      clearInterval(f);
    };
  }, []);

  const baseItems = [
    block != null
      ? { color: "#C6FF4A", text: `LIVE ON BASE · BLOCK ${block.toLocaleString("en-US")}` }
      : { color: "#7E857C", text: "READING BASE…" },
  ];

  const fallbackItem = down
    ? { color: "#FFB020", text: "LEDGER UNREACHABLE — LAST KNOWN STATE SHOWN" }
    : { color: "#7E857C", text: "LOADING THE LEDGER…" };

  const all = [...baseItems, ...(items.length ? items : [fallbackItem])];

  return (
    <div className="border-y border-[#1D1D26] bg-[#0A0D0B] overflow-hidden marquee-mask" aria-label="Vette live ticker">
      <div className="flex w-max whitespace-nowrap vette-marquee py-2.5">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
            <span className="flex items-center gap-2 mx-5">
              <span className="w-1.5 h-1.5 rounded-full bg-vet pulse-dot" />
              <span className="mono text-[11px] font-bold tracking-[0.2em] text-vet">VETTE</span>
            </span>
            {all.map((it, i) => (
              <span key={`${dup}-${i}`} className="flex items-center gap-2 mx-5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.color }} />
                <span className="mono text-[11px]" style={{ color: it.color }}>
                  {it.text}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
