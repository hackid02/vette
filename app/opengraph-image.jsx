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
        {/* top band: wordmark left, shield right */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 88,
            right: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: "0.4em", color: "#7E857C" }}>VETTE</div>
          <div
            style={{
              width: 46,
              height: 55,
              background: "#C6FF4A",
              clipPath: "polygon(50% 0%, 100% 16%, 100% 52%, 50% 100%, 0% 52%, 0% 16%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="26" height="20" viewBox="0 0 26 20">
              <path
                d="M5 10 L11 16 L21 4"
                stroke="#0A0D0B"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* headline — two deliberate lines */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08 }}>The agent</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, color: "#C6FF4A" }}>
            that vets agents.
          </div>
        </div>

        {/* tagline */}
        <div style={{ fontSize: 27, color: "#7E857C", marginTop: 36, maxWidth: 860, lineHeight: 1.4 }}>
          Every claim traces to a tool call. Trust, but verified.
        </div>

        {/* bottom band */}
        <div
          style={{
            position: "absolute",
            bottom: 52,
            left: 88,
            right: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1E241F",
            paddingTop: 22,
          }}
        >
          <span style={{ fontSize: 21, color: "#7E857C", fontFamily: "monospace" }}>
            built for the Orion Builder Hackathon
          </span>
          <span style={{ fontSize: 24, color: "#C6FF4A", fontFamily: "monospace" }}>
            vette-nu.vercel.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
