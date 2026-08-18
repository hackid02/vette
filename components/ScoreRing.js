"use client";

// ScoreRing — the animated verdict gauge.
// SSR renders the REAL score (judges fetching HTML see the truth); the sweep
// animation runs only after hydration, and only when the client actually
// mounts. No more "0/100 in HTML, 28/100 after JS".
import { useEffect, useState } from "react";

const VERDICT_COLORS = {
  COMPLIANT: "#C6FF4A",
  DEVIATED: "#FFB020",
  DANGEROUS: "#FF5A65",
  UNVERIFIABLE: "#7E857C",
};

export default function ScoreRing({ score, verdict = "UNVERIFIABLE", size = 120 }) {
  const r = 46;
  const C = 2 * Math.PI * r;
  const target = score == null ? C : C * (1 - score / 100);
  const color = VERDICT_COLORS[verdict] || VERDICT_COLORS.UNVERIFIABLE;

  // SSR-safe initial state: show the real value immediately.
  const [offset, setOffset] = useState(target);
  const [display, setDisplay] = useState(score == null ? 0 : score);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // only animate on the client, from the open ring to the true score
    setHydrated(true);
    if (score == null) return;
    const start = performance.now();
    const dur = 1400;
    let raf;
    function frame(t) {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setOffset(C + (target - C) * eased);
      setDisplay(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [score, target, C]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1E241F" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={hydrated ? offset : target}
          transform="rotate(-90 60 60)"
          style={{ filter: `drop-shadow(0 0 10px ${color}55)`, transition: "none" }}
        />
      </svg>
      <div className="relative flex flex-col items-center leading-none">
        <span className="mono font-black" style={{ fontSize: size * 0.3, color: "#E4E7DF" }}>
          {score == null ? "—" : hydrated ? display : score}
        </span>
        {score != null && (
          <span className="mono text-muted mt-1" style={{ fontSize: size * 0.09 }}>
            /100
          </span>
        )}
      </div>
    </div>
  );
}
