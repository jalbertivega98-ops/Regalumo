import { z } from "zod";
import { normalizeAnswer } from "../security/text";
import { RIDDLES } from "./riddles";
import { FINAL_WORDS, THEMES, type ThemeId } from "./themes";

/**
 * Generador determinista de escape rooms. Mismos datos de entrada → mismo juego.
 * Cada tipo de acertijo se construye junto con su solución, y las pruebas
 * automáticas comprueban que todas son resolubles (descifrar, recorrer el laberinto, etc.).
 */
import { AGES, DIFFICULTIES, DURATIONS, puzzleCount, type AgeId, type Difficulty } from "./options";
export { AGES, DIFFICULTIES, DURATIONS, puzzleCount, type AgeId, type Difficulty };

export const escapeSchema = z.object({
  age: z.enum(["peques", "ninos", "jovenes", "adultos"]).default("ninos"),
  theme: z.enum(["piratas", "espacio", "detectives", "magia", "selva", "museo", "navidad"]).default("piratas"),
  players: z.coerce.number().int().min(1).max(20).default(4),
  difficulty: z.enum(["facil", "media", "dificil"]).default("media"),
  duration: z.coerce.number().refine((v) => (DURATIONS as readonly number[]).includes(v)).default(60),
  hero: z.string().max(40).default(""),
  team: z.string().max(40).default(""),
});
export type EscapeInput = z.infer<typeof escapeSchema>;

export type Printable =
  | { type: "text"; lines: string[]; big?: string }
  | { type: "cipher"; mode: "caesar" | "numbers" | "mirror"; encoded: string; shift?: number; table?: boolean }
  | { type: "wordsearch"; grid: string[][]; words: string[] }
  | { type: "maze"; w: number; h: number; walls: number[]; letters: Record<number, string>; start: number; end: number }
  | { type: "shapes"; items: { shape: "star" | "circle" | "triangle" | "heart"; x: number; y: number; r: number; rot: number }[]; target: "star" | "circle" | "triangle" | "heart" }
  | { type: "lock"; clues: string[]; digits: number }
  | { type: "sequence"; terms: (number | "?")[] }
  | { type: "logic"; statements: string[]; question: string }
  /** Puzle recortable: la palabra se imprime partida en piezas desordenadas (algunas giradas). */
  | { type: "jigsaw"; word: string; rows: number; cols: number; pieces: { r: number; c: number; flip: boolean }[] }
  /** Cifrado de símbolos: sym = 0..17 (forma = sym % 6, estilo = sym / 6: contorno, relleno, con punto). */
  | { type: "symbols"; key: { letter: string; sym: number }[]; message: number[] }
  /** Rejilla secreta: tabla de letras + plantilla con ventanas (holes) que se recorta; rot = cuartos de vuelta con que se imprime la plantilla. */
  | { type: "grille"; size: number; grid: string[]; holes: number[]; rot: number }
  /** Disco descifrador recortable: el disco pequeño se gira hasta que su A quede bajo «key». */
  | { type: "wheel"; encoded: string; key: string }
  /** Búsqueda por casa: adivinanzas que llevan a sitios reales; el organizador esconde allí las tarjetas (parts). */
  | { type: "hunt"; clues: string[]; spots: string[]; parts: string[] };

export interface Puzzle {
  kind: string;
  title: string;
  chapter: string;
  instructions: string;
  printable: Printable;
  answer: string;
  accept: string[];
  hints: [string, string];
  solution: string;
  /** Letra de recompensa que se entrega al resolverlo (forma la palabra final). */
  reward: string;
}

export interface EscapeGame {
  input: EscapeInput;
  themeName: string;
  title: string;
  intro: string;
  guardian: string;
  puzzles: Puzzle[];
  finalWord: string;
  rewardOrder: string[];
  ending: string;
  prize: string;
  hintTokens: number;
  minutesPerPuzzle: number;
}

