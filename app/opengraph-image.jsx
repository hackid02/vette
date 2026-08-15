import { ImageResponse } from "next/og";

export const alt = "VETTE — the agent that vets agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#0A0D0B",
          color: "#E4E7DF",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* shield */}
        <div style={{ position: "absolute", top: 60, right: 80, width: 90, height: 108, background: "#C6FF4A", clipPath: "polygon(50% 0%, 100% 16%, 100% 52%, 50% 100%, 0% 52%, 0% 16%)" }} />
        <div
          style={{
            position: "absolute",
            top: 84,
            right: 96,
            width: 64,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="56" height="40" viewBox="0 0 56 40">
            <path d="M10 20 L24 34 L46 8" stroke="#0A0D0B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <div style={{ fontSize: 26, letterSpacing: "0.35em", color: "#7E857C", marginBottom: 28 }}>
          VETTE
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, display: "flex" }}>
          The agent
          <span style={{ color: "#C6FF4A" }}> that vets </span>
          agents.
        </div>
        <div style={{ fontSize: 30, color: "#7E857C", marginTop: 28 }}>
          Every claim traces to a tool call. Trust, but verified.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 90,
            display: "flex",
            gap: 24,
            fontSize: 24,
            fontFamily: "monospace",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#C6FF4A" }}>
            <span style={{ width: 14, height: 14, background: "#C6FF4A" }} /> COMPLIANT
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFB020" }}>
            <span style={{ width: 14, height: 14, background: "#FFB020" }} /> DEVIATED
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#FF5A65" }}>
            <span style={{ width: 14, height: 14, background: "#FF5A65" }} /> DANGEROUS
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
