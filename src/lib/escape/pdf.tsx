import React from "react";
import { Document, G, Page, Path, Polygon, Rect, Svg, Circle, Line, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "../pdf/fonts";
import { AGES, DIFFICULTIES, type EscapeGame, type Printable } from "./generator";
import { PALETTES, type EscapePalette, type Motif } from "./style";

/* Los colores de la temática se pasan como prop «c» (en las rutas de Next no hay contexto de React en el servidor). */
type C = { c: EscapePalette };

function styles(c: EscapePalette) {
  return {
    page: { padding: 40, paddingTop: 46, fontFamily: "Inter", fontSize: 11, color: c.ink, lineHeight: 1.45 },
    h1: { fontFamily: "Fraunces", fontWeight: 900 as const, fontSize: 30, marginBottom: 8, lineHeight: 1.2, color: c.ink },
    h2: { fontFamily: "Fraunces", fontWeight: 700 as const, fontSize: 18, marginTop: 14, marginBottom: 6, color: c.accent },
    small: { fontSize: 9, color: c.muted },
    li: { flexDirection: "row" as const, marginBottom: 3 },
  };
}

/* ---------- motivos decorativos de cada temática (vectoriales) ---------- */

function MotifShape({ kind, x, y, r, color, filled = true }: { kind: Motif; x: number; y: number; r: number; color: string; filled?: boolean }) {
  const fill = filled ? color : "none";
  switch (kind) {
    case "snow": {
      const arms = [0, 60, 120].map((a) => {
        const rad = (a * Math.PI) / 180, dx = Math.cos(rad) * r, dy = Math.sin(rad) * r;
        return <Line key={a} x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy} stroke={color} strokeWidth={r * 0.16} />;
      });
      const ticks = [0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180, px = x + Math.cos(rad) * r * 0.6, py = y + Math.sin(rad) * r * 0.6;
        const l = r * 0.28, a1 = rad + 2.4, a2 = rad - 2.4;
        return (
          <G key={`t${a}`}>
            <Line x1={px} y1={py} x2={px + Math.cos(a1) * l} y2={py + Math.sin(a1) * l} stroke={color} strokeWidth={r * 0.12} />
            <Line x1={px} y1={py} x2={px + Math.cos(a2) * l} y2={py + Math.sin(a2) * l} stroke={color} strokeWidth={r * 0.12} />
          </G>
        );
      });
      return <G>{arms}{ticks}</G>;
    }
    case "star": {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
        return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
      }).join(" ");
      return <Polygon points={pts} fill={fill} stroke={color} strokeWidth={r * 0.1} />;
    }
    case "sparkle": {
      const q = r * 0.22;
      return <Polygon points={`${x},${y - r} ${x + q},${y - q} ${x + r},${y} ${x + q},${y + q} ${x},${y + r} ${x - q},${y + q} ${x - r},${y} ${x - q},${y - q}`} fill={fill} stroke={color} strokeWidth={r * 0.08} />;
    }
    case "leaf":
      return (
        <G>
          <Path d={`M ${x - r * 0.7} ${y + r * 0.7} Q ${x - r * 0.6} ${y - r * 0.9} ${x + r * 0.8} ${y - r * 0.8} Q ${x + r * 0.7} ${y + r * 0.6} ${x - r * 0.7} ${y + r * 0.7} Z`} fill={fill} stroke={color} strokeWidth={r * 0.1} />
          <Line x1={x - r * 0.9} y1={y + r * 0.9} x2={x + r * 0.3} y2={y - r * 0.3} stroke={filled ? "#FFFFFF" : color} strokeWidth={r * 0.08} />
        </G>
      );
    case "wave":
      return <Path d={`M ${x - r} ${y} Q ${x - r * 0.5} ${y - r * 0.7} ${x} ${y} Q ${x + r * 0.5} ${y + r * 0.7} ${x + r} ${y}`} fill="none" stroke={color} strokeWidth={r * 0.22} />;
    case "diamond":
      return <Polygon points={`${x},${y - r} ${x + r * 0.7},${y} ${x},${y + r} ${x - r * 0.7},${y}`} fill={fill} stroke={color} strokeWidth={r * 0.1} />;
    case "print":
      return (
        <G>
          <Circle cx={x - r * 0.2} cy={y - r * 0.2} r={r * 0.55} fill="none" stroke={color} strokeWidth={r * 0.16} />
          <Line x1={x + r * 0.2} y1={y + r * 0.2} x2={x + r * 0.85} y2={y + r * 0.85} stroke={color} strokeWidth={r * 0.26} />
        </G>
      );
  }
}

