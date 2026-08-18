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
          padding: "0 88px",
          background: "#0A0D0B",
          color: "#E4E7DF",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* top band: wordmark left, shield right — one SVG, nothing clips */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 88,
            right: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: "0.4em", color: "#7E857C", display: "flex" }}>
            {"VETTE"}
          </div>
          <svg width="60" height="72" viewBox="0 0 24 28" style={{ display: "flex" }}>
            <path
              d="M12 1.5 L21.5 5.2 V13.4 C21.5 19.6 17.8 24.4 12 26.5 C6.2 24.4 2.5 19.6 2.5 13.4 V5.2 Z"
              fill="#C6FF4A"
            />
            <path
              d="M7.2 13.8 L10.4 17 L17 9.4"
              stroke="#0A0D0B"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* headline — explicit strings + rowGap so words can never collapse */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            rowGap: 12,
            marginTop: 44,
          }}
        >
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.12 }}>
            {"The agent"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.12,
              color: "#C6FF4A",
            }}
          >
            {"that vets agents."}
          </div>
        </div>

        {/* tagline */}
        <div style={{ display: "flex", fontSize: 26, color: "#7E857C", marginTop: 34, maxWidth: 860, lineHeight: 1.4 }}>
          {"Every claim traces to a tool call. Trust, but verified."}
        </div>

        {/* bottom band */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 88,
            right: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1E241F",
            paddingTop: 20,
          }}
        >
          <span style={{ display: "flex", fontSize: 20, color: "#7E857C", fontFamily: "monospace" }}>
            {"built for the Orion Builder Hackathon"}
          </span>
          <span style={{ display: "flex", fontSize: 23, color: "#C6FF4A", fontFamily: "monospace" }}>
            {"vette-nu.vercel.app"}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
