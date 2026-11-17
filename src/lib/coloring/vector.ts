/**
 * Convierte una máscara de líneas (0 = tinta) en trazos vectoriales lisos de grosor uniforme,
 * como si estuvieran dibujados con rotulador:
 *   1. adelgazamiento (Zhang-Suen) hasta el esqueleto de 1 px de cada línea,
 *   2. recorrido del esqueleto en caminos entre extremos y cruces (y lazos cerrados),
 *   3. se quitan las "espinas" cortas y los caminos diminutos,
 *   4. suavizado de las coordenadas y simplificación,
 *   5. salida SVG con curvas (Catmull-Rom → Bézier) y puntas redondeadas.
 */

/** Esqueleto de 1 px (1 = línea) con el algoritmo de Zhang-Suen. */
export function skeletonize(ink: Uint8Array, w: number, h: number): Uint8Array {
  const img = new Uint8Array(ink);
  for (let x = 0; x < w; x++) { img[x] = 0; img[(h - 1) * w + x] = 0; }
  for (let y = 0; y < h; y++) { img[y * w] = 0; img[y * w + w - 1] = 0; }
  const del: number[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      del.length = 0;
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const p = y * w + x;
          if (!img[p]) continue;
          const p2 = img[p - w], p3 = img[p - w + 1], p4 = img[p + 1], p5 = img[p + w + 1];
          const p6 = img[p + w], p7 = img[p + w - 1], p8 = img[p - 1], p9 = img[p - w - 1];
          const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (b < 2 || b > 6) continue;
          const a = (+(!p2 && p3)) + (+(!p3 && p4)) + (+(!p4 && p5)) + (+(!p5 && p6)) + (+(!p6 && p7)) + (+(!p7 && p8)) + (+(!p8 && p9)) + (+(!p9 && p2));
          if (a !== 1) continue;
          if (step === 0 ? p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0 : p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0) del.push(p);
        }
      if (del.length) changed = true;
      for (const p of del) img[p] = 0;
    }
  }
  return img;
}


/**
 * Vecinos de un píxel del esqueleto como grafo: un vecino en diagonal no cuenta si ya se llega a él
 * por un vecino recto (las "escaleras" no son cruces).
 */
function graphNeighbours(sk: Uint8Array, w: number) {
  const D: [number, number, number][] = [[-w - 1, -1, -w], [-w + 1, 1, -w], [w - 1, -1, w], [w + 1, 1, w]];
  const O = [-w, -1, 1, w];
  return (p: number) => {
    const r: number[] = [];
    for (const o of O) if (sk[p + o]) r.push(p + o);
    for (const [d, a, b] of D) if (sk[p + d] && !sk[p + a] && !sk[p + b]) r.push(p + d);
    return r;
  };
}

/** Rellena huecos blancos diminutos dentro de la tinta (evitan lazos y nudos en el esqueleto). */
export function fillSmallHoles(ink: Uint8Array, w: number, h: number, maxArea: number) {
  const n = w * h, seen = new Uint8Array(n), stack = new Int32Array(n), comp: number[] = [];
  for (let st = 0; st < n; st++) {
    if (ink[st] || seen[st]) continue;
    let sp = 0, border = false;
    comp.length = 0;
    stack[sp++] = st; seen[st] = 1;
    while (sp) {
      const p = stack[--sp];
      comp.push(p);
      if (comp.length > maxArea) border = true; // grande: no es un hueco
      const x = p % w;
      if (x === 0 || x === w - 1 || p < w || p >= n - w) { border = true; continue; }
      for (const q of [p - 1, p + 1, p - w, p + w]) if (!ink[q] && !seen[q]) { seen[q] = 1; stack[sp++] = q; }
    }
    if (!border) for (const p of comp) ink[p] = 1;
  }
}

/**
 * Quita del esqueleto las ramas cortas que salen de un cruce y terminan en punta (pelos, ruido):
 * así el trazo principal sigue de una pieza y se suaviza sin nudos.
 */