/** Tira de adornos en lo alto de cada página. */
function MotifBand({ c }: C) {
  const w = 515, n = 23;
  return (
    <View fixed style={{ position: "absolute", top: 16, left: 40, right: 40, height: 14 }}>
      <Svg width={w} height={14} viewBox={`0 0 ${w} 14`}>
        <Line x1={0} y1={7} x2={w} y2={7} stroke={c.soft} strokeWidth={3} />
        {Array.from({ length: n }).map((_, i) => (
          <MotifShape key={i} kind={c.motif} x={((i + 0.5) * w) / n} y={7} r={5} color={i % 2 ? c.accent2 : c.accent} />
        ))}
      </Svg>
    </View>
  );
}

type Box = [number, number, number, number];

/** Posiciones pseudoaleatorias fijas (mismo «seed», mismo dibujo) que no se pisan ni tapan el texto. */
function scatterPoints(w: number, h: number, count: number, seed: number, rMin: number, rMax: number, avoid: Box[]) {
  let t = seed * 9301 + 49297;
  const rnd = () => ((t = (t * 9301 + 49297) % 233280) / 233280);
  const pts: { x: number; y: number; r: number }[] = [];
  for (let tries = 0; pts.length < count && tries < count * 30; tries++) {
    const r = rMin + rnd() * (rMax - rMin), x = r + rnd() * (w - 2 * r), y = r + rnd() * (h - 2 * r);
    if (avoid.some(([ax, ay, aw, ah]) => x + r > ax && x - r < ax + aw && y + r > ay && y - r < ay + ah)) continue;
    if (pts.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + r + 4)) continue;
    pts.push({ x, y, r });
  }
  return pts;
}

/** Motivos dispersos para portada, reto final y puzle. «avoid»: zonas con texto (x, y, ancho, alto). */
function Scatter({ w, h, color, count, seed = 1, rMin = 6, rMax = 14, filled = true, avoid = [], c }: { w: number; h: number; color: string; count: number; seed?: number; rMin?: number; rMax?: number; filled?: boolean; avoid?: Box[] } & C) {
  const pts = scatterPoints(w, h, count, seed, rMin, rMax, avoid);
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {pts.map((q, i) => (
        <MotifShape key={i} kind={c.motif} x={q.x} y={q.y} r={q.r} color={color} filled={filled} />
      ))}
    </Svg>
  );
}

function Footer({ title, c }: { title: string } & C) {
  return (
    <View fixed style={{ position: "absolute", bottom: 18, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: c.muted }}>
      <Text>{title}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Bullet({ children, c }: { children: React.ReactNode } & C) {
  const s = styles(c);
  return (
    <View style={s.li}>
      <Text style={{ width: 12, color: c.accent }}>•</Text>
      <Text style={{ flex: 1 }}>{children}</Text>
    </View>
  );
}

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function AlphabetStrip({ numbers, c }: { numbers?: boolean } & C) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 14, borderWidth: 1, borderColor: c.ink, width: 39 * 13 + 2, alignSelf: "center" }}>
      {ABC.split("").map((ch, i) => (
        <View key={ch} style={{ width: 39, borderRightWidth: (i + 1) % 13 ? 0.5 : 0, borderBottomWidth: i < 13 ? 0.5 : 0, borderColor: c.ink, paddingVertical: 5, alignItems: "center" }}>
          <Text style={{ fontWeight: 800, fontSize: 14 }}>{ch}</Text>
          {numbers ? <Text style={{ fontSize: 8.5, color: c.muted }}>{i + 1}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function ShapeSvg({ shape, x, y, r, rot, color, fill = "none", sw = 0.8 }: { shape: string; x: number; y: number; r: number; rot: number; color: string; fill?: string; sw?: number }) {
  const t = `rotate(${rot} ${x} ${y})`;
  const common = { stroke: color, strokeWidth: sw, fill };
  if (shape === "circle") return <Circle cx={x} cy={y} r={r * 0.8} {...common} />;
  if (shape === "square") return <Rect transform={t} x={x - r * 0.72} y={y - r * 0.72} width={r * 1.44} height={r * 1.44} {...common} />;
  if (shape === "diamond") return <Polygon transform={t} points={`${x},${y - r} ${x + r * 0.75},${y} ${x},${y + r} ${x - r * 0.75},${y}`} {...common} />;
  if (shape === "triangle") return <Polygon transform={t} points={`${x},${y - r} ${x + r * 0.9},${y + r * 0.7} ${x - r * 0.9},${y + r * 0.7}`} {...common} />;
  if (shape === "heart")
    return (
      <Path
        transform={t}
        d={`M ${x} ${y + r * 0.8} C ${x - r * 1.4} ${y - r * 0.2}, ${x - r * 0.6} ${y - r * 1.2}, ${x} ${y - r * 0.4} C ${x + r * 0.6} ${y - r * 1.2}, ${x + r * 1.4} ${y - r * 0.2}, ${x} ${y + r * 0.8} Z`}
        {...common}
      />
    );
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  }).join(" ");
  return <Polygon transform={t} points={pts} {...common} />;
}

/** Símbolos del cifrado: forma = sym % 6, estilo = contorno / relleno / con punto. */
export const SYMBOL_SHAPES = ["circle", "square", "triangle", "diamond", "star", "heart"] as const;

function SymbolGlyph({ sym, size, c }: { sym: number; size: number } & C) {
  const shape = SYMBOL_SHAPES[sym % 6];
  const style = Math.floor(sym / 6);
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <ShapeSvg shape={shape} x={10} y={shape === "triangle" ? 11.5 : 10.5} r={8.5} rot={0} color={c.ink} fill={style === 1 ? c.ink : "none"} sw={1.4} />
      {style === 2 ? <Circle cx={10} cy={shape === "triangle" ? 13 : shape === "heart" ? 10 : 10.5} r={1.9} fill={c.ink} /> : null}
    </Svg>
  );
}

/** Dibujo completo del puzle recortable (cada pieza muestra un trozo). */
function JigsawArt({ word, W, H, c }: { word: string; W: number; H: number } & C) {
  const fs = Math.min(H * 0.42, ((W - 70) / word.length) * 1.3);
  return (
    <View style={{ width: W, height: H, backgroundColor: c.soft, borderWidth: 7, borderColor: c.accent, position: "relative" }}>
      <Scatter c={c} w={W - 14} h={H - 14} color={c.accent2} count={16} seed={word.length * 7 + word.charCodeAt(0)} rMin={5} rMax={11} />
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: fs, letterSpacing: 4, color: c.ink }}>{word}</Text>
      </View>
    </View>
  );
}

