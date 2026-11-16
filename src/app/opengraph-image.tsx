import { ImageResponse } from "next/og";

export const alt = "REGALUMO · Crea algo único. Sorprende a alguien especial.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFF8EF", padding: 70, color: "#1E1633" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 54, fontWeight: 800 }}>
          <div style={{ width: 70, height: 70, borderRadius: 18, background: "#FF6B4A", display: "flex" }} />
          regalumo
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
          <span>Crea algo único.</span>
          <span style={{ color: "#FF6B4A" }}>Sorprende a alguien especial.</span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 30 }}>
          <span style={{ background: "#1E1633", color: "white", padding: "10px 22px", borderRadius: 999 }}>Periódico personalizado</span>
          <span style={{ background: "#7C5CFF", color: "white", padding: "10px 22px", borderRadius: 999 }}>Escape room</span>
          <span style={{ background: "#18B48E", color: "white", padding: "10px 22px", borderRadius: 999 }}>Libro para colorear</span>
        </div>
      </div>
    ),
    size,
  );
}