/* ---------- utilidades deterministas ---------- */

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (a: number, b: number) => a + Math.floor(next() * (b - a + 1)),
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    shuffle: <T,>(arr: readonly T[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
type Rng = ReturnType<typeof makeRng>;

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function caesar(text: string, shift: number) {
  return text.replace(/[A-Z]/g, (c) => ABC[(ABC.indexOf(c) + shift + 26) % 26]);
}

interface Ctx {
  rng: Rng;
  input: EscapeInput;
  theme: (typeof THEMES)[ThemeId];
  usedWords: Set<string>;
  usedRiddles: Set<number>;
  /** Palabra final: ningún acertijo puede usarla ni algo que la contenga (la destriparía). */
  finalWord: string;
  hard: number; // 0 fácil, 1 media, 2 difícil
  ageLevel: number; // 0 peques ... 3 adultos
}

/** ¿Destriparía la palabra final? (la misma palabra, o una que la contiene o está contenida en ella). */
export function spoils(word: string, finalWord: string) {
  const w = normalizeAnswer(word).toUpperCase(), f = finalWord.toUpperCase();
  return !!f && (w.includes(f) || (w.length >= 3 && f.includes(w)));
}

function themeWords(ctx: Ctx) {
  return ctx.theme.words.filter((w) => !spoils(w, ctx.finalWord));
}

function takeWord(ctx: Ctx, maxLen = 9, minLen = 3) {
  const all = themeWords(ctx);
  // Las respuestas de las adivinanzas de la temática se guardan para las adivinanzas.
  const riddleWords = new Set(RIDDLES.filter((r) => r.themes?.includes(ctx.input.theme)).flatMap((r) => r.accept.map((a) => normalizeAnswer(a).toUpperCase())));
  const fresh = all.filter((w) => !ctx.usedWords.has(w) && w.length <= maxLen && w.length >= minLen);
  const pool = fresh.filter((w) => !riddleWords.has(w)).length ? fresh.filter((w) => !riddleWords.has(w)) : fresh;
  const w = ctx.rng.pick(pool.length ? pool : all.filter((x) => x.length <= maxLen && x.length >= Math.min(minLen, 4)));
  ctx.usedWords.add(w);
  return w;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- tipos de acertijo ---------- */

type Gen = (ctx: Ctx) => Omit<Puzzle, "chapter" | "reward">;

const riddle: Gen = (ctx) => {
  const age = ctx.input.age;
  const fits = (r: (typeof RIDDLES)[number], i: number) =>
    r.ages.includes(age) && !ctx.usedRiddles.has(i) && !r.accept.some((a) => spoils(a, ctx.finalWord) || ctx.usedWords.has(a.toUpperCase()));
  const all = RIDDLES.map((r, i) => ({ r, i }));
  // Primero las de la temática; si ya se han usado todas, las genéricas.
  const themed = all.filter((x) => x.r.themes?.includes(ctx.input.theme) && fits(x.r, x.i));
  const generic = all.filter((x) => !x.r.themes && fits(x.r, x.i));
  const { r, i } = ctx.rng.pick(themed.length ? themed : generic.length ? generic : all.filter((x) => !x.r.themes));
  ctx.usedRiddles.add(i);
  for (const a of r.accept) ctx.usedWords.add(a.toUpperCase());
  return {
    kind: "riddle",
    title: "La adivinanza del guardián",
    instructions: `${cap(ctx.theme.guardian)} solo os dejará pasar si adivináis esto:`,
    printable: { type: "text", lines: [r.text], big: "¿Qué es?" },
    answer: r.answer.toUpperCase(),
    accept: r.accept.map(normalizeAnswer),
    hints: [r.hint, `La respuesta tiene ${normalizeAnswer(r.answer).length} letras y empieza por "${r.answer[0].toUpperCase()}".`],
    solution: `La respuesta es «${r.answer}».`,
  };
};

const anagram: Gen = (ctx) => {
  const w = takeWord(ctx, ctx.ageLevel === 0 ? 5 : 9, 4);
  let s = w;
  for (let i = 0; i < 10 && s === w; i++) s = ctx.rng.shuffle(w.split("")).join("");
  return {
    kind: "anagram",
    title: "Letras revueltas",
    instructions: "Alguien ha desordenado las letras de una palabra importante de esta aventura. Colocadlas en el orden correcto.",
    printable: { type: "text", lines: [s.split("").join(" ")], big: "¿Qué palabra es?" },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: [`Es una palabra relacionada con la temática: ${ctx.theme.name.toLowerCase()}.`, `Empieza por "${w[0]}" y termina por "${w[w.length - 1]}".`],
    solution: `${s} → ${w}`,
  };
};

const caesarPuzzle: Gen = (ctx) => {
  const w = takeWord(ctx, 9, 4);
  const shift = ctx.hard === 0 ? 1 : ctx.hard === 1 ? 2 : 3;
  const enc = caesar(w, shift);
  return {
    kind: "caesar",
    title: "El mensaje cifrado",
    instructions: `Cada letra de este mensaje se ha cambiado por la que está ${shift} ${shift === 1 ? "posición" : "posiciones"} más adelante en el alfabeto. Retroceded ${shift} para descifrarlo. Usad la tira del abecedario.`,
    printable: { type: "cipher", mode: "caesar", encoded: enc, shift, table: true },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: [`Fijaos en la primera letra: "${enc[0]}". Contad ${shift} hacia atrás en el abecedario.`, `La primera letra es "${w[0]}" y la segunda "${w[1]}".`],
    solution: `${enc} retrocediendo ${shift} letras → ${w}`,
  };
};

const numbers: Gen = (ctx) => {
  const w = takeWord(ctx, 8, 4);
  const enc = w.split("").map((c) => ABC.indexOf(c) + 1).join(" - ");
  return {
    kind: "numbers",
    title: "Números que hablan",
    instructions: "Cada número es una letra: A = 1, B = 2, C = 3... Traducid los números para descubrir la palabra secreta.",
    printable: { type: "cipher", mode: "numbers", encoded: enc, table: ctx.hard < 2 },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: [`El primer número, ${ABC.indexOf(w[0]) + 1}, corresponde a la letra "${w[0]}".`, `Las dos primeras letras son "${w.slice(0, 2)}".`],
    solution: `${enc} → ${w}`,
  };
};

const mirror: Gen = (ctx) => {
  const w = takeWord(ctx, 9, 4);
  const enc = w.split("").reverse().join("");
  return {
    kind: "mirror",
    title: "El espejo travieso",
    instructions: "Esta palabra se ha escrito al revés, como si la vierais en un espejo. Leedla de derecha a izquierda.",
    printable: { type: "cipher", mode: "mirror", encoded: enc },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: ["Empezad a leer por la última letra.", `La palabra empieza por "${w[0]}".`],
    solution: `${enc} leído al revés → ${w}`,
  };
};

const SEQS = [
  (r: Rng) => { const a = r.int(1, 9), d = r.int(2, 5); return [0, 1, 2, 3, 4, 5].map((i) => a + d * i); },
  (r: Rng) => { const a = r.int(1, 3); return [0, 1, 2, 3, 4, 5].map((i) => a * 2 ** i); },
  () => [1, 1, 2, 3, 5, 8, 13].slice(0, 6),
  () => [1, 4, 9, 16, 25, 36],
  (r: Rng) => { const a = r.int(2, 6); return [0, 1, 2, 3, 4, 5].map((i) => a + (i * (i + 1)) / 2); },
];
const SEQ_EXPL = [
  "Cada número suma siempre la misma cantidad.",
  "Cada número es el doble del anterior.",
  "Cada número es la suma de los dos anteriores.",
  "Son los cuadrados: 1×1, 2×2, 3×3...",
  "La diferencia entre números crece de uno en uno.",
];

const sequence: Gen = (ctx) => {
  const idx = ctx.hard === 0 || ctx.ageLevel <= 1 ? ctx.rng.int(0, 1) : ctx.rng.int(0, SEQS.length - 1);
  const s = SEQS[idx](ctx.rng);
  const shown: (number | "?")[] = [...s.slice(0, 5), "?"];
  const ans = String(s[5]);
  return {
    kind: "sequence",
    title: "La serie misteriosa",
    instructions: "Estos números siguen un patrón. ¿Qué número va en el hueco? Ese número es la clave.",
    printable: { type: "sequence", terms: shown },
    answer: ans,
    accept: [ans],
    hints: [SEQ_EXPL[idx], `Comparad ${s[3]} y ${s[4]}: ¿qué ha pasado entre ellos?`],
    solution: `${s.slice(0, 5).join(", ")}, ${ans}. ${SEQ_EXPL[idx]}`,
  };
};

const lock: Gen = (ctx) => {
  const digits = ctx.hard === 2 ? 4 : 3;
  const objs = ctx.theme.objects;
  const clues: string[] = [];
  let code = "";
  for (let i = 0; i < digits; i++) {
    const d = ctx.rng.int(1, 9);
    code += d;
    const o = ctx.rng.pick(objs);
    if (ctx.ageLevel === 0) {
      const a = ctx.rng.int(0, d);
      clues.push(`Dígito ${i + 1}: tienes ${a} ${o} y te dan ${d - a} más. ¿Cuántas tienes?`);
    } else if (ctx.ageLevel === 1 || ctx.hard === 0) {
      const a = ctx.rng.int(d + 1, d + 9);
      clues.push(`Dígito ${i + 1}: había ${a} ${o} y se perdieron ${a - d}. ¿Cuántas quedan?`);
    } else {
      const m = ctx.rng.int(2, 4);
      const b = d * m;
      const c = ctx.rng.int(1, 6);
      clues.push(`Dígito ${i + 1}: (${b + c} − ${c}) ÷ ${m}`);
    }
  }
  return {
    kind: "lock",
    title: "El candado de números",
    instructions: `Resolved cada operación. Cada resultado es un dígito del código de ${digits} cifras, en orden.`,
    printable: { type: "lock", clues, digits },
    answer: code,
    accept: [code],
    hints: ["Resolved las operaciones de una en una y apuntad cada resultado.", `El primer dígito es ${code[0]}.`],
    solution: `El código es ${code}.`,
  };
};

/** Busca una palabra en la sopa en las 8 direcciones. */
export function gridContains(grid: string[][], word: string) {
  const h = grid.length, w = grid[0].length;
  const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (const [dy, dx] of dirs) {
        let ok = true;
        for (let i = 0; i < word.length && ok; i++) {
          const yy = y + dy * i, xx = x + dx * i;
          if (yy < 0 || xx < 0 || yy >= h || xx >= w || grid[yy][xx] !== word[i]) ok = false;
        }
        if (ok) return true;
      }
  return false;
}

const wordsearch: Gen = (ctx) => {
  const size = ctx.ageLevel <= 1 ? 9 : 11;
  const dirs: [number, number][] = ctx.hard === 0 || ctx.ageLevel <= 1 ? [[0, 1], [1, 0]] : [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1]];
  for (let attempt = 0; attempt < 40; attempt++) {
    const fresh = themeWords(ctx).filter((w) => w.length <= size && !ctx.usedWords.has(w));
    const list = ctx.rng.shuffle(fresh.length >= 5 ? fresh : themeWords(ctx).filter((w) => w.length <= size)).slice(0, ctx.ageLevel <= 1 ? 5 : 7);
    const missing = list[0];
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
    let ok = true;
    for (const w of list) {
      if (w === missing) continue;
      let placed = false;
      for (let t = 0; t < 200 && !placed; t++) {
        const [dy, dx] = ctx.rng.pick(dirs);
        const y = ctx.rng.int(0, size - 1), x = ctx.rng.int(0, size - 1);
        const ey = y + dy * (w.length - 1), ex = x + dx * (w.length - 1);
        if (ey < 0 || ex < 0 || ey >= size || ex >= size) continue;
        let fits = true;
        for (let i = 0; i < w.length; i++) {
          const c = grid[y + dy * i][x + dx * i];
          if (c && c !== w[i]) fits = false;
        }
        if (!fits) continue;
        for (let i = 0; i < w.length; i++) grid[y + dy * i][x + dx * i] = w[i];
        placed = true;
      }
      if (!placed) ok = false;
    }
    if (!ok) continue;
    // Relleno sin letras de la palabra ausente para que no aparezca por casualidad.
    const filler = ABC.split("").filter((c) => !missing.includes(c));
    for (const row of grid) for (let i = 0; i < size; i++) if (!row[i]) row[i] = ctx.rng.pick(filler);
    if (gridContains(grid, missing)) continue;
    // Todas las palabras de la lista quedan reservadas: si salieran después en otro acertijo, ya estarían a la vista.
    for (const w of list) ctx.usedWords.add(w);
    return {
      kind: "wordsearch",
      title: "La sopa de letras incompleta",
      instructions: "Buscad todas las palabras de la lista en la sopa de letras. Una de ellas NO está escondida: esa es la contraseña.",
      printable: { type: "wordsearch", grid, words: [...list].sort() },
      answer: missing,
      accept: [normalizeAnswer(missing)],
      hints: ["Tachad cada palabra de la lista a medida que la encontréis.", `La palabra que falta empieza por "${missing[0]}".`],
      solution: `La palabra que no aparece en la sopa es ${missing}.`,
    };
  }
  return anagram(ctx);
};

/** Laberinto perfecto: walls[c] = bits (1 arriba, 2 derecha, 4 abajo, 8 izquierda). */
export function solveMaze(w: number, h: number, walls: number[], start: number, end: number): number[] {
  const prev = new Map<number, number>([[start, -1]]);
  const q = [start];
  while (q.length) {
    const c = q.shift()!;
    if (c === end) break;
    const x = c % w, y = Math.floor(c / w);
    const moves: [number, number][] = [[1, c - w], [2, c + 1], [4, c + w], [8, c - 1]];
    for (const [bit, n] of moves) {
      if (walls[c] & bit) continue;
      if (bit === 1 && y === 0) continue;
      if (bit === 4 && y === h - 1) continue;
      if (bit === 2 && x === w - 1) continue;
      if (bit === 8 && x === 0) continue;
      if (!prev.has(n)) { prev.set(n, c); q.push(n); }
    }
  }
  const path: number[] = [];
  for (let c = end; c !== -1 && prev.has(c); c = prev.get(c)!) path.unshift(c);
  return path;
}

const maze: Gen = (ctx) => {
  const size = [6, 8, 9, 10][ctx.ageLevel] + (ctx.hard === 2 ? 1 : 0);
  const w = size, h = size;
  const walls = Array(w * h).fill(15);
  const seen = new Uint8Array(w * h);
  const stack = [0];
  seen[0] = 1;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const x = c % w, y = Math.floor(c / w);
    const opts: [number, number, number][] = [];
    if (y > 0 && !seen[c - w]) opts.push([c - w, 1, 4]);
    if (x < w - 1 && !seen[c + 1]) opts.push([c + 1, 2, 8]);
    if (y < h - 1 && !seen[c + w]) opts.push([c + w, 4, 1]);
    if (x > 0 && !seen[c - 1]) opts.push([c - 1, 8, 2]);
    if (!opts.length) { stack.pop(); continue; }
    const [n, b1, b2] = ctx.rng.pick(opts);
    walls[c] &= ~b1;
    walls[n] &= ~b2;
    seen[n] = 1;
    stack.push(n);
  }
  const start = 0, end = w * h - 1;
  const path = solveMaze(w, h, walls, start, end);
  const word = takeWord(ctx, Math.min(7, Math.floor(path.length / 2)), 4);
  const letters: Record<number, string> = {};
  const inner = path.slice(1, -1);
  const step = inner.length / word.length;
  word.split("").forEach((ch, i) => (letters[inner[Math.floor(i * step + step / 2)]] = ch));
  const onPath = new Set(path);
  const decoys = ctx.rng.shuffle(Array.from({ length: w * h }, (_, i) => i).filter((i) => !onPath.has(i))).slice(0, word.length + 2);
  const decoyLetters = ABC.split("").filter((c) => !word.includes(c));
  for (const d of decoys) letters[d] = ctx.rng.pick(decoyLetters);
  return {
    kind: "maze",
    title: "El laberinto de letras",
    instructions: "Recorred el laberinto desde la ENTRADA hasta la SALIDA sin atravesar paredes. Apuntad, en orden, las letras que encontréis en el camino correcto: forman la contraseña.",
    printable: { type: "maze", w, h, walls, letters, start, end },
    answer: word,
    accept: [normalizeAnswer(word)],
    hints: ["Si os atascáis, probad a recorrer el laberinto desde la salida hacia la entrada.", `La palabra tiene ${word.length} letras y empieza por "${word[0]}".`],
    solution: `Por el camino correcto se recogen las letras ${word.split("").join("-")}: ${word}.`,
  };
};

const SHAPE_NAMES = { star: "estrellas", circle: "círculos", triangle: "triángulos", heart: "corazones" } as const;

const shapes: Gen = (ctx) => {
  const kinds = ["star", "circle", "triangle", "heart"] as const;
  const target = ctx.rng.pick(kinds);
  const count = ctx.rng.int(4, ctx.hard === 0 ? 7 : 9);
  const items: Extract<Printable, { type: "shapes" }>["items"] = [];
  const total = count + ctx.rng.int(6, 10);
  const shapesList = ctx.rng.shuffle([...Array(count).fill(target), ...Array.from({ length: total - count }, () => ctx.rng.pick(kinds.filter((k) => k !== target)))]);
  // Distribución en rejilla con desplazamiento para que no se solapen.
  const cols = 5;
  shapesList.forEach((shape, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    items.push({ shape, x: 10 + col * 20 + ctx.rng.int(-3, 3), y: 12 + row * 22 + ctx.rng.int(-3, 3), r: ctx.rng.int(5, 8), rot: ctx.rng.int(-20, 20) });
  });
  return {
    kind: "shapes",
    title: "Cuenta y encontrarás",
    instructions: `Contad cuántos ${SHAPE_NAMES[target]} hay en el dibujo. Ese número es la clave.`,
    printable: { type: "shapes", items, target },
    answer: String(count),
    accept: [String(count)],
    hints: ["Tachad cada figura con un lápiz a medida que la contéis.", `Hay más de ${count - 2} y menos de ${count + 2}.`],
    solution: `Hay ${count} ${SHAPE_NAMES[target]}.`,
  };
};

/** Acertijo de orden con solución única comprobada por fuerza bruta. */
const logic: Gen = (ctx) => {
  const people = [...ctx.theme.people];
  const perms: string[][] = [];
  const permute = (arr: string[], acc: string[] = []) => {
    if (!arr.length) perms.push(acc);
    arr.forEach((v, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...acc, v]));
  };
  permute(people);
  const sol = ctx.rng.shuffle(people);
  type Clue = { text: string; test: (p: string[]) => boolean };
  const pos = (p: string[], n: string) => p.indexOf(n);
  const candidates: Clue[] = [];
  for (const a of people)
    for (const b of people) {
      if (a === b) continue;
      if (pos(sol, a) + 1 === pos(sol, b)) candidates.push({ text: `${a} va justo delante de ${b}.`, test: (p) => pos(p, a) + 1 === pos(p, b) });
      if (pos(sol, a) < pos(sol, b)) candidates.push({ text: `${a} llega antes que ${b}.`, test: (p) => pos(p, a) < pos(p, b) });
      if (Math.abs(pos(sol, a) - pos(sol, b)) > 1 && a < b) candidates.push({ text: `${a} y ${b} no van juntos.`, test: (p) => Math.abs(pos(p, a) - pos(p, b)) > 1 });
    }
  for (const a of people) {
    const i = pos(sol, a);
    if (i !== 0) candidates.push({ text: `${a} no es quien llega en primer lugar.`, test: (p) => pos(p, a) !== 0 });
    if (i === 3) candidates.push({ text: `${a} llega en último lugar.`, test: (p) => pos(p, a) === 3 });
  }
  const clues: Clue[] = [];
  let remaining = perms;
  for (const c of ctx.rng.shuffle(candidates)) {
    const next = remaining.filter(c.test);
    if (next.length < remaining.length) {
      clues.push(c);
      remaining = next;
    }
    if (remaining.length === 1) break;
  }
  const first = sol[0];
  return {
    kind: "logic",
    title: "¿Quién llegó primero?",
    instructions: `${people.join(", ")} han hecho una carrera hasta ${ctx.theme.prize}. Con estas pistas, averiguad quién llegó en primer lugar.`,
    printable: { type: "logic", statements: clues.map((c) => c.text), question: "¿Quién llegó en primer lugar?" },
    answer: first.toUpperCase(),
    accept: [normalizeAnswer(first)],
    hints: ["Dibujad cuatro casillas en fila y probad a colocar los nombres.", `En segundo lugar llegó ${sol[1]}.`],
    solution: `Orden de llegada: ${sol.join(", ")}. Llegó primero ${first}.`,
  };
};

