import { ImageResponse } from "next/og";

export const alt = "VETTE — the agent that vets agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Crop-safe, air-first layout: every element sits inside the central band
// (x 285–915) so square/narrow mobile crops keep everything. Three elements
// only — wordmark + shield, two headline lines, one tagline. Nothing to crowd.
export default function OG() {
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
          background: "#0A0D0B",
          color: "#E4E7DF",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* wordmark + shield, centered */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            marginBottom: 52,
          }}
        >
          <div style={{ display: "flex", fontSize: 27, letterSpacing: "0.45em", color: "#7E857C" }}>
            {"VETTE"}
          </div>
          <svg width="46" height="56" viewBox="0 0 24 28" style={{ display: "flex" }}>
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

        {/* headline — two lines, generous gap */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            rowGap: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 60, fontWeight: 800, lineHeight: 1.05 }}>
            {"The agent"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#C6FF4A",
            }}
          >
            {"that vets agents."}
          </div>
        </div>

        {/* one tagline — breathing room above and below */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#7E857C",
            marginTop: 46,
            lineHeight: 1.35,
            textAlign: "center",
          }}
        >
          {"Every claim traces to a tool call. Trust, but verified."}
        </div>
      </div>
    ),
    { ...size }
  );
}
