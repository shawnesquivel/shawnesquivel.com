import { ImageResponse } from "next/og";

export const alt = "Word Brawl: a free Boggle-style word game to play online with friends";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS = [
  { word: "WORD", hot: false },
  { word: "BRAWL", hot: true },
];

export default function OpengraphImage() {
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
          gap: 22,
          background: "radial-gradient(120% 80% at 50% 0%, #1f8fe8 0%, #3a1fb8 55%, #22106b 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        {ROWS.map(({ word, hot }, r) => (
          <div key={word} style={{ display: "flex", gap: 18 }}>
            {word.split("").map((l, i) => (
              <div
                key={i}
                style={{
                  width: 120,
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 76,
                  fontWeight: 800,
                  borderRadius: 26,
                  background: hot ? "#ffd23f" : "#2a1670",
                  color: hot ? "#2a1670" : "#fff",
                  boxShadow: `0 10px 0 ${hot ? "#c99a00" : "#170b47"}`,
                  transform: `rotate(${((i + r) % 2 ? 1 : -1) * (3 + ((i + r) % 3))}deg)`,
                }}
              >
                {l}
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", marginTop: 26, fontSize: 44, fontWeight: 700 }}>Swipe words. Beat your friends.</div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>Free · No download · Play with a link</div>
      </div>
    ),
    size,
  );
}