const jigsaw: Gen = (ctx) => {
  const w = takeWord(ctx, ctx.ageLevel === 0 ? 5 : 7, 4);
  const [rows, cols] = [[2, 3], [3, 3], [3, 4], [3, 4]][ctx.ageLevel];
  const cells = Array.from({ length: rows * cols }, (_, i) => ({ r: Math.floor(i / cols), c: i % cols }));
  let order = cells;
  for (let t = 0; t < 10 && order.some((x, i) => x === cells[i]); t++) order = ctx.rng.shuffle(cells);
  // Desde 12 años, algunas piezas salen giradas (más difícil de montar).
  const flips = ctx.ageLevel >= 2 && ctx.hard >= 1;
  const pieces = order.map((x) => ({ ...x, flip: flips && ctx.rng.next() < 0.35 }));
  return {
    kind: "jigsaw",
    title: "El mensaje roto",
    instructions: `Alguien ha roto el mensaje en ${rows * cols} trozos. Recortad las piezas por la línea de puntos y juntadlas: cuando el puzle esté montado, podréis leer la contraseña.`,
    printable: { type: "jigsaw", word: w, rows, cols, pieces },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: ["Empezad por las cuatro esquinas: son las piezas con dos lados de marco.", `La palabra tiene ${w.length} letras y empieza por "${w[0]}".`],
    solution: `Con el puzle montado se lee ${w}.`,
  };
};

