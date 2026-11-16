import React from "react";
import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "../pdf/fonts";
import { compose, headlineSize, type NewspaperData } from "./model";
import { PAGE, THEMES, WEATHER, leadSize, mastSize, smallTextSize } from "./theme";

export type PhotoBuffers = Record<string, Buffer>;

/**
 * Genera el PDF del periódico (A3 vertical, vectorial, fuentes incrustadas).
 * watermark=true se usa solo para vistas previas; el PDF de pago nunca lo lleva.
 */
export async function renderNewspaperPdf(d: NewspaperData, photos: PhotoBuffers, opts: { watermark?: boolean } = {}) {
  registerFonts();
  return renderToBuffer(<NewspaperDoc d={d} photos={photos} watermark={!!opts.watermark} />);
}

function NewspaperDoc({ d, photos, watermark }: { d: NewspaperData; photos: PhotoBuffers; watermark: boolean }) {
  const c = compose(d);
  const t = THEMES[c.template];
  const main = c.photos[0] && photos[c.photos[0].id] ? c.photos[0] : null;
  const strip = c.photos.slice(1).filter((p) => photos[p.id]);
  const hl = headlineSize(c.headline);
  const body = { fontFamily: t.body.family, color: t.ink };
  const rule = (w = 1) => ({ borderBottomWidth: w, borderBottomColor: t.rule, borderBottomStyle: "solid" as const });
  const sectionTitle = {
    fontFamily: t.head.family,
    fontWeight: 700,
    fontSize: 13,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    color: c.template === "moderno" ? t.accent : t.ink,
    marginBottom: 6,
  };

  return (
    <Document title={c.paperName} author="REGALUMO" creator="REGALUMO" producer="REGALUMO">
      <Page size={[PAGE.width, PAGE.height]} wrap={false} style={{ backgroundColor: t.paper, padding: PAGE.margin, ...body }}>
        {c.template === "vintage" && (
          <View
            fixed
            style={{ position: "absolute", top: 14, left: 14, right: 14, bottom: 14, borderWidth: 2, borderColor: t.rule, borderStyle: "solid" }}
          />
        )}
        {/* Línea superior */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", fontSize: 9, paddingBottom: 4, ...rule(1), textTransform: "uppercase", letterSpacing: 1 }}>
          <Text>{c.edition}</Text>
          <Text>{[c.dateLine, c.place].filter(Boolean).join(" · ")}</Text>
          <Text>Precio: un abrazo</Text>
        </View>

        {/* Cabecera */}
        <View style={{ alignItems: "center", paddingVertical: 8, ...rule(c.template === "moderno" ? 0 : 3) }}>
          <Text
            style={{
              fontFamily: t.mast.family,
              fontWeight: t.mast.weight,
              fontStyle: t.mast.style,
              fontSize: mastSize(c.paperName),
              color: t.ink,
              letterSpacing: c.template === "moderno" ? -2 : 0,
            }}
          >
            {c.paperName}
          </Text>
        </View>
        {c.template === "moderno" ? (
          <View style={{ height: 10, backgroundColor: t.accent, marginBottom: 2 }} />
        ) : (
          <View style={{ marginTop: 2, ...rule(1) }} />
        )}

        {/* Titular */}
        <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontFamily: t.head.family, fontWeight: t.head.weight, fontSize: hl, textAlign: "center", lineHeight: 1.18, color: t.ink }}>
            {c.headline}
          </Text>
          <Text style={{ fontFamily: t.body.family, fontStyle: "italic", fontSize: 16, textAlign: "center", marginTop: 10, color: t.muted }}>
            {c.subheadline}
          </Text>
        </View>
        <View style={rule(1)} />

        {/* Bloque principal */}
        <View style={{ flexDirection: "row", paddingTop: 14, paddingBottom: 14, ...rule(1), flexGrow: main ? 1 : 0, flexShrink: 1, minHeight: main ? 330 : undefined }}>
          {main && (
            <View style={{ width: "61%", paddingRight: 14, flexDirection: "column" }}>
              <Image src={{ data: photos[main.id], format: "jpg" }} style={{ width: "100%", flexGrow: 1, objectFit: "cover" }} />
              {main.caption ? <Text style={{ fontSize: 10, fontStyle: "italic", marginTop: 5, color: t.muted }}>{main.caption}</Text> : null}
            </View>
          )}
          <View style={{ flex: 1, paddingLeft: main ? 14 : 0, borderLeftWidth: main ? 1 : 0, borderLeftColor: t.rule }}>
            <Text style={{ fontSize: leadSize(c.lead, !main), lineHeight: 1.45, textAlign: "justify" }}>{c.lead}</Text>
            {c.quote ? (
              <View style={{ marginTop: 12, paddingTop: 8, paddingBottom: 8, borderTopWidth: 2, borderBottomWidth: 2, borderColor: c.template === "moderno" ? t.accent : t.rule }}>
                <Text style={{ fontFamily: t.head.family, fontWeight: 700, fontSize: 17, textAlign: "center", lineHeight: 1.25 }}>«{c.quote}»</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Anécdotas */}
        {c.anecdotes.length > 0 && (
          <View style={{ flexDirection: "row", paddingTop: 12, paddingBottom: 12, ...rule(1) }}>
            {c.anecdotes.map((a, i) => (
              <View
                key={i}
                style={{ flex: 1, paddingLeft: i ? 12 : 0, paddingRight: i < c.anecdotes.length - 1 ? 12 : 0, borderLeftWidth: i ? 1 : 0, borderLeftColor: t.rule }}
              >
                <Text style={{ fontFamily: t.head.family, fontWeight: 700, fontSize: 17, lineHeight: 1.15, marginBottom: 5 }}>{a.title}</Text>
                <Text style={{ fontSize: smallTextSize(a.text, c.anecdotes.length === 1 ? 13 : 11.5), lineHeight: 1.4, textAlign: "justify" }}>{a.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tira de fotos */}
        {strip.length > 0 && (
          <View style={{ flexDirection: "row", paddingTop: 12, paddingBottom: 12, ...rule(1) }}>
            {strip.map((p, i) => (
              <View key={p.id} style={{ flex: 1, paddingLeft: i ? 8 : 0, paddingRight: i < strip.length - 1 ? 8 : 0 }}>
                <Image src={{ data: photos[p.id], format: "jpg" }} style={{ width: "100%", height: strip.length === 1 ? 220 : 150, objectFit: "cover" }} />
                {p.caption ? <Text style={{ fontSize: 9, fontStyle: "italic", marginTop: 3, color: t.muted }}>{p.caption}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Mensajes + lateral */}
        <View style={{ flexDirection: "row", paddingTop: 12, paddingBottom: 8, flexGrow: main ? 0 : 1 }}>
          <View style={{ flex: 1, paddingRight: 14 }}>
            {c.messages.length > 0 && (
              <>
                <Text style={sectionTitle}>Cartas de los lectores</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {c.messages.map((m, i) => (
                    <View key={i} style={{ width: "50%", paddingRight: i % 2 === 0 ? 8 : 0, paddingLeft: i % 2 ? 8 : 0, marginBottom: 9 }}>
                      <Text style={{ fontSize: smallTextSize(m.text, 11), lineHeight: 1.35, fontStyle: "italic" }}>«{m.text}»</Text>
                      {m.from ? <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>— {m.from}</Text> : null}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
          <View style={{ width: 210, paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: t.rule }}>
            {c.dates.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={sectionTitle}>Fechas para recordar</Text>
                {c.dates.map((x, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: 4 }}>
                    <Text style={{ fontFamily: t.head.family, fontWeight: 700, fontSize: 11, width: 58 }}>{x.date}</Text>
                    <Text style={{ fontSize: 10.5, flex: 1 }}>{x.label}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={sectionTitle}>El tiempo</Text>
            <Text style={{ fontSize: 10.5, lineHeight: 1.35 }}>{WEATHER}</Text>
            <Text style={{ fontSize: 8, color: t.muted, marginTop: 3 }}>(Previsión no oficial)</Text>
          </View>
        </View>

        {/* Pie */}
        <View style={{ borderTopWidth: 1, borderTopColor: t.rule, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: "Caveat", fontSize: 20, color: c.template === "moderno" ? t.accent : t.ink }}>{c.signoff || " "}</Text>
          <Text style={{ fontSize: 8, color: t.muted, alignSelf: "flex-end" }}>{c.occasion} · Ejemplar único</Text>
        </View>

        {watermark && (
          <View fixed style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 90, color: "#FF6B4A", opacity: 0.22, transform: "rotate(-35deg)" }}>
              VISTA PREVIA
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