export function pruneSpurs(sk: Uint8Array, w: number, h: number, L: number, rounds = 3) {
  for (let r = 0; r < rounds; r++) {
    const nbr = graphNeighbours(sk, w);
    const deg = (p: number) => nbr(p).length;
    let removed = 0;
    for (let p = w; p < w * (h - 1); p++) {
      if (!sk[p] || deg(p) !== 1) continue;
      const chain = [p];
      let prev = -1, cur = p, junction = false;
      while (chain.length <= L) {
        let nx = -1;
        for (const q of nbr(cur)) if (q !== prev && !chain.includes(q)) { nx = q; break; }
        if (nx < 0) break;
        if (deg(nx) >= 3) { junction = true; break; }
        chain.push(nx); prev = cur; cur = nx;
      }
      if (junction && chain.length < L) { for (const q of chain) sk[q] = 0; removed++; }
    }
    if (!removed) break;
  }
}

/** Recorre el esqueleto y devuelve caminos (listas de índices de píxel). */
export function tracePaths(sk: Uint8Array, w: number, h: number): number[][] {
  const n = w * h, nbr = graphNeighbours(sk, w);
  const deg = new Uint8Array(n);
  for (let p = 0; p < n; p++) if (sk[p]) deg[p] = nbr(p).length;
  const isNode = (p: number) => deg[p] !== 2;
  const seen = new Set<number>(); // aristas recorridas (pares de píxeles)
  const key = (a: number, b: number) => (a < b ? a * n + b : b * n + a);
  const paths: number[][] = [];
  const walk = (start: number, next: number) => {
    const path = [start];
    let prev = start, cur = next;
    seen.add(key(prev, cur));
    for (;;) {
      path.push(cur);
      if (isNode(cur) || cur === start) break;
      let nx = -1;
      for (const q of nbr(cur)) if (q !== prev && !seen.has(key(cur, q))) { nx = q; break; }
      if (nx < 0) break;
      seen.add(key(cur, nx));
      prev = cur; cur = nx;
    }
    return path;
  };
  for (let p = 0; p < n; p++) {
    if (!sk[p] || !isNode(p)) continue;
    for (const q of nbr(p)) if (!seen.has(key(p, q))) paths.push(walk(p, q));
  }
  // lazos cerrados sin cruces
  for (let p = 0; p < n; p++) {
    if (!sk[p] || deg[p] !== 2) continue;
    for (const q of nbr(p)) if (!seen.has(key(p, q))) { paths.push(walk(p, q)); break; }
  }
  return paths;
}

type Pt = [number, number];

function smooth(pts: Pt[], r: number, closed: boolean): Pt[] {
  if (pts.length < 3 || r < 1) return pts;
  const m = pts.length, out: Pt[] = [];
  for (let i = 0; i < m; i++) {
    if (!closed && (i === 0 || i === m - 1)) { out.push(pts[i]); continue; }
    let sx = 0, sy = 0, sw = 0;
    for (let k = -r; k <= r; k++) {
      let j = i + k;
      if (closed) j = (j + m) % m; else if (j < 0 || j >= m) continue;
      const wk = r + 1 - Math.abs(k);
      sx += pts[j][0] * wk; sy += pts[j][1] * wk; sw += wk;
    }
    out.push([sx / sw, sy / sw]);
  }
  return out;
}

function rdp(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len; if (d > md) { md = d; mi = i; } }
    if (md > eps && mi > 0) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const f = (v: number) => Math.round(v * 10) / 10;

