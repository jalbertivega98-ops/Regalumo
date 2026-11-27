"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import type { DemoStep, SeekItem } from "@/lib/escape/demo";
import type { EscapePalette } from "@/lib/escape/style";

export type PublicDemo = {
  state: string;
  title: string;
  intro: string;
  themeName: string;
  prize: string;
  palette: EscapePalette;
  steps: DemoStep[];
};

type Slide = Extract<DemoStep, { kind: "slide" }>;
type Seek = Extract<DemoStep, { kind: "seek" }>;
type Lock = Extract<DemoStep, { kind: "lock" }>;

/** Dibujo de la imagen rota (300 × 300). Cada pieza muestra un trozo con su propio viewBox. */
function SlideArt({ s, c }: { s: Slide; c: EscapePalette }) {
  const spots: [number, number][] = [[62, 78], [238, 78], [62, 250], [238, 250]];
  return (
    <>
      <rect width="300" height="300" fill={c.soft} />
      <path d="M30 200 C 90 120, 140 260, 200 170 S 280 90, 270 40" stroke={c.accent2} strokeWidth="6" fill="none" strokeDasharray="14 10" strokeLinecap="round" />
      <rect x="7" y="7" width="286" height="286" rx="10" fill="none" stroke={c.accent} strokeWidth="14" />
      {s.decor.map((e, i) => (
        <text key={i} x={spots[i][0]} y={spots[i][1]} fontSize="40" textAnchor="middle" dominantBaseline="central">{e}</text>
      ))}
      <text x="150" y="160" fontSize="200" fontWeight="900" textAnchor="middle" dominantBaseline="central" fill={c.ink} stroke="#fff" strokeWidth="6" paintOrder="stroke" style={{ fontFamily: "var(--font-display)" }}>
        {s.digit}
      </text>
    </>
  );
}

function SlidePuzzle({ s, c, done, onSolved }: { s: Slide; c: EscapePalette; done: boolean; onSolved: () => void }) {
  const [order, setOrder] = useState(s.order);
  const [sel, setSel] = useState<number | null>(null);
  const k = Math.round(Math.sqrt(order.length));
  const size = 300 / k;
  const solved = done || order.every((v, i) => v === i);
  const shown = solved ? order.map((_, i) => i) : order;

  function tap(i: number) {
    if (solved) return;
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    const next = [...order];
    [next[sel], next[i]] = [next[i], next[sel]];
    setOrder(next);
    setSel(null);
    if (next.every((v, j) => v === j)) onSolved();
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className={`grid rounded-2xl bg-ink p-1 ${solved ? "gap-0" : "gap-1"}`} style={{ gridTemplateColumns: `repeat(${k}, 1fr)` }}>
        {shown.map((piece, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            aria-label={`Pieza en la posición ${i + 1}${sel === i ? " (seleccionada)" : ""}`}
            aria-pressed={sel === i}
            disabled={solved}
            className={`relative aspect-square overflow-hidden rounded-md transition ${sel === i ? "z-10 scale-95 ring-4 ring-coral" : ""}`}
          >
            <svg viewBox={`${(piece % k) * size} ${Math.floor(piece / k) * size} ${size} ${size}`} className="block h-full w-full" aria-hidden>
              <SlideArt s={s} c={c} />
            </svg>
          </button>
        ))}
      </div>
      {!solved && <p className="mt-2 text-center text-sm text-ink-soft">{sel === null ? "Toca una pieza…" : "…y ahora la pieza con la que cambiarla."}</p>}
    </div>
  );
}