const symbols: Gen = (ctx) => {
  const w = takeWord(ctx, ctx.ageLevel === 0 ? 5 : 8, 4);
  const letters = [...new Set(w.split(""))];
  const extra = ctx.rng.shuffle(ABC.split("").filter((c) => !letters.includes(c))).slice(0, ctx.ageLevel <= 1 ? 4 : 8);
  const syms = ctx.rng.shuffle(Array.from({ length: 18 }, (_, i) => i));
  const key = [...letters, ...extra].sort().map((letter, i) => ({ letter, sym: syms[i] }));
  const symOf = (c: string) => key.find((k) => k.letter === c)!.sym;
  return {
    kind: "symbols",
    title: "El código de símbolos",
    instructions: "Este mensaje está escrito con símbolos secretos. Buscad cada símbolo en la tabla del código y escribid su letra debajo.",
    printable: { type: "symbols", key, message: w.split("").map(symOf) },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: ["Fijaos bien: el mismo dibujo puede estar vacío, relleno o con un punto, y cada uno es una letra distinta.", `La palabra tiene ${w.length} letras y empieza por "${w[0]}".`],
    solution: `Traducido con la tabla, el mensaje dice ${w}.`,
  };
};

/** Posición de una casilla tras girar la plantilla «rot» cuartos de vuelta en el sentido del reloj. */
export function rotateCell(i: number, n: number, rot: number) {
  let r = Math.floor(i / n), c = i % n;
  for (let k = 0; k < ((rot % 4) + 4) % 4; k++) [r, c] = [c, n - 1 - r];
  return r * n + c;
}