/** Curva suave que pasa por los puntos (Catmull-Rom convertido a Bézier cúbicas). */
function pathD(pts: Pt[], s: number): string {
  const P = pts.map(([x, y]) => [x * s, y * s] as Pt);
  if (P.length === 1) return `M${f(P[0][0])} ${f(P[0][1])}h0.1`;
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/**
 * Trazos SVG (atributo d) para una máscara de líneas (0 = tinta) a resolución de trabajo w×h,
 * escalados a s. minLen: caminos más cortos (en px de trabajo) se descartan.
 */
export function maskToPaths(mask: Uint8Array, w: number, h: number, s: number, minLen: number): string[] {
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < ink.length; i++) ink[i] = mask[i] === 0 ? 1 : 0;
  fillSmallHoles(ink, w, h, 10);
  const sk = skeletonize(ink, w, h);
  pruneSpurs(sk, w, h, Math.max(10, minLen * 0.3));
  const raw = tracePaths(sk, w, h);
  const nbr = graphNeighbours(sk, w);
  const deg = (p: number) => nbr(p).length;

  // Cruces: grupos de píxeles con 3 o más vecinos (un cruce suele ocupar 2-3 píxeles juntos).
  const cl = new Int32Array(w * h).fill(-1);
  let ncl = 0;
  for (let p = 0; p < w * h; p++) {
    if (!sk[p] || cl[p] >= 0 || deg(p) < 3) continue;
    const st = [p]; cl[p] = ncl;
    while (st.length) { const q = st.pop()!; for (const r of nbr(q)) if (cl[r] < 0 && deg(r) >= 3) { cl[r] = ncl; st.push(r); } }
    ncl++;
  }
  type Path = { px: number[]; a: number; b: number; alive: boolean };
  const paths: Path[] = [];
  for (const px of raw) {
    const a = cl[px[0]], b = cl[px[px.length - 1]];
    if (a >= 0 && a === b && px.length <= 4) continue; // tramo interno de un cruce
    paths.push({ px, a, b, alive: true });
  }
  // Une, en cada cruce, los dos tramos que siguen la misma dirección: así la línea principal
  // pasa de una pieza por el cruce y el suavizado no deja nudos.
  const dir = (px: number[]) => { const k = Math.min(8, px.length - 1); return [px[k] % w - px[0] % w, Math.floor(px[k] / w) - Math.floor(px[0] / w)]; };
  for (let c = 0; c < ncl; c++) {
    for (;;) {
      const ends: { i: number; atStart: boolean }[] = [];
      paths.forEach((pp, i) => { if (!pp.alive) return; if (pp.a === c) ends.push({ i, atStart: true }); if (pp.b === c) ends.push({ i, atStart: false }); });
      let best = 0, bi = -1, bj = -1;
      for (let x = 0; x < ends.length; x++)
        for (let y = x + 1; y < ends.length; y++) {
          if (ends[x].i === ends[y].i) continue;
          const px1 = paths[ends[x].i].px, px2 = paths[ends[y].i].px;
          const d1 = dir(ends[x].atStart ? px1 : [...px1].reverse()), d2 = dir(ends[y].atStart ? px2 : [...px2].reverse());
          const cos = (d1[0] * d2[0] + d1[1] * d2[1]) / (Math.hypot(d1[0], d1[1]) * Math.hypot(d2[0], d2[1]) || 1);
          if (cos < best) { best = cos; bi = x; bj = y; }
        }
      if (bi < 0 || best > -0.5) break;
      const E1 = ends[bi], E2 = ends[bj], P1 = paths[E1.i], P2 = paths[E2.i];
      const s1 = E1.atStart ? [...P1.px].reverse() : P1.px; // termina en el cruce
      const s2 = E2.atStart ? P2.px : [...P2.px].reverse(); // empieza en el cruce
      const na = E1.atStart ? P1.b : P1.a, nbb = E2.atStart ? P2.b : P2.a;
      P1.alive = P2.alive = false;
      paths.push({ px: [...s1, ...s2.slice(1)], a: na, b: nbb, alive: true });
    }
  }

  const out: string[] = [];
  for (const pp of paths) {
    if (!pp.alive) continue;
    const px = pp.px;
    const pts: Pt[] = px.map((p) => [p % w, Math.floor(p / w)]);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const closed = px.length > 3 && px[0] === px[px.length - 1];
    // trazo suelto y corto (los lazos cerrados, como un ojo, se conservan si no son diminutos)
    if (pp.a < 0 && pp.b < 0 && len < (closed ? Math.min(minLen, 12) : minLen)) continue;
    const sm = rdp(smooth(smooth(pts, 4, closed), 4, closed), 0.3);
    out.push(pathD(sm, s));
  }
  return out;
}

export function svgDoc(W: number, H: number, layers: { paths: string[]; width: number }[]) {
  const g = layers
    .filter((l) => l.paths.length)
    .map((l) => `<g fill="none" stroke="#000" stroke-width="${f(l.width)}" stroke-linecap="round" stroke-linejoin="round"><path d="${l.paths.join("")}"/></g>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>${g}</svg>`;
}