function SeekScene({ s, c, done, onSolved, onWrong }: { s: Seek; c: EscapePalette; done: boolean; onSolved: () => void; onWrong: (left: boolean) => void }) {
  const [found, setFound] = useState<Set<number>>(new Set());
  const total = s.items.filter((i) => i.target).length;

  function tap(i: number, it: SeekItem) {
    if (done || !it.target) return;
    setFound((f) => {
      const n = new Set(f);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  return (
    <div>
      <div
        className="relative mx-auto aspect-[4/3] max-w-lg overflow-hidden rounded-2xl"
        style={{ background: `linear-gradient(${c.cover} 0 58%, ${c.accent} 58% 100%)` }}
      >
        <div className="absolute inset-x-0 top-[58%] h-1 bg-black/20" />
        {s.items.map((it, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i, it)}
            aria-label={it.target ? `${s.target.name}${found.has(i) ? " (encontrada)" : ""}` : "Objeto de la escena"}
            tabIndex={it.target ? 0 : -1}
            className={`absolute -translate-x-1/2 -translate-y-1/2 select-none leading-none ${it.target ? "cursor-pointer" : "pointer-events-none"}`}
            style={{ left: `${it.x}%`, top: `${it.y}%`, fontSize: `${it.size}px`, zIndex: it.behind ? 1 : it.target ? 3 : 2 }}
          >
            <span className={`block rounded-full p-1 ${it.target && found.has(i) ? "ring-4 ring-sun" : ""}`}>{it.emoji}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <p className="font-semibold">{s.target.emoji} Marcadas: {done ? total : found.size}</p>
        {!done && (
          <button type="button" className="btn btn-dark" onClick={() => (found.size === total ? onSolved() : onWrong(found.size < total))}>
            Ya están {s.target.fem ? "todas" : "todos"}
          </button>
        )}
      </div>
    </div>
  );
}

function LockWheels({ value, onChange, disabled }: { value: number[]; onChange: (v: number[]) => void; disabled: boolean }) {
  const turn = (i: number, d: number) => onChange(value.map((v, j) => (j === i ? (v + d + 10) % 10 : v)));
  return (
    <div className="flex justify-center gap-3">
      {value.map((v, i) => (
        <div key={i} className="flex w-20 flex-col items-center rounded-2xl bg-ink py-1 text-white">
          <button type="button" disabled={disabled} onClick={() => turn(i, 1)} aria-label={`Subir la rueda ${i + 1}`} className="w-full py-1 text-xl text-white/70 hover:text-sun">▲</button>
          <span className="text-sm text-white/35" aria-hidden>{(v + 1) % 10}</span>
          <output aria-label={`Rueda ${i + 1}`} className="w-full border-y-2 border-white/20 text-center font-display text-4xl font-black text-sun">{v}</output>
          <span className="text-sm text-white/35" aria-hidden>{(v + 9) % 10}</span>
          <button type="button" disabled={disabled} onClick={() => turn(i, -1)} aria-label={`Bajar la rueda ${i + 1}`} className="w-full py-1 text-xl text-white/70 hover:text-sun">▼</button>
        </div>
      ))}
    </div>
  );
}

export function EscapeDemo({ demo }: { demo: PublicDemo }) {
  const c = demo.palette;
  const [step, setStep] = useState(0);
  const [won, setWon] = useState<boolean[]>([false, false, false]);
  const [hints, setHints] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [wheels, setWheels] = useState([0, 0, 0]);
  const [ending, setEnding] = useState("");
  const s = demo.steps[step];
  const digits = demo.steps.map((x) => ("digit" in x ? x.digit : null));

  function win(i: number, text: string) {
    setWon((w) => w.map((v, j) => (j === i ? true : v)));
    setMsg({ ok: true, text });
  }

  function next() {
    setStep((x) => x + 1);
    setHints([]);
    setMsg(null);
  }

  async function hint() {
    if (s.kind === "lock") {
      const r = await api<{ hint: string }>("/api/escape/check", { method: "POST", body: JSON.stringify({ state: demo.state, hint: hints.length }) });
      setHints((h) => [...h, r.hint]);
    } else setHints((h) => [...h, s.hints[h.length]]);
  }

  async function reveal() {
    if (s.kind === "slide") win(0, `Así queda recompuesto: la primera cifra del candado es ${s.digit}.`);
    if (s.kind === "seek") win(1, `Había ${s.digit} ${s.target.name}. Segunda cifra: ${s.digit}.`);
    if (s.kind === "lock") {
      const r = await api<{ code: string; ending: string }>("/api/escape/check", { method: "POST", body: JSON.stringify({ state: demo.state, reveal: true }) });
      setWheels(r.code.split("").map(Number));
      setWon([true, true, true]);
      setEnding(r.ending);
      setMsg({ ok: true, text: `La combinación era ${r.code.split("").join(" - ")}.` });
    }
  }

  async function open(e: React.FormEvent) {
    e.preventDefault();
    const r = await api<{ correct: boolean; ending?: string }>("/api/escape/check", { method: "POST", body: JSON.stringify({ state: demo.state, code: wheels.join("") }) });
    if (r.correct) {
      setWon([true, true, true]);
      setEnding(r.ending ?? "");
      setMsg({ ok: true, text: "¡Clic! El candado se abre." });
    } else setMsg({ ok: false, text: "El candado no se abre. Revisad el orden que dice la nota." });
  }

  return (
    <div>
      <div className="rounded-[2rem] bg-ink p-5 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-sun">Demo · {demo.themeName} · reto {step + 1} de 3</p>
        <h2 className="mt-1 font-display text-3xl font-black">{demo.title}</h2>
        {step === 0 && !won[0] && <p className="mt-3 max-w-3xl leading-relaxed text-white/85">{demo.intro}</p>}
        <div className="mt-4 flex items-center gap-2" aria-label="Cifras del candado">
          {[0, 1, 2].map((i) => {
            const d = i < 2 ? (won[i] ? digits[i] : null) : won[2] ? "🔓" : "🔒";
            return (
              <span key={i} className={`grid h-12 w-11 place-items-center rounded-xl font-display text-2xl font-black ${d !== null && i < 2 ? "bg-sun text-ink" : "border-2 border-dashed border-white/40"}`}>
                {d ?? "?"}
              </span>
            );
          })}
          <span className="ml-2 text-sm text-white/70">Cada reto da una cifra para el candado final.</span>
        </div>
      </div>

      <div className="card mt-4 p-5 sm:p-8">
        <p className="text-sm italic text-ink-soft">{s.chapter}</p>
        <h3 className="mt-1 font-display text-2xl font-bold">Reto {step + 1}: {s.title}</h3>
        <p className="mt-2">{s.instructions}</p>

        <div className="mt-5">
          {s.kind === "slide" && <SlidePuzzle key={step} s={s} c={c} done={won[0]} onSolved={() => win(0, `¡Recompuesto! Primera cifra del candado: ${s.digit}.`)} />}
          {s.kind === "seek" && (
            <SeekScene
              key={step}
              s={s}
              c={c}
              done={won[1]}
              onSolved={() => win(1, `¡Bien visto! Eran ${s.digit}. Segunda cifra del candado: ${s.digit}.`)}
              onWrong={(left) => setMsg({ ok: false, text: left ? "Todavía falta alguna. ¡Seguid buscando!" : "Habéis marcado alguna de más." })}
            />
          )}
          {s.kind === "lock" && <LockStep s={s} wheels={wheels} setWheels={setWheels} won={won[2]} prize={demo.prize} onOpen={open} />}
        </div>

        {msg && <p className={`mt-4 rounded-xl p-3 font-semibold ${msg.ok ? "bg-mint/15 text-ink" : "bg-coral/10 text-coral-dark"}`} role="status">{msg.text}</p>}
        {hints.map((h, i) => (
          <p key={i} className="mt-2 rounded-xl bg-sun/25 p-3 text-sm"><b>Pista {i + 1}:</b> {h}</p>
        ))}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {!won[step] && hints.length < 2 && <button type="button" className="underline" onClick={hint}>Pedir una pista</button>}
          {!won[step] && hints.length === 2 && <button type="button" className="underline" onClick={reveal}>Ver la solución</button>}
          {won[step] && step < 2 && <button type="button" className="btn btn-primary" onClick={next}>Siguiente reto →</button>}
        </div>

        {ending && (
          <div className="mt-5 rounded-2xl bg-violet/10 p-5">
            <p className="text-3xl" aria-hidden>🎉🔓🎉</p>
            <p className="mt-1 font-display text-xl font-bold">{ending}</p>
            <p className="mt-2 text-sm">
              En el juego completo hay de 4 a 9 retos en papel: piezas para recortar, códigos secretos, laberintos y cosas que buscar por casa. Cada reto da una letra y todas juntas abren el premio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LockStep({ s, wheels, setWheels, won, prize, onOpen }: { s: Lock; wheels: number[]; setWheels: (v: number[]) => void; won: boolean; prize: string; onOpen: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onOpen}>
      <p className="rounded-2xl bg-sun/20 p-4 font-display text-lg leading-snug">📜 {s.note}</p>
      <div className="mt-5">
        <LockWheels value={wheels} onChange={setWheels} disabled={won} />
      </div>
      {!won && (
        <div className="mt-4 text-center">
          <button className="btn btn-dark">🔓 Abrir {prize}</button>
        </div>
      )}
    </form>
  );
}