const grille: Gen = (ctx) => {
  const w = takeWord(ctx, ctx.ageLevel <= 1 ? 6 : 8, 4);
  const size = ctx.ageLevel <= 1 ? 5 : 6;
  const all = Array.from({ length: size * size }, (_, i) => i);
  const holes = ctx.rng.shuffle(all).slice(0, w.length).sort((a, b) => a - b);
  const grid = all.map((i) => (holes.includes(i) ? w[holes.indexOf(i)] : ctx.rng.pick(ABC.split(""))));
  // Desde 12 años, la plantilla se imprime girada: hay que girarla hasta que la estrella coincida.
  const rot = ctx.ageLevel >= 2 ? ctx.rng.int(1, 3) : 0;
  return {
    kind: "grille",
    title: "La rejilla secreta",
    instructions: `Recortad la plantilla por la línea de puntos y recortad también sus ventanas grises. Ponedla encima de la tabla de letras${rot ? ", giradla hasta que su estrella quede en la misma esquina que la de la tabla," : " con la estrella en la misma esquina que la de la tabla"} y leed las letras que asoman, de izquierda a derecha y de arriba abajo.`,
    printable: { type: "grille", size, grid, holes, rot },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: ["Para recortar una ventana, doblad un poco el papel por el centro del cuadro gris y cortad desde ahí.", `La palabra tiene ${w.length} letras y empieza por "${w[0]}".`],
    solution: `Con la plantilla bien colocada, por las ventanas se lee ${w}.`,
  };
};

