import { ImageResponse } from "next/og";
import { verifyCard, cardConfigured } from "@/lib/cardsig";

export const runtime = "nodejs";

// GET /api/card?v=VERDICT&s=SCORE&t=TARGET&sig=HMAC → shareable verdict card (PNG).
// The sig is generated server-side from the real audit result — query params
// alone are not proof, and a missing/invalid signature gets a rejection card.
const COLORS = {
  COMPLIANT: { accent: "#C6FF4A", label: "COMPLIANT" },
  DEVIATED: { accent: "#FFB020", label: "DEVIATED" },
  DANGEROUS: { accent: "#FF5A65", label: "DANGEROUS" },
  UNVERIFIABLE: { accent: "#7E857C", label: "UNVERIFIABLE" },
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const v = String(searchParams.get("v") || "").toUpperCase();
  const s = searchParams.get("s");
  const t = String(searchParams.get("t") || "").slice(0, 90);
  const sig = String(searchParams.get("sig") || "");

  const validVerdict = COLORS[v];
  const valid =
    !!validVerdict &&
    (s == null || /^\d{1,3}$/.test(s)) &&
    cardConfigured() &&
    verifyCard({ v, s, t, sig });

  const c = validVerdict || COLORS.UNVERIFIABLE;

  if (!valid) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            background: "#0A0D0B",
            color: "#E4E7DF",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 800 }}>UNSIGNED CARD</div>
          <div style={{ fontSize: 26, color: "#7E857C", maxWidth: 800, textAlign: "center" }}>
            This share card carries no valid Vette signature. Verdicts are issued by the
            audit engine and shared from the report page — every claim traces to a receipt.
          </div>
          <div style={{ fontSize: 22, color: "#C6FF4A", fontFamily: "monospace" }}>
            vette-nu.vercel.app
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const target = t.length > 70 ? t.slice(0, 70) + "…" : t;
  const score = /^\d{1,3}$/.test(s || "") ? s : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0A0D0B",
          color: "#E4E7DF",
          fontFamily: "sans-serif",
        }}
      >
        {/* top row: shield + verdict */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="52" height="58" viewBox="0 0 24 27">
              <path d="M12 1.5l9.5 3.8v6.9c0 5.9-4 10.3-9.5 12.3-5.5-2-9.5-6.4-9.5-12.3V5.3L12 1.5z" fill={c.accent} />
              <path d="M8.4 13.6l2.6 2.7 4.6-5" stroke="#0A0D0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, letterSpacing: "0.4em", color: "#7E857C" }}>VETTE</div>
              <div style={{ fontSize: 17, color: "#7E857C" }}>says</div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: `2px solid ${c.accent}`,
              borderRadius: 999,
              padding: "10px 28px",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 999, background: c.accent }} />
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.2em", color: c.accent }}>{c.label}</span>
          </div>
        </div>

        {/* center: score + target */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {score != null ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 120, fontWeight: 900, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 40, color: "#7E857C" }}>/100</span>
            </div>
          ) : (
            <div style={{ fontSize: 60, fontWeight: 800, color: c.accent }}>NO FACTS INVENTED</div>
          )}
          {target && (
            <div style={{ fontSize: 30, color: "#7E857C", fontFamily: "monospace" }}>{target}</div>
          )}
        </div>

        {/* bottom line */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 22, color: "#7E857C", fontFamily: "monospace" }}>
            every claim → a tool call
          </span>
          <span style={{ fontSize: 22, color: c.accent, fontFamily: "monospace" }}>vette-nu.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
