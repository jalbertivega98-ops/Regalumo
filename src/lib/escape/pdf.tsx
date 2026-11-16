import React from "react";
import { Document, Page, Path, Polygon, Svg, Circle, Line, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "../pdf/fonts";
import { AGES, DIFFICULTIES, type EscapeGame, type Printable } from "./generator";

const INK = "#1E1633";
const ACCENT = "#7C5CFF";
const SOFT = "#F3EFFF";
const MUTED = "#5E5873";

const s = {
  page: { padding: 40, fontFamily: "Inter", fontSize: 11, color: INK, lineHeight: 1.45 },
  h1: { fontFamily: "Fraunces", fontWeight: 900 as const, fontSize: 30, marginBottom: 8, lineHeight: 1.1 },
  h2: { fontFamily: "Fraunces", fontWeight: 700 as const, fontSize: 18, marginTop: 14, marginBottom: 6, color: ACCENT },
  small: { fontSize: 9, color: MUTED },
  li: { flexDirection: "row" as const, marginBottom: 3 },
};

function Footer({ title }: { title: string }) {
  return (
    <View fixed style={{ position: "absolute", bottom: 18, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED }}>
      <Text>{title}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.li}>
      <Text style={{ width: 12, color: ACCENT }}>•</Text>
      <Text style={{ flex: 1 }}>{children}</Text>
    </View>
  );
}

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function AlphabetStrip({ numbers }: { numbers?: boolean }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12, borderWidth: 1, borderColor: INK }}>
      {ABC.split("").map((c, i) => (
        <View key={c} style={{ width: `${100 / 13}%`, borderRightWidth: (i + 1) % 13 ? 0.5 : 0, borderBottomWidth: i < 13 ? 0.5 : 0, borderColor: INK, paddingVertical: 4, alignItems: "center" }}>
          <Text style={{ fontWeight: 800, fontSize: 13 }}>{c}</Text>
          {numbers ? <Text style={{ fontSize: 8, color: MUTED }}>{i + 1}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function ShapeSvg({ shape, x, y, r, rot }: { shape: string; x: number; y: number; r: number; rot: number }) {
  const t = `rotate(${rot} ${x} ${y})`;
  if (shape === "circle") return <Circle cx={x} cy={y} r={r * 0.8} stroke={INK} strokeWidth={0.8} fill="none" />;
  if (shape === "triangle") return <Polygon transform={t} points={`${x},${y - r} ${x + r * 0.9},${y + r * 0.7} ${x - r * 0.9},${y + r * 0.7}`} stroke={INK} strokeWidth={0.8} fill="none" />;
  if (shape === "heart")
    return (
      <Path
        transform={t}
        d={`M ${x} ${y + r * 0.8} C ${x - r * 1.4} ${y - r * 0.2}, ${x - r * 0.6} ${y - r * 1.2}, ${x} ${y - r * 0.4} C ${x + r * 0.6} ${y - r * 1.2}, ${x + r * 1.4} ${y - r * 0.2}, ${x} ${y + r * 0.8} Z`}
        stroke={INK}
        strokeWidth={0.8}
        fill="none"
      />
    );
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  }).join(" ");
  return <Polygon transform={t} points={pts} stroke={INK} strokeWidth={0.8} fill="none" />;
}

export function PrintableView({ p }: { p: Printable }) {
  switch (p.type) {
    case "text":
      return (
        <View style={{ marginTop: 10, padding: 18, backgroundColor: SOFT, borderRadius: 8 }}>
          {p.lines.map((l, i) => (
            <Text key={i} style={{ fontFamily: "Fraunces", fontSize: 20, textAlign: "center", lineHeight: 1.35 }}>{l}</Text>
          ))}
          {p.big ? <Text style={{ textAlign: "center", marginTop: 10, fontWeight: 800, color: ACCENT }}>{p.big}</Text> : null}
        </View>
      );
    case "cipher":
      return (
        <View style={{ marginTop: 10 }}>
          <View style={{ padding: 18, backgroundColor: SOFT, borderRadius: 8 }}>
            <Text style={{ fontSize: p.mode === "numbers" ? 22 : 30, fontWeight: 800, textAlign: "center", letterSpacing: p.mode === "numbers" ? 1 : 6 }}>{p.encoded}</Text>
          </View>
          {p.table ? <AlphabetStrip numbers={p.mode === "numbers"} /> : null}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
            {Array.from({ length: p.mode === "numbers" ? p.encoded.split(" - ").length : p.encoded.length }).map((_, i) => (
              <View key={i} style={{ width: 28, height: 32, borderBottomWidth: 1.5, borderColor: INK, marginHorizontal: 4 }} />
            ))}
          </View>
        </View>
      );
    case "sequence":
      return (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
          {p.terms.map((t, i) => (
            <View key={i} style={{ width: 62, height: 62, marginHorizontal: 4, borderWidth: 2, borderColor: t === "?" ? ACCENT : INK, borderRadius: 31, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: 800, color: t === "?" ? ACCENT : INK }}>{String(t)}</Text>
            </View>
          ))}
        </View>
      );
    case "lock":
      return (
        <View style={{ marginTop: 10 }}>
          {p.clues.map((c, i) => (
            <Text key={i} style={{ fontSize: 14, marginBottom: 10, padding: 10, backgroundColor: SOFT, borderRadius: 6 }}>{c}</Text>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
            {Array.from({ length: p.digits }).map((_, i) => (
              <View key={i} style={{ width: 44, height: 54, borderWidth: 2, borderColor: INK, borderRadius: 8, marginHorizontal: 6 }} />
            ))}
          </View>
        </View>
      );
    case "logic":
      return (
        <View style={{ marginTop: 10 }}>
          {p.statements.map((c, i) => (
            <Bullet key={i}>{c}</Bullet>
          ))}
          <Text style={{ marginTop: 10, fontWeight: 800, color: ACCENT }}>{p.question}</Text>
          <View style={{ flexDirection: "row", marginTop: 14 }}>
            {["1.º", "2.º", "3.º", "4.º"].map((l) => (
              <View key={l} style={{ flex: 1, height: 50, borderWidth: 1, borderColor: INK, marginRight: 6, padding: 4 }}>
                <Text style={s.small}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case "wordsearch": {
      const n = p.grid.length;
      const cell = Math.min(34, 440 / n);
      return (
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <View style={{ borderWidth: 1.5, borderColor: INK }}>
            {p.grid.map((row, y) => (
              <View key={y} style={{ flexDirection: "row" }}>
                {row.map((c, x) => (
                  <View key={x} style={{ width: cell, height: cell, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: cell * 0.5, fontWeight: 600 }}>{c}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
            {p.words.map((w) => (
              <View key={w} style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginBottom: 4 }}>
                <View style={{ width: 9, height: 9, borderWidth: 1, borderColor: INK, marginRight: 4 }} />
                <Text style={{ fontWeight: 600 }}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    case "maze": {
      const size = 460;
      const c = size / Math.max(p.w, p.h);
      const lines: React.ReactElement[] = [];
      p.walls.forEach((wb, i) => {
        const x = (i % p.w) * c, y = Math.floor(i / p.w) * c;
        const k = (n: number) => `${i}-${n}`;
        if (wb & 1 && i !== p.start) lines.push(<Line key={k(1)} x1={x} y1={y} x2={x + c} y2={y} stroke={INK} strokeWidth={2} />);
        if (wb & 8) lines.push(<Line key={k(8)} x1={x} y1={y} x2={x} y2={y + c} stroke={INK} strokeWidth={2} />);
        if (wb & 4 && i !== p.end) lines.push(<Line key={k(4)} x1={x} y1={y + c} x2={x + c} y2={y + c} stroke={INK} strokeWidth={2} />);
        if (wb & 2) lines.push(<Line key={k(2)} x1={x + c} y1={y} x2={x + c} y2={y + c} stroke={INK} strokeWidth={2} />);
      });
      return (
        <View style={{ marginTop: 6, alignItems: "center" }}>
          <Text style={{ fontWeight: 800, color: ACCENT, alignSelf: "flex-start", marginLeft: 20 }}>↓ ENTRADA</Text>
          <View style={{ width: size, height: size, position: "relative" }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{lines}</Svg>
            {Object.entries(p.letters).map(([cellIdx, letter]) => {
              const i = Number(cellIdx);
              return (
                <Text key={cellIdx} style={{ position: "absolute", left: (i % p.w) * c, top: Math.floor(i / p.w) * c + c * 0.22, width: c, textAlign: "center", fontSize: c * 0.42, fontWeight: 800 }}>
                  {letter}
                </Text>
              );
            })}
          </View>
          <Text style={{ fontWeight: 800, color: ACCENT, alignSelf: "flex-end", marginRight: 20 }}>SALIDA ↓</Text>
        </View>
      );
    }
    case "shapes":
      return (
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Svg width={440} height={440} viewBox="0 0 100 100">
            {p.items.map((it, i) => (
              <ShapeSvg key={i} {...it} />
            ))}
          </Svg>
        </View>
      );
  }
}

function Cards({ items, cols = 3, height = 150 }: { items: React.ReactNode[]; cols?: number; height?: number }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {items.map((it, i) => (
        <View key={i} wrap={false} style={{ width: `${100 / cols}%`, height, padding: 4 }}>
          <View style={{ flex: 1, borderWidth: 1, borderStyle: "dashed", borderColor: MUTED, borderRadius: 6, padding: 10 }}>{it}</View>
        </View>
      ))}
    </View>
  );
}

export async function renderEscapePdf(g: EscapeGame) {
  registerFonts();
  return renderToBuffer(<EscapeDoc g={g} />);
}

function EscapeDoc({ g }: { g: EscapeGame }) {
  const n = g.puzzles.length;
  const { input } = g;
  return (
    <Document title={g.title} author="REGALUMO" creator="REGALUMO">
      {/* Portada */}
      <Page size="A4" style={{ ...s.page, padding: 0 }}>
        <View style={{ flex: 1, backgroundColor: INK, padding: 50, justifyContent: "space-between" }}>
          <Text style={{ color: "#FFC23D", fontWeight: 800, letterSpacing: 3, fontSize: 11 }}>ESCAPE ROOM · {g.themeName.toUpperCase()}</Text>
          <View>
            <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 46, color: "#FFFFFF", lineHeight: 1.05 }}>{g.title}</Text>
            <Text style={{ color: "#CFC7F5", fontSize: 14, marginTop: 14 }}>
              {AGES[input.age]} · {input.players} jugadores · {input.duration} minutos · dificultad {DIFFICULTIES[input.difficulty].toLowerCase()}
            </Text>
          </View>
          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 11 }}>Contenido: guía del organizador, historia, {n} acertijos, tarjetas de recompensa y de pistas, reto final, soluciones y diploma.</Text>
            <Text style={{ color: "#8E86B0", fontSize: 9, marginTop: 8 }}>Creado con REGALUMO · Uso privado y familiar</Text>
          </View>
        </View>
      </Page>

      {/* Guía del organizador */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Guía del organizador</Text>
        <Text style={s.small}>Lee esta guía antes de empezar. Los jugadores no deben verla.</Text>
        <Text style={s.h2}>Resumen</Text>
        <Bullet>{n} acertijos encadenados. Cada uno da una letra; con todas se forma la palabra final que abre {g.prize}.</Bullet>
        <Bullet>Duración prevista: {input.duration} minutos (unos {g.minutesPerPuzzle} minutos por acertijo y 10 para el final).</Bullet>
        <Bullet>Fichas de pista para el equipo: {g.hintTokens}. Cada ficha permite leer una tarjeta de pista.</Bullet>
        <Bullet>Tú eres {g.guardian}: compruebas respuestas y entregas recompensas.</Bullet>
        <Text style={s.h2}>Materiales</Text>
        <Bullet>Impresora (papel A4 normal), tijeras y {n + 1} sobres numerados.</Bullet>
        <Bullet>Lápices o rotuladores para el equipo.</Bullet>
        <Bullet>Una caja, bolsa o cajón que hará de {g.prize}, con un pequeño premio o sorpresa dentro.</Bullet>
        {g.puzzles.some((p) => p.kind === "lock") ? <Bullet>Opcional: un candado de combinación para la caja de un acertijo numérico.</Bullet> : null}
        <Text style={s.h2}>Preparación (20-30 minutos)</Text>
        <Bullet>1. Imprime todo el documento. Recorta las tarjetas de recompensa y de pistas.</Bullet>
        <Bullet>2. Mete cada acertijo en su sobre numerado (sobre 1 = acertijo 1...). El sobre {n + 1} lleva la hoja del reto final.</Bullet>
        <Bullet>3. Esconde los sobres 2 a {n + 1} en lugares seguros de la casa o el jardín. Apunta cada escondite en la tarjeta de recompensa del acertijo anterior (hay un hueco para escribirlo).</Bullet>
        <Bullet>4. Prepara {g.prize} con el premio y guárdala hasta el final.</Bullet>
        <Bullet>5. Entrega el sobre 1 al equipo después de leer la historia en voz alta.</Bullet>
        <Text style={s.h2}>Cómo se juega</Text>
        <Bullet>El equipo resuelve un acertijo y te dice la respuesta. Si es correcta, le das su tarjeta de recompensa: contiene una letra y el escondite del siguiente sobre.</Bullet>
        <Bullet>Si se atascan, pueden gastar una ficha para leer una pista. Las soluciones están al final del documento.</Bullet>
        <Bullet>Con todas las letras, el equipo debe ordenarlas para formar la palabra final ({n} letras).</Bullet>
        {input.players > 6 ? <Bullet>Sois {input.players}: imprime los acertijos dos veces y forma dos equipos que compitan o colaboren.</Bullet> : null}
        <Text style={s.h2}>Seguridad</Text>
        <Bullet>No escondas sobres en sitios altos, cerca de enchufes, de la cocina encendida o en zonas peligrosas.</Bullet>
        <Bullet>Con peques, acompaña siempre la búsqueda y lee tú los textos si hace falta.</Bullet>
        <Footer title={g.title} />
      </Page>

      {/* Historia */}
      <Page size="A4" style={s.page}>
        <Text style={{ ...s.small, color: ACCENT, fontWeight: 800 }}>PARA LEER EN VOZ ALTA</Text>
        <Text style={s.h1}>{g.title}</Text>
        <Text style={{ fontFamily: "Fraunces", fontSize: 16, lineHeight: 1.6, marginTop: 10 }}>{g.intro}</Text>
        <Text style={{ fontFamily: "Fraunces", fontSize: 16, lineHeight: 1.6, marginTop: 14 }}>
          Tenéis {input.duration} minutos. Cada reto superado os dará una letra. ¡Que empiece la aventura!
        </Text>
        <Footer title={g.title} />
      </Page>

      {/* Acertijos */}
      {g.puzzles.map((p, i) => (
        <Page key={i} size="A4" style={s.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: 800, color: ACCENT, letterSpacing: 2 }}>SOBRE {i + 1}</Text>
            <Text style={s.small}>{g.themeName}</Text>
          </View>
          <Text style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 13, marginTop: 10, color: MUTED }}>{p.chapter}</Text>
          <Text style={{ ...s.h1, marginTop: 6 }}>{p.title}</Text>
          <Text style={{ fontSize: 13 }}>{p.instructions}</Text>
          <PrintableView p={p.printable} />
          <Footer title={g.title} />
        </Page>
      ))}

      {/* Reto final */}
      <Page size="A4" style={s.page}>
        <Text style={{ fontWeight: 800, color: ACCENT, letterSpacing: 2 }}>SOBRE {n + 1} · RETO FINAL</Text>
        <Text style={{ ...s.h1, marginTop: 8 }}>La palabra que lo abre todo</Text>
        <Text style={{ fontSize: 13 }}>Habéis reunido {n} letras. Colocadlas en el orden correcto para formar la palabra final y decídsela a {g.guardian}.</Text>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 40 }}>
          {Array.from({ length: n }).map((_, i) => (
            <View key={i} style={{ width: 46, height: 56, borderWidth: 2, borderColor: INK, borderRadius: 8, marginHorizontal: 4 }} />
          ))}
        </View>
        <Footer title={g.title} />
      </Page>

      {/* Tarjetas de recompensa */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Tarjetas de recompensa</Text>
        <Text style={{ ...s.small, marginBottom: 10 }}>Recórtalas. Entrega cada una cuando el equipo resuelva su acertijo. Escribe en ella dónde está el siguiente sobre.</Text>
        <Cards
          items={g.puzzles.map((p, i) => (
            <View key={i} style={{ flex: 1, justifyContent: "space-between" }}>
              <Text style={s.small}>Recompensa del acertijo {i + 1}</Text>
              <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 48, textAlign: "center", color: ACCENT }}>{p.reward}</Text>
              <Text style={{ fontSize: 9 }}>{i + 1 < n ? `Sobre ${i + 2} en: ____________________` : `Sobre ${n + 1} en: ____________________`}</Text>
            </View>
          ))}
          height={170}
        />
        <Footer title={g.title} />
      </Page>

      {/* Tarjetas de pistas */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Tarjetas de pistas</Text>
        <Text style={{ ...s.small, marginBottom: 10 }}>Recórtalas y dóblalas. Cada una se cambia por una ficha de pista.</Text>
        <Cards
          cols={2}
          height={96}
          items={g.puzzles.flatMap((p, i) =>
            p.hints.map((h, j) => (
              <View key={`${i}-${j}`}>
                <Text style={{ ...s.small, fontWeight: 800, color: ACCENT }}>Acertijo {i + 1} · pista {j + 1}</Text>
                <Text style={{ fontSize: 10.5, marginTop: 4 }}>{h}</Text>
              </View>
            )),
          )}
        />
        <Footer title={g.title} />
      </Page>

      {/* Soluciones */}
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Soluciones</Text>
        <Text style={{ ...s.small, marginBottom: 8 }}>Solo para el organizador.</Text>
        {g.puzzles.map((p, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 8, paddingBottom: 6, borderBottomWidth: 0.5, borderColor: "#D9D3EC" }}>
            <Text style={{ fontWeight: 800 }}>
              {i + 1}. {p.title} → <Text style={{ color: ACCENT }}>{p.answer}</Text> (letra de recompensa: {p.reward})
            </Text>
            <Text style={{ fontSize: 10, color: MUTED }}>{p.solution}</Text>
          </View>
        ))}
        <Text style={{ fontWeight: 800, marginTop: 6 }}>
          Reto final: {g.rewardOrder.join(" ")} → <Text style={{ color: ACCENT }}>{g.finalWord}</Text>
        </Text>
        <Text style={{ marginTop: 14, fontFamily: "Fraunces", fontSize: 13 }}>Para cerrar la aventura, lee en voz alta: «{g.ending}»</Text>
        <Footer title={g.title} />
      </Page>

      {/* Diploma */}
      <Page size="A4" orientation="landscape" style={{ ...s.page, padding: 30 }}>
        <View style={{ flex: 1, borderWidth: 4, borderColor: ACCENT, borderRadius: 16, padding: 40, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ letterSpacing: 4, fontWeight: 800, color: ACCENT }}>DIPLOMA</Text>
          <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 38, textAlign: "center", marginTop: 10 }}>{g.title}</Text>
          <Text style={{ fontSize: 15, marginTop: 20, textAlign: "center" }}>Se concede a</Text>
          <View style={{ width: 380, borderBottomWidth: 1.5, borderColor: INK, height: 40 }} />
          <Text style={{ fontSize: 15, marginTop: 20, textAlign: "center" }}>por resolver todos los enigmas con ingenio y trabajo en equipo.</Text>
          <Text style={{ fontFamily: "Caveat", fontSize: 26, marginTop: 24 }}>Firmado: {g.guardian}</Text>
        </View>
      </Page>

    </Document>
  );
}