export function PrintableView({ p, c }: { p: Printable } & C) {
  const s = styles(c);
  switch (p.type) {
    case "text":
      return (
        <View style={{ marginTop: 14, padding: 22, backgroundColor: c.soft, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: c.accent }}>
          {p.lines.map((l, i) => (
            <Text key={i} style={{ fontFamily: "Fraunces", fontSize: 24, textAlign: "center", lineHeight: 1.35 }}>{l}</Text>
          ))}
          {p.big ? <Text style={{ textAlign: "center", marginTop: 12, fontWeight: 800, color: c.accent, fontSize: 13 }}>{p.big}</Text> : null}
        </View>
      );
    case "cipher":
      return (
        <View style={{ marginTop: 14 }}>
          <View style={{ padding: 22, backgroundColor: c.soft, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: c.accent }}>
            <Text style={{ fontSize: p.mode === "numbers" ? 26 : 36, fontWeight: 800, textAlign: "center", letterSpacing: p.mode === "numbers" ? 1 : 7 }}>{p.encoded}</Text>
          </View>
          {p.table ? <AlphabetStrip c={c} numbers={p.mode === "numbers"} /> : null}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 22 }}>
            {Array.from({ length: p.mode === "numbers" ? p.encoded.split(" - ").length : p.encoded.length }).map((_, i) => (
              <View key={i} style={{ width: 34, height: 38, borderBottomWidth: 1.5, borderColor: c.ink, marginHorizontal: 5 }} />
            ))}
          </View>
        </View>
      );
    case "sequence":
      return (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 30 }}>
          {p.terms.map((t, i) => (
            <View key={i} style={{ width: 68, height: 68, marginHorizontal: 5, borderWidth: 2, borderColor: t === "?" ? c.accent : c.ink, backgroundColor: t === "?" ? c.soft : "#FFFFFF", borderRadius: 34, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: 800, color: t === "?" ? c.accent : c.ink }}>{String(t)}</Text>
            </View>
          ))}
        </View>
      );
    case "lock":
      return (
        <View style={{ marginTop: 14 }}>
          {p.clues.map((cl, i) => (
            <Text key={i} style={{ fontSize: 15, marginBottom: 10, padding: 12, backgroundColor: c.soft, borderRadius: 6 }}>{cl}</Text>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 14 }}>
            {Array.from({ length: p.digits }).map((_, i) => (
              <View key={i} style={{ width: 50, height: 60, borderWidth: 2, borderColor: c.ink, borderRadius: 8, marginHorizontal: 6 }} />
            ))}
          </View>
        </View>
      );
    case "logic":
      return (
        <View style={{ marginTop: 14 }}>
          {p.statements.map((st, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 6 }}>
              <Text style={{ width: 16, color: c.accent, fontSize: 14 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 14 }}>{st}</Text>
            </View>
          ))}
          <Text style={{ marginTop: 12, fontWeight: 800, color: c.accent, fontSize: 13 }}>{p.question}</Text>
          <View style={{ flexDirection: "row", marginTop: 14 }}>
            {["1.º", "2.º", "3.º", "4.º"].map((l) => (
              <View key={l} style={{ flex: 1, height: 56, borderWidth: 1, borderColor: c.ink, marginRight: 6, padding: 4 }}>
                <Text style={s.small}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case "wordsearch": {
      const n = p.grid.length;
      const cell = n >= 11 ? 31 : 37; // más grande no cabe en la página con la lista y la respuesta
      return (
        <View style={{ marginTop: 14, alignItems: "center" }}>
          <View style={{ borderWidth: 1.5, borderColor: c.ink }}>
            {p.grid.map((row, y) => (
              <View key={y} style={{ flexDirection: "row" }}>
                {row.map((ch, x) => (
                  <View key={x} style={{ width: cell, height: cell, alignItems: "center", justifyContent: "center", backgroundColor: (x + y) % 2 ? "#FFFFFF" : c.soft }}>
                    <Text style={{ fontSize: cell * 0.5, fontWeight: 600 }}>{ch}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
            {p.words.map((w) => (
              <View key={w} style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 8, marginBottom: 5 }}>
                <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: c.ink, marginRight: 4 }} />
                <Text style={{ fontWeight: 600, fontSize: 12 }}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    case "maze": {
      const size = 440;
      const cs = size / Math.max(p.w, p.h);
      const lines: React.ReactElement[] = [];
      p.walls.forEach((wb, i) => {
        const x = (i % p.w) * cs, y = Math.floor(i / p.w) * cs;
        const k = (n: number) => `${i}-${n}`;
        if (wb & 1 && i !== p.start) lines.push(<Line key={k(1)} x1={x} y1={y} x2={x + cs} y2={y} stroke={c.ink} strokeWidth={2} />);
        if (wb & 8) lines.push(<Line key={k(8)} x1={x} y1={y} x2={x} y2={y + cs} stroke={c.ink} strokeWidth={2} />);
        if (wb & 4 && i !== p.end) lines.push(<Line key={k(4)} x1={x} y1={y + cs} x2={x + cs} y2={y + cs} stroke={c.ink} strokeWidth={2} />);
        if (wb & 2) lines.push(<Line key={k(2)} x1={x + cs} y1={y} x2={x + cs} y2={y + cs} stroke={c.ink} strokeWidth={2} />);
      });
      return (
        <View style={{ marginTop: 8, alignItems: "center" }}>
          <Text style={{ fontWeight: 800, color: c.accent, alignSelf: "flex-start", marginLeft: 0 }}>↓ ENTRADA</Text>
          <View style={{ width: size, height: size, position: "relative" }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{lines}</Svg>
            {Object.entries(p.letters).map(([cellIdx, letter]) => {
              const i = Number(cellIdx);
              return (
                <Text key={cellIdx} style={{ position: "absolute", left: (i % p.w) * cs, top: Math.floor(i / p.w) * cs + cs * 0.22, width: cs, textAlign: "center", fontSize: cs * 0.42, fontWeight: 800 }}>
                  {letter}
                </Text>
              );
            })}
          </View>
          <Text style={{ fontWeight: 800, color: c.accent, alignSelf: "flex-end" }}>SALIDA ↓</Text>
        </View>
      );
    }
    case "shapes":
      return (
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Svg width={420} height={420} viewBox="0 0 100 100">
            {p.items.map((it, i) => (
              <ShapeSvg key={i} {...it} color={c.ink} />
            ))}
          </Svg>
        </View>
      );
    case "symbols":
      return (
        <View style={{ marginTop: 14 }}>
          <View style={{ padding: 16, backgroundColor: c.soft, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: c.accent, flexDirection: "row", justifyContent: "center" }}>
            {p.message.map((sym, i) => (
              <View key={i} style={{ alignItems: "center", marginHorizontal: 6 }}>
                <SymbolGlyph c={c} sym={sym} size={46} />
                <View style={{ width: 38, height: 32, borderBottomWidth: 1.5, borderColor: c.ink }} />
              </View>
            ))}
          </View>
          <Text style={{ fontWeight: 800, color: c.accent, marginTop: 18, marginBottom: 6, fontSize: 12, letterSpacing: 1 }}>TABLA DEL CÓDIGO</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderLeftWidth: 1, borderColor: c.ink }}>
            {p.key.map((k) => (
              <View key={k.letter} style={{ width: "16.66%", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRightWidth: 1, borderBottomWidth: 1, borderColor: c.ink }}>
                <SymbolGlyph c={c} sym={k.sym} size={30} />
                <Text style={{ fontSize: 18, fontWeight: 800, marginLeft: 6 }}>= {k.letter}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case "jigsaw": {
      const big = p.rows === 2;
      const W = big ? 420 : 440, H = big ? 240 : 270;
      const pw = W / p.cols, ph = H / p.rows;
      return (
        <View style={{ marginTop: 14, alignItems: "center" }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", width: p.cols * (pw + 14) }}>
            {p.pieces.map((pc, i) => (
              <View key={i} style={{ margin: 6, borderWidth: 1, borderStyle: "dashed", borderColor: c.muted, padding: 0 }}>
                <View style={{ width: pw, height: ph, overflow: "hidden", position: "relative", transform: pc.flip ? "rotate(180deg)" : undefined }}>
                  <View style={{ position: "absolute", left: -pc.c * pw, top: -pc.r * ph }}>
                    <JigsawArt c={c} word={p.word} W={W} H={H} />
                  </View>
                </View>
              </View>
            ))}
          </View>
          <Text style={{ ...s.small, marginTop: 6 }}>✂ Recortad por la línea de puntos. Podéis pegar el puzle montado con celo.</Text>
        </View>
      );
    }
  }
}

function Cards({ items, cols = 3, height = 150, c }: { items: React.ReactNode[]; cols?: number; height?: number } & C) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {items.map((it, i) => (
        <View key={i} wrap={false} style={{ width: `${100 / cols}%`, height, padding: 4 }}>
          <View style={{ flex: 1, borderWidth: 1, borderStyle: "dashed", borderColor: c.muted, borderRadius: 6, padding: 10 }}>{it}</View>
        </View>
      ))}
    </View>
  );
}

export async function renderEscapePdf(g: EscapeGame) {
  registerFonts();
  return renderToBuffer(
    <EscapeDoc g={g} c={PALETTES[g.input.theme]} />,
  );
}

const KIND_LABEL: Record<string, string> = {
  riddle: "Adivinanza", anagram: "Letras revueltas", caesar: "Mensaje cifrado", numbers: "Números", mirror: "Espejo",
  sequence: "Serie", lock: "Candado", wordsearch: "Sopa de letras", maze: "Laberinto", shapes: "Contar figuras",
  logic: "Lógica", jigsaw: "Puzle recortable", symbols: "Código de símbolos",
};

function EscapeDoc({ g, c }: { g: EscapeGame } & C) {
  const s = styles(c);
  const n = g.puzzles.length;
  const { input } = g;
  const hasJigsaw = g.puzzles.some((p) => p.kind === "jigsaw");
  return (
    <Document title={g.title} author="REGALUMO" creator="REGALUMO">
      {/* Portada */}
      <Page size="A4" style={{ ...s.page, padding: 0, paddingTop: 0 }}>
        <View style={{ flex: 1, backgroundColor: c.cover, position: "relative" }}>
          <Scatter c={c} w={595} h={842} color={c.coverAccent} count={24} seed={3} rMin={5} rMax={16} filled={false} avoid={[[40, 30, 330, 40], [40, 250, 520, 290], [40, 690, 520, 120]]} />
          <View style={{ flex: 1, padding: 50, justifyContent: "space-between" }}>
            <Text style={{ color: c.coverAccent, fontWeight: 800, letterSpacing: 3, fontSize: 11 }}>ESCAPE ROOM · {g.themeName.toUpperCase()}</Text>
            <View>
              <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 46, color: "#FFFFFF", lineHeight: 1.15 }}>{g.title}</Text>
              <View style={{ width: 90, height: 5, backgroundColor: c.coverAccent, marginTop: 18, borderRadius: 3 }} />
              <Text style={{ color: "#FFFFFF", opacity: 0.85, fontSize: 14, marginTop: 14 }}>
                {AGES[input.age]} · {input.players} jugadores · {input.duration} minutos · dificultad {DIFFICULTIES[input.difficulty].toLowerCase()}
              </Text>
            </View>
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 11 }}>Contenido: guía y hoja de control del organizador, historia, {n} acertijos, reto final, tarjetas de recompensa y de pistas, soluciones y diploma.</Text>
              <Text style={{ color: "#FFFFFF", opacity: 0.6, fontSize: 9, marginTop: 8 }}>Creado con REGALUMO · Uso privado y familiar</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Guía del organizador */}
      <Page size="A4" style={s.page}>
        <MotifBand c={c} />
        <Text style={s.h1}>Guía del organizador</Text>
        <Text style={s.small}>Lee esta guía antes de empezar. Los jugadores no deben verla.</Text>
        <Text style={s.h2}>Resumen</Text>
        <Bullet c={c}>{n} acertijos encadenados. Cada uno da una letra; con todas se forma la palabra final que abre {g.prize}.</Bullet>
        <Bullet c={c}>Duración prevista: {input.duration} minutos (unos {g.minutesPerPuzzle} minutos por acertijo y 10 para el final).</Bullet>
        <Bullet c={c}>Fichas de pista para el equipo: {g.hintTokens}. Cada ficha permite leer una tarjeta de pista.</Bullet>
        <Bullet c={c}>Tú eres {g.guardian}: compruebas respuestas y entregas recompensas. Tienes todo a mano en la hoja de control de la página siguiente.</Bullet>
        <Text style={s.h2}>Materiales</Text>
        <Bullet c={c}>Impresora (papel A4 normal), tijeras y {n + 1} sobres numerados.</Bullet>
        <Bullet c={c}>Lápices o rotuladores para el equipo.{hasJigsaw ? " Tijeras y un poco de celo para el puzle recortable." : ""}</Bullet>
        <Bullet c={c}>Una caja, bolsa o cajón que hará de {g.prize}, con un pequeño premio o sorpresa dentro.</Bullet>
        {g.puzzles.some((p) => p.kind === "lock") ? <Bullet c={c}>Opcional: un candado de combinación para la caja de un acertijo numérico.</Bullet> : null}
        <Text style={s.h2}>Preparación (20-30 minutos)</Text>
        <Bullet c={c}>1. Imprime todo el documento. Recorta las tarjetas de recompensa y de pistas.{hasJigsaw ? " Las piezas del puzle las recorta el equipo durante el juego." : ""}</Bullet>
        <Bullet c={c}>2. Mete cada acertijo en su sobre numerado (sobre 1 = acertijo 1...). El sobre {n + 1} lleva la hoja del reto final.</Bullet>
        <Bullet c={c}>3. Esconde los sobres 2 a {n + 1} en lugares seguros de la casa o el jardín. Apunta cada escondite en la hoja de control y en la tarjeta de recompensa del acertijo anterior.</Bullet>
        <Bullet c={c}>4. Prepara {g.prize} con el premio y guárdala hasta el final.</Bullet>
        <Bullet c={c}>5. Entrega el sobre 1 al equipo después de leer la historia en voz alta.</Bullet>
        <Text style={s.h2}>Cómo se juega</Text>
        <Bullet c={c}>El equipo resuelve un acertijo y te dice la respuesta. Si es correcta, le das su tarjeta de recompensa: contiene una letra y el escondite del siguiente sobre.</Bullet>
        <Bullet c={c}>Si se atascan, pueden gastar una ficha para leer una pista. Las soluciones están al final del documento.</Bullet>
        <Bullet c={c}>Con todas las letras, el equipo debe ordenarlas para formar la palabra final ({n} letras).</Bullet>
        {input.players > 6 ? <Bullet c={c}>Sois {input.players}: imprime los acertijos dos veces y forma dos equipos que compitan o colaboren.</Bullet> : null}
        <Text style={s.h2}>Seguridad</Text>
        <Bullet c={c}>No escondas sobres en sitios altos, cerca de enchufes, de la cocina encendida o en zonas peligrosas.</Bullet>
        <Bullet c={c}>Con peques, acompaña siempre la búsqueda y lee tú los textos si hace falta.</Bullet>
        <Footer c={c} title={g.title} />
      </Page>

      {/* Hoja de control */}
      <Page size="A4" style={s.page}>
        <MotifBand c={c} />
        <Text style={s.h1}>Hoja de control</Text>
        <Text style={{ ...s.small, marginBottom: 12 }}>Solo para el organizador. Tenla a mano durante el juego: respuestas, letras y escondites en una sola página.</Text>
        <View style={{ flexDirection: "row", backgroundColor: c.accent, paddingVertical: 6, paddingHorizontal: 6 }}>
          {[["Sobre", 44], ["Reto", 110], ["Respuesta", 110], ["Letra", 40], ["Escondo el siguiente sobre en…", 0]].map(([t, w]) => (
            <Text key={t as string} style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 9, ...(w ? { width: w as number } : { flex: 1 }) }}>{t as string}</Text>
          ))}
        </View>
        {g.puzzles.map((p, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", minHeight: 40, paddingHorizontal: 6, backgroundColor: i % 2 ? "#FFFFFF" : c.soft, borderBottomWidth: 0.5, borderColor: c.muted }}>
            <Text style={{ width: 44, fontWeight: 800, fontSize: 13 }}>{i + 1}</Text>
            <Text style={{ width: 110, fontSize: 10 }}>{KIND_LABEL[p.kind] ?? p.title}</Text>
            <Text style={{ width: 110, fontWeight: 800, fontSize: 11, color: c.accent }}>{p.answer}</Text>
            <Text style={{ width: 40, fontFamily: "Fraunces", fontWeight: 900, fontSize: 18 }}>{p.reward}</Text>
            <View style={{ flex: 1, height: 22, borderBottomWidth: 0.8, borderStyle: "dashed", borderColor: c.muted }}>
              <Text style={{ fontSize: 8, color: c.muted }}>{i + 1 < n ? `sobre ${i + 2}` : `sobre ${n + 1} (reto final)`}</Text>
            </View>
          </View>
        ))}
        <View style={{ marginTop: 16, padding: 12, borderWidth: 1.5, borderColor: c.accent, borderRadius: 8 }}>
          <Text style={{ fontWeight: 800 }}>
            Palabra final: <Text style={{ color: c.accent, fontSize: 14 }}>{g.finalWord}</Text>
            <Text style={{ fontWeight: 400, color: c.muted }}>  (las letras se entregan en este orden: {g.rewardOrder.join(" ")})</Text>
          </Text>
          <Text style={{ marginTop: 10 }}>{cap(g.prize)} está en: ____________________________________________</Text>
          <Text style={{ marginTop: 10 }}>Fichas de pista para el equipo: {g.hintTokens}   ·   Hora de inicio: ________   ·   Hora de fin: ________</Text>
        </View>
        <Footer c={c} title={g.title} />
      </Page>

      {/* Historia */}
      <Page size="A4" style={s.page}>
        <MotifBand c={c} />
        <Text style={{ ...s.small, color: c.accent, fontWeight: 800 }}>PARA LEER EN VOZ ALTA</Text>
        <Text style={s.h1}>{g.title}</Text>
        <Text style={{ fontFamily: "Fraunces", fontSize: 16, lineHeight: 1.6, marginTop: 10 }}>{g.intro}</Text>
        <Text style={{ fontFamily: "Fraunces", fontSize: 16, lineHeight: 1.6, marginTop: 14 }}>
          Tenéis {input.duration} minutos. Cada reto superado os dará una letra. ¡Que empiece la aventura!
        </Text>
        <Footer c={c} title={g.title} />
      </Page>

      {/* Acertijos */}
      {g.puzzles.map((p, i) => (
        <Page key={i} size="A4" style={s.page}>
          <MotifBand c={c} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: 800, color: "#FFFFFF", backgroundColor: c.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, letterSpacing: 2 }}>SOBRE {i + 1}</Text>
            <Text style={s.small}>{g.themeName}</Text>
          </View>
          <Text style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 13, marginTop: 10, color: c.muted }}>{p.chapter}</Text>
          <Text style={{ ...s.h1, marginTop: 6 }}>{p.title}</Text>
          <Text style={{ fontSize: 13 }}>{p.instructions}</Text>
          <PrintableView c={c} p={p.printable} />
          <View style={{ flexGrow: 1 }} />
          <View wrap={false} style={{ borderWidth: 1.5, borderColor: c.ink, borderRadius: 10, padding: 12, marginTop: 14, marginBottom: 24 }}>
            <Text style={{ fontWeight: 800, fontSize: 11, color: c.accent, letterSpacing: 1 }}>VUESTRA RESPUESTA</Text>
            <View style={{ height: 34, borderBottomWidth: 1, borderColor: c.muted }} />
            {["maze", "jigsaw", "symbols"].includes(p.printable.type) ? null : (
              <>
                <Text style={{ fontSize: 9, color: c.muted, marginTop: 8 }}>Espacio para pensar:</Text>
                {[0, 1].map((k) => (
                  <View key={k} style={{ height: 26, borderBottomWidth: 0.6, borderStyle: "dashed", borderColor: c.muted }} />
                ))}
              </>
            )}
          </View>
          <Footer c={c} title={g.title} />
        </Page>
      ))}

      {/* Reto final */}
      <Page size="A4" style={s.page}>
        <MotifBand c={c} />
        <Text style={{ fontWeight: 800, color: c.accent, letterSpacing: 2 }}>SOBRE {n + 1} · RETO FINAL</Text>
        <Text style={{ ...s.h1, marginTop: 8 }}>La palabra que lo abre todo</Text>
        <Text style={{ fontSize: 13 }}>Habéis reunido {n} letras. Colocadlas en el orden correcto para formar la palabra final y decídsela a {g.guardian}.</Text>
        <Text style={{ fontSize: 13, marginTop: 8 }}>Pista: es una palabra de {n} letras que tiene que ver con esta aventura.</Text>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 40 }}>
          {Array.from({ length: n }).map((_, i) => (
            <View key={i} style={{ width: 48, height: 58, borderWidth: 2, borderColor: c.accent, backgroundColor: c.soft, borderRadius: 8, marginHorizontal: 4 }} />
          ))}
        </View>
        <View style={{ marginTop: 40, height: 220, position: "relative", alignItems: "center", justifyContent: "center" }}>
          <Scatter c={c} w={515} h={220} color={c.accent2} count={14} seed={11} rMin={8} rMax={18} filled={false} avoid={[[120, 85, 275, 50]]} />
          <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 22, color: c.accent, textAlign: "center" }}>¡Ya casi lo tenéis!</Text>
        </View>
        <Footer c={c} title={g.title} />
      </Page>

      {/* Tarjetas de recompensa */}
      <Page size="A4" style={s.page}>
        <MotifBand c={c} />
        <Text style={s.h1}>Tarjetas de recompensa</Text>
        <Text style={{ ...s.small, marginBottom: 10 }}>Recórtalas. Entrega cada una cuando el equipo resuelva su acertijo. Escribe en ella dónde está el siguiente sobre.</Text>
        <Cards c={c}
          items={g.puzzles.map((p, i) => (
            <View key={i} style={{ flex: 1, justifyContent: "space-between" }}>
              <Text style={s.small}>Recompensa del acertijo {i + 1}</Text>
              <Text style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: 48, textAlign: "center", color: c.accent }}>{p.reward}</Text>
              <Text style={{ fontSize: 9 }}>{i + 1 < n ? `Sobre ${i + 2} en: ____________________` : `Sobre ${n + 1} en: ____________________`}</Text>
            </View>
          ))}
          height={170}
        />
        <Footer c={c} title={g.title} />
      </Page>

      {/* Tarjetas de pistas */}
      <Page size="A4" style={s.page}>
        <MotifBand c={c} />
        <Text style={s.h1}>Tarjetas de pistas</Text>
        <Text style={{ ...s.small, marginBottom: 10 }}>Recórtalas y dóblalas. Cada una se cambia por una ficha de pista.</Text>
        <Cards c={c}
          cols={2}
          height={96}
          items={g.puzzles.flatMap((p, i) =>
            p.hints.map((h, j) => (
              <View key={`${i}-${j}`}>
                <Text style={{ ...s.small, fontWeight: 800, color: c.accent }}>Acertijo {i + 1} · pista {j + 1}</Text>
                <Text style={{ fontSize: 10.5, marginTop: 4 }}>{h}</Text>
              </View>
            )),
          )}
        />
        <Footer c={c} title={g.title} />
      </Page>

      {/* Soluciones */}
      <Page size="A4" style={s.page}>
        <MotifBand c={c} />
        <Text style={s.h1}>Soluciones</Text>
        <Text style={{ ...s.small, marginBottom: 8 }}>Solo para el organizador.</Text>
        {g.puzzles.map((p, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 8, paddingBottom: 6, borderBottomWidth: 0.5, borderColor: c.soft }}>
            <Text style={{ fontWeight: 800 }}>
              {i + 1}. {p.title} → <Text style={{ color: c.accent }}>{p.answer}</Text> (letra de recompensa: {p.reward})
            </Text>
            <Text style={{ fontSize: 10, color: c.muted }}>{p.solution}</Text>
          </View>
        ))}
        <Text style={{ fontWeight: 800, marginTop: 6 }}>
          Reto final: {g.rewardOrder.join(" ")} → <Text style={{ color: c.accent }}>{g.finalWord}</Text>
        </Text>
        <Text style={{ marginTop: 14, fontFamily: "Fraunces", fontSize: 13 }}>Para cerrar la aventura, lee en voz alta: «{g.ending}»</Text>
        <Footer c={c} title={g.title} />
      </Page>

      {/* Diploma */}
      <Page size="A4" orientation="landscape" style={{ ...s.page, padding: 30, paddingTop: 30 }}>
        <View style={{ flex: 1, borderWidth: 4, borderColor: c.accent, borderRadius: 16, position: "relative" }}>
          <View style={{ position: "absolute", left: 8, top: 8, right: 8, bottom: 8, borderWidth: 1.2, borderColor: c.accent2, borderRadius: 10 }} />
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([rx, ry], k) => (
            <View key={k} style={{ position: "absolute", width: 40, height: 40, ...(rx ? { right: 18 } : { left: 18 }), ...(ry ? { bottom: 18 } : { top: 18 }) }}>
              <Svg width={40} height={40} viewBox="0 0 40 40">
                <MotifShape kind={c.motif} x={20} y={20} r={15} color={k % 2 ? c.accent2 : c.accent} />
              </Svg>
            </View>
          ))}
          <View style={{ flex: 1, padding: 40, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ letterSpacing: 4, fontWeight: 800, color: c.accent }}>DIPLOMA</Text>
            {g.title.split(": ").map((part, i) => (
              <Text key={i} style={{ fontFamily: "Fraunces", fontWeight: 900, fontSize: i === 0 ? 34 : 24, textAlign: "center", marginTop: i === 0 ? 10 : 4, lineHeight: 1.25 }}>
                {i === 0 ? part : cap(part)}
              </Text>
            ))}
            <Text style={{ fontSize: 15, marginTop: 28, textAlign: "center" }}>Se concede a</Text>
            <View style={{ width: 380, borderBottomWidth: 1.5, borderColor: c.ink, height: 40 }} />
            <Text style={{ fontSize: 15, marginTop: 20, textAlign: "center" }}>por resolver todos los enigmas con ingenio y trabajo en equipo.</Text>
            <Text style={{ fontFamily: "Caveat", fontSize: 26, marginTop: 24, color: c.accent }}>Firmado: {g.guardian}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
