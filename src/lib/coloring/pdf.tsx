import React from "react";
import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "../pdf/fonts";

/** Libro para colorear: portada + una lámina por página (A4, imágenes a 300 ppp). */
export async function renderColoringPdf(opts: { title: string; dedication: string; pages: Buffer[]; cover?: Buffer }) {
  registerFonts();
  const title = opts.title.trim() || "Mi libro para colorear";
  return renderToBuffer(
    <Document title={title} author="REGALUMO" creator="REGALUMO">
      <Page size="A4" style={{ padding: 40, fontFamily: "Inter", alignItems: "center" }}>
        <View style={{ flex: 1, width: "100%", borderWidth: 3, borderColor: "#1E1633", borderRadius: 18, padding: 28, alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 40, textAlign: "center", lineHeight: 1.15 }}>{title}</Text>
          {opts.dedication ? <Text style={{ fontFamily: "Caveat", fontSize: 22, marginTop: 8, textAlign: "center" }}>{opts.dedication}</Text> : null}
          {opts.cover ? (
            <Image src={{ data: opts.cover, format: "png" }} style={{ width: "100%", flexGrow: 1, objectFit: "contain", marginTop: 18 }} />
          ) : (
            <View style={{ flexGrow: 1 }} />
          )}
          <Text style={{ fontSize: 13, marginTop: 14 }}>Este libro pertenece a: ________________________________</Text>
        </View>
      </Page>
      {opts.pages.map((png, i) => (
        <Page key={i} size="A4" style={{ padding: 28, alignItems: "center", justifyContent: "center" }}>
          <Image src={{ data: png, format: "png" }} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          <Text fixed style={{ position: "absolute", bottom: 12, right: 28, fontSize: 8, color: "#9A93B3", fontFamily: "Inter" }}>
            {i + 1}
          </Text>
        </Page>
      ))}
    </Document>,
  );
}