const wheel: Gen = (ctx) => {
  const w = takeWord(ctx, 8, 4);
  const shift = ctx.rng.int(3, 12);
  const key = ABC[shift];
  return {
    kind: "wheel",
    title: "El disco descifrador",
    instructions: `Recortad los dos discos y poned el pequeño encima del grande (podéis unirlos por el centro con un clip o un encuadernador). Girad el pequeño hasta que su A quede justo debajo de la ${key} del grande. Después buscad cada letra del mensaje en el disco grande y escribid la letra del pequeño que queda debajo.`,
    printable: { type: "wheel", encoded: caesar(w, shift), key },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: [`Con el disco bien colocado, la ${key} del grande tiene debajo la A del pequeño.`, `La palabra tiene ${w.length} letras y empieza por "${w[0]}".`],
    solution: `Con la A bajo la ${key}, el mensaje ${caesar(w, shift)} se lee ${w}.`,
  };
};

/** Escondites seguros y fáciles de encontrar en cualquier casa. */
const SPOTS: { place: string; riddle: string }[] = [
  { place: "dentro de la nevera", riddle: "Por dentro siempre es invierno y guarda la leche y los yogures." },
  { place: "debajo de una almohada", riddle: "Es blandita, vive en la cama y cada noche os guarda los sueños." },
  { place: "dentro de un zapato de la entrada", riddle: "Tiene lengua pero no habla, tiene cordones y os lleva a todas partes." },
  { place: "bajo un cojín del sofá", riddle: "Tiene brazos pero no manos, y la familia se sienta en él a ver la tele." },
  { place: "entre los libros de una estantería", riddle: "Están llenos de historias, pero hay que abrirlos para escucharlas." },
  { place: "debajo de una alfombra", riddle: "Todo el mundo la pisa y nunca se queja." },
  { place: "junto a los cepillos de dientes", riddle: "Tienen muchos pelos y, mañana y noche, os dejan la sonrisa limpia." },
  { place: "en la ducha o la bañera", riddle: "Allí llueve dentro de casa, pero solo cuando alguien abre el grifo." },
  { place: "junto a una planta", riddle: "Vive en casa, bebe agua y nunca da un paso." },
];

