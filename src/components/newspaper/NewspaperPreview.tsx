"use client";
import { Watermark } from "@/components/Watermark";
import "@fontsource/unifrakturmaguntia/400.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/900.css";
import "@fontsource/old-standard-tt/400.css";
import "@fontsource/old-standard-tt/400-italic.css";
import "@fontsource/old-standard-tt/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/900.css";
import "@fontsource/caveat/400.css";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { compose, headlineSize, type NewspaperData } from "@/lib/newspaper/model";
import { PAGE, THEMES, WEATHER, leadSize, mastSize, smallTextSize } from "@/lib/newspaper/theme";

/**
 * Vista previa HTML del periódico. Replica la maqueta del PDF (mismas medidas en pt→px)
 * y se escala para caber en su contenedor.
 */
export function NewspaperPreview({
  data,
  photoUrl,
  watermark = true,
  onPhotoSlotClick,
}: {
  data: NewspaperData;
  photoUrl: (id: string) => string | null;
  watermark?: boolean;
  onPhotoSlotClick?: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / PAGE.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const c = compose(data);
  const t = THEMES[c.template];
  const main = c.photos[0] ?? null;
  const strip = c.photos.slice(1);
  const filter = t.photo === "grayscale" ? "grayscale(1) contrast(1.08)" : t.photo === "sepia" ? "sepia(0.85) saturate(0.9)" : "none";
  const rule = (w = 1): CSSProperties => ({ borderBottom: `${w}px solid ${t.rule}` });
  const sectionTitle: CSSProperties = {
    fontFamily: t.head.css,
    fontWeight: 700,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: c.template === "moderno" ? t.accent : t.ink,
    marginBottom: 6,
  };
  const photo = (id: string, style: CSSProperties) => {
    const url = photoUrl(id);
    return url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" style={{ ...style, objectFit: "cover", filter, display: "block" }} />
    ) : (
      <div style={{ ...style, background: "rgba(0,0,0,0.06)" }} />
    );
  };

  return (
    <div ref={wrap} className="relative w-full" style={{ height: PAGE.height * scale }}>
      <div
        aria-label={`Vista previa del periódico ${c.paperName}`}
        style={{
          width: PAGE.width,
          height: PAGE.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: t.paper,
          color: t.ink,
          padding: PAGE.margin,
          fontFamily: t.body.css,
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 30px 60px -30px rgba(30,22,51,.45)",
          lineHeight: 1.2,
        }}
      >
        {c.template === "vintage" && <div style={{ position: "absolute", inset: 14, border: `2px solid ${t.rule}`, pointerEvents: "none" }} />}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, paddingBottom: 4, ...rule(1), textTransform: "uppercase", letterSpacing: 1 }}>
          <span>{c.edition}</span>
          <span>{[c.dateLine, c.place].filter(Boolean).join(" · ")}</span>
          <span>Precio: un abrazo</span>
        </div>
        <div style={{ textAlign: "center", padding: "8px 0", ...rule(c.template === "moderno" ? 0 : 3) }}>
          <div
            style={{
              fontFamily: t.mast.css,
              fontWeight: t.mast.weight,
              fontStyle: t.mast.style,
              fontSize: mastSize(c.paperName),
              letterSpacing: c.template === "moderno" ? -2 : 0,
              lineHeight: 1.15,
            }}
          >
            {c.paperName}
          </div>
        </div>
        {c.template === "moderno" ? <div style={{ height: 10, background: t.accent, marginBottom: 2 }} /> : <div style={{ marginTop: 2, ...rule(1) }} />}
        <div style={{ textAlign: "center", padding: "16px 0 12px" }}>
          <div style={{ fontFamily: t.head.css, fontWeight: t.head.weight, fontSize: headlineSize(c.headline), lineHeight: 1.18 }}>{c.headline}</div>
          <div style={{ fontStyle: "italic", fontSize: 16, marginTop: 10, color: t.muted }}>{c.subheadline}</div>
        </div>
        <div style={rule(1)} />
        <div style={{ display: "flex", padding: "14px 0", ...rule(1), flexGrow: main ? 1 : 0, flexShrink: 1, minHeight: main ? 330 : undefined }}>
          {main ? (
            <div style={{ width: "61%", paddingRight: 14, display: "flex", flexDirection: "column" }}>
              {photo(main.id, { width: "100%", flexGrow: 1, minHeight: 0 })}
              {main.caption && <div style={{ fontSize: 10, fontStyle: "italic", marginTop: 5, color: t.muted }}>{main.caption}</div>}
            </div>
          ) : onPhotoSlotClick ? (
            <button
              type="button"
              onClick={onPhotoSlotClick}
              style={{ width: "40%", marginRight: 14, border: `2px dashed ${t.muted}`, color: t.muted, fontSize: 22, fontFamily: "Inter, sans-serif", minHeight: 300 }}
            >
              + Añade una foto
            </button>
          ) : null}
          <div style={{ flex: 1, paddingLeft: main ? 14 : 0, borderLeft: main ? `1px solid ${t.rule}` : "none" }}>
            <p style={{ fontSize: leadSize(c.lead, !main), lineHeight: 1.45, textAlign: "justify", whiteSpace: "pre-line" }}>{c.lead}</p>
            {c.quote && (
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 0",
                  borderTop: `2px solid ${c.template === "moderno" ? t.accent : t.rule}`,
                  borderBottom: `2px solid ${c.template === "moderno" ? t.accent : t.rule}`,
                  fontFamily: t.head.css,
                  fontWeight: 700,
                  fontSize: 17,
                  textAlign: "center",
                  lineHeight: 1.25,
                }}
              >
                «{c.quote}»
              </div>
            )}
          </div>
        </div>
        {c.anecdotes.length > 0 && (
          <div style={{ display: "flex", padding: "12px 0", ...rule(1) }}>
            {c.anecdotes.map((a, i) => (
              <div key={i} style={{ flex: 1, paddingLeft: i ? 12 : 0, paddingRight: i < c.anecdotes.length - 1 ? 12 : 0, borderLeft: i ? `1px solid ${t.rule}` : "none" }}>
                <div style={{ fontFamily: t.head.css, fontWeight: 700, fontSize: 17, lineHeight: 1.15, marginBottom: 5 }}>{a.title}</div>
                <p style={{ fontSize: smallTextSize(a.text, c.anecdotes.length === 1 ? 13 : 11.5), lineHeight: 1.4, textAlign: "justify" }}>{a.text}</p>
              </div>
            ))}
          </div>
        )}
        {strip.length > 0 && (
          <div style={{ display: "flex", padding: "12px 0", ...rule(1) }}>
            {strip.map((p, i) => (
              <div key={p.id} style={{ flex: 1, paddingLeft: i ? 8 : 0, paddingRight: i < strip.length - 1 ? 8 : 0 }}>
                {photo(p.id, { width: "100%", height: strip.length === 1 ? 220 : 150 })}
                {p.caption && <div style={{ fontSize: 9, fontStyle: "italic", marginTop: 3, color: t.muted }}>{p.caption}</div>}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", padding: "12px 0 8px", flexGrow: main ? 0 : 1 }}>
          <div style={{ flex: 1, paddingRight: 14 }}>
            {c.messages.length > 0 && (
              <>
                <div style={sectionTitle}>Cartas de los lectores</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {c.messages.map((m, i) => (
                    <div key={i} style={{ width: "50%", paddingRight: i % 2 === 0 ? 8 : 0, paddingLeft: i % 2 ? 8 : 0, marginBottom: 9 }}>
                      <div style={{ fontSize: smallTextSize(m.text, 11), lineHeight: 1.35, fontStyle: "italic" }}>«{m.text}»</div>
                      {m.from && <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>— {m.from}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ width: 210, paddingLeft: 14, borderLeft: `1px solid ${t.rule}` }}>
            {c.dates.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={sectionTitle}>Fechas para recordar</div>
                {c.dates.map((x, i) => (
                  <div key={i} style={{ display: "flex", marginBottom: 4 }}>
                    <div style={{ fontFamily: t.head.css, fontWeight: 700, fontSize: 11, width: 58 }}>{x.date}</div>
                    <div style={{ fontSize: 10.5, flex: 1 }}>{x.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={sectionTitle}>El tiempo</div>
            <div style={{ fontSize: 10.5, lineHeight: 1.35 }}>{WEATHER}</div>
            <div style={{ fontSize: 8, color: t.muted, marginTop: 3 }}>(Previsión no oficial)</div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${t.rule}`, paddingTop: 6, display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
          <span style={{ fontFamily: "Caveat, cursive", fontSize: 20, color: c.template === "moderno" ? t.accent : t.ink }}>{c.signoff || " "}</span>
          <span style={{ fontSize: 8, color: t.muted, alignSelf: "flex-end" }}>{c.occasion} · Ejemplar único</span>
        </div>
        {watermark && <Watermark opacity={0.28} size={420} />}
      </div>
    </div>
  );
}
