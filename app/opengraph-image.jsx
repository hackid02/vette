import { ImageResponse } from "next/og";

export const alt = "VETTE — the agent that vets agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Crop-safe layout: every element sits inside the central 700px band
// (x 250–950), so the card survives the square/narrow crops mobile
// link previews apply. Landscape (16:9) shows the full frame.
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
        {/* top band — centered within the safe zone */}
        <div
          style={{
            position: "absolute",
            top: 54,
            left: 250,
            right: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 23, letterSpacing: "0.4em", color: "#7E857C" }}>
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

        {/* headline — centered, safe width */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            rowGap: 10,
            marginTop: 40,
          }}
        >
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
            {"The agent"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#C6FF4A",
            }}
          >
            {"that vets agents."}
          </div>
        </div>

        {/* tagline — centered, safe width */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#7E857C",
            marginTop: 28,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {"Every claim traces to a tool call. Trust, but verified."}
        </div>

        {/* bottom band — centered within the safe zone */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 285,
            right: 285,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderTop: "1px solid #1E241F",
            paddingTop: 18,
          }}
        >
          <span style={{ display: "flex", fontSize: 18, color: "#7E857C", fontFamily: "monospace" }}>
            {"Orion Builder Hackathon"}
          </span>
          <span style={{ display: "flex", fontSize: 19, color: "#C6FF4A", fontFamily: "monospace" }}>
            {"vette-nu.vercel.app"}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