const hunt: Gen = (ctx) => {
  const w = takeWord(ctx, 7, 5);
  const k = 3;
  const cut = [0, Math.ceil(w.length / 3), Math.ceil((2 * w.length) / 3), w.length];
  const parts = Array.from({ length: k }, (_, i) => w.slice(cut[i], cut[i + 1]));
  const spots = ctx.rng.shuffle(SPOTS).slice(0, k);
  return {
    kind: "hunt",
    title: "La búsqueda por la casa",
    instructions: `${cap(ctx.theme.guardian)} ha escondido ${k} tarjetas en sitios de esta casa. Cada adivinanza dice dónde buscar. Cuando tengáis las ${k}, ponedlas en orden (1, 2 y 3) y leeréis la contraseña.`,
    printable: { type: "hunt", clues: spots.map((x) => x.riddle), spots: spots.map((x) => x.place), parts },
    answer: w,
    accept: [normalizeAnswer(w)],
    hints: [`La tarjeta 1 está ${spots[0].place}.`, `La palabra tiene ${w.length} letras y empieza por "${w[0]}".`],
    solution: `Las tarjetas estaban ${spots.map((x) => x.place).join(", ")}. Juntas dicen ${parts.join(" + ")} = ${w}.`,
  };
};

const GENERATORS: Record<string, Gen> = { grille, wheel, hunt, jigsaw, symbols, riddle, anagram, caesar: caesarPuzzle, numbers, mirror, sequence, lock, wordsearch, maze, shapes, logic };

