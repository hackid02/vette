import { ImageResponse } from "next/og";

export const alt = "VETTE — the agent that vets agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Ultra-minimal card. Small type, few words, big margins.
// Everything centered in the safe zone (survives square/narrow crops).
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
        {/* wordmark — small */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            marginBottom: 64,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.4em", color: "#7E857C" }}>
            {"VETTE"}
          </div>
          <svg width="38" height="46" viewBox="0 0 24 28" style={{ display: "flex" }}>
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

        {/* headline — small, two lines */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            rowGap: 14,
          }}
        >
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, lineHeight: 1.1 }}>
            {"The agent"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#C6FF4A",
            }}
          >
            {"that vets agents."}
          </div>
        </div>

        {/* short tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#7E857C",
            marginTop: 56,
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          {"Trust, but verified."}
        </div>
      </div>
    ),
    { ...size }
  );
}
