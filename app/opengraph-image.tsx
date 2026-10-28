import { ImageResponse } from "next/og";

// Share card for every page that doesn't set its own: the brand on the ember glow.
export const alt = "Beyond the Rumour Mill: placement prep from official drives and verified senior experiences";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "#F5F3EF",
          backgroundColor: "#111114",
          backgroundImage:
            "radial-gradient(ellipse 70% 80% at 85% 10%, rgba(255,138,61,0.55), rgba(194,65,12,0.35) 35%, rgba(59,13,26,0.6) 60%, rgba(17,17,20,0) 85%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              background: "#FFB547",
              color: "#16151A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            BR
          </div>
          Beyond the Rumour Mill
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95, letterSpacing: -2, textTransform: "uppercase" }}>
            Prep from evidence,
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95, letterSpacing: -2, textTransform: "uppercase", color: "#FFB547" }}>
            not rumours.
          </div>
          <div style={{ marginTop: 32, fontSize: 30, color: "#A3A0A8", maxWidth: 900 }}>
            Drive eligibility, what seniors were really asked, a rumour check and a week-by-week prep plan.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