/** Orden preferente de tipos según la edad (se toman los N primeros, con variedad). */
const BY_AGE: Record<AgeId, string[]> = {
  peques: ["jigsaw", "hunt", "shapes", "maze", "riddle", "symbols", "mirror", "lock", "riddle"],
  ninos: ["jigsaw", "wheel", "hunt", "grille", "symbols", "maze", "riddle", "wordsearch", "lock"],
  jovenes: ["grille", "wheel", "hunt", "jigsaw", "logic", "symbols", "caesar", "sequence", "maze"],
  adultos: ["wheel", "grille", "logic", "hunt", "symbols", "jigsaw", "caesar", "sequence", "wordsearch"],
};


function ctxFor(input: EscapeInput, salt: string, finalWord = ""): Ctx {
  return {
    rng: makeRng(hash(JSON.stringify(input) + salt)),
    input,
    theme: THEMES[input.theme],
    usedWords: new Set(),
    usedRiddles: new Set(),
    finalWord,
    hard: { facil: 0, media: 1, dificil: 2 }[input.difficulty],
    ageLevel: { peques: 0, ninos: 1, jovenes: 2, adultos: 3 }[input.age],
  };
}

export function heroPhrase(input: EscapeInput) {
  const h = input.hero.trim();
  const t = input.team.trim();
  if (h && t) return `Hoy la misión es para ${h} y su equipo, ${t}. `;
  if (h) return `Hoy la misión es para ${h} y su equipo. `;
  if (t) return `Hoy la misión es para el equipo ${t}. `;
  return "";
}

export function generateGame(raw: unknown): EscapeGame {
  const input = escapeSchema.parse(raw);
  const theme = THEMES[input.theme];
  const n = puzzleCount(input);
  const finalWord = FINAL_WORDS[input.theme][n];
  const ctx = ctxFor(input, "full", finalWord);
  const kinds = BY_AGE[input.age].slice(0, n);
  // Las letras se entregan desordenadas: el reto final es reordenarlas.
  let rewardOrder = finalWord.split("");
  for (let i = 0; i < 10 && rewardOrder.join("") === finalWord; i++) rewardOrder = ctx.rng.shuffle(finalWord.split(""));
  const puzzles: Puzzle[] = kinds.map((k, i) => ({
    ...GENERATORS[k](ctx),
    chapter: theme.chapters[i % theme.chapters.length],
    reward: rewardOrder[i],
  }));
  const minutes = Math.max(4, Math.floor((input.duration - 10) / n));
  return {
    input,
    themeName: theme.name,
    title: input.hero.trim() ? `${theme.title}: la aventura de ${input.hero.trim()}` : theme.title,
    intro: theme.intro.replace("{heroe_frase}", heroPhrase(input)),
    guardian: theme.guardian,
    puzzles,
    finalWord,
    rewardOrder,
    ending: theme.ending,
    prize: theme.prize,
    hintTokens: { facil: n, media: Math.ceil(n * 0.6), dificil: Math.ceil(n / 3) }[input.difficulty],
    minutesPerPuzzle: minutes,
  };
}

export function checkAnswer(p: Pick<Puzzle, "accept">, given: string) {
  const g = normalizeAnswer(given).replace(/^(el|la|los|las|un|una)(?=[a-z]{3,})/, "");
  return p.accept.includes(g) || p.accept.includes(normalizeAnswer(given));
}
