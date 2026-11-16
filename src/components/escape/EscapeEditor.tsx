"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PrintableHtml } from "./PrintableHtml";
import { UnlockPanel } from "@/components/UnlockPanel";
import { api, getOrderKey, getToken, saveToken } from "@/lib/client";
import { AGES, DIFFICULTIES, DURATIONS, THEME_OPTIONS, puzzleCount, type AgeId, type Difficulty } from "@/lib/escape/options";
import type { Printable } from "@/lib/escape/generator";

type Input = { age: AgeId; theme: string; players: number; difficulty: Difficulty; duration: number; hero: string; team: string };
type DemoPuzzle = { kind: string; title: string; chapter: string; instructions: string; printable: Printable };
type Demo = { state: string; title: string; intro: string; themeName: string; puzzles: DemoPuzzle[] };

const DEFAULT: Input = { age: "ninos", theme: "piratas", players: 4, difficulty: "media", duration: 60, hero: "", team: "" };

export function EscapeEditor() {
  const params = useSearchParams();
  const [input, setInput] = useState<Input>(DEFAULT);
  const [demo, setDemo] = useState<Demo | null>(null);
  const [step, setStep] = useState(-1);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [ending, setEnding] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState<{ id: string; token: string; status: string; orderId?: string } | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = params.get("p");
    if (!id) return;
    const token = getToken(id);
    if (!token) return;
    api<{ project: { id: string; data: Input; status: string; orderId?: string } }>(`/api/projects/${id}`, { token })
      .then((r) => {
        setInput({ ...DEFAULT, ...r.project.data });
        setProject({ id, token, status: r.project.status, orderId: r.project.orderId });
      })
      .catch(() => {});
  }, [params]);

  const set = (patch: Partial<Input>) => setInput((i) => ({ ...i, ...patch }));

  async function play() {
    setBusy(true);
    setError("");
    try {
      const d = await api<Demo>("/api/escape/demo", { method: "POST", body: JSON.stringify({ input }) });
      setDemo(d);
      setStep(0);
      setAnswer("");
      setFeedback(null);
      setHints([]);
      setEnding("");
      setTimeout(() => gameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!demo || !answer.trim()) return;
    const r = await api<{ correct: boolean; solution?: string; ending?: string }>("/api/escape/check", { method: "POST", body: JSON.stringify({ state: demo.state, index: step, answer }) });
    if (r.correct) {
      setFeedback({ ok: true, text: `¡Correcto! ${r.solution ?? ""}` });
      if (r.ending) setEnding(r.ending);
    } else setFeedback({ ok: false, text: "Todavía no. Revisa el reto o pide una pista." });
  }

  async function hint() {
    if (!demo) return;
    const r = await api<{ hint: string }>("/api/escape/check", { method: "POST", body: JSON.stringify({ state: demo.state, index: step, hint: hints.length }) });
    setHints((h) => [...h, r.hint]);
  }

  async function reveal() {
    if (!demo) return;
    const r = await api<{ answer: string; solution: string }>("/api/escape/check", { method: "POST", body: JSON.stringify({ state: demo.state, index: step, reveal: true }) });
    setFeedback({ ok: true, text: `Solución: ${r.solution}` });
    if (step === demo.puzzles.length - 1) setEnding("¡Aventura completada! En el juego completo os esperan más retos y una palabra final.");
  }

  function next() {
    setStep((s) => s + 1);
    setAnswer("");
    setFeedback(null);
    setHints([]);
  }

  async function ensureProject() {
    if (project && project.status !== "paid") {
      await api(`/api/projects/${project.id}`, { method: "PUT", token: project.token, body: JSON.stringify({ data: input }) });
      return { id: project.id, token: project.token };
    }
    const r = await api<{ project: { id: string }; token: string }>("/api/projects", { method: "POST", body: JSON.stringify({ product: "escape", data: input }) });
    saveToken(r.project.id, r.token);
    setProject({ id: r.project.id, token: r.token, status: "draft" });
    return { id: r.project.id, token: r.token };
  }

  const n = puzzleCount(input);
  const puzzle = demo && step >= 0 ? demo.puzzles[step] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="font-semibold text-violet">Escape room personalizado · demo gratuita</p>
      <h1 className="font-display text-4xl font-black mt-1">Diseña vuestra aventura</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Elige edad y aventura, y juega ahora gratis una mini versión de 3 acertijos. Sin registro.</p>

      {project?.status === "paid" && project.orderId && (
        <div className="mt-4 rounded-2xl bg-mint/15 p-4">
          <p className="font-bold">Este escape room ya está pagado.</p>
          <a className="btn btn-dark mt-2 !py-2" href={`/pedido/${project.orderId}?k=${encodeURIComponent(getOrderKey(project.orderId))}`}>Ir a mis descargas</a>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card space-y-5 p-5">
          <div>
            <span className="label">1. ¿Para qué edad?</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(AGES) as AgeId[]).map((a) => (
                <button key={a} type="button" className="chip" aria-pressed={input.age === a} onClick={() => set({ age: a })}>{AGES[a]}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">2. Elige una aventura</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_OPTIONS.map((t) => (
                <button key={t.id} type="button" aria-pressed={input.theme === t.id} onClick={() => set({ theme: t.id })} className={`rounded-2xl border-2 p-3 text-left ${input.theme === t.id ? "border-ink bg-violet/10" : "border-line bg-white"}`}>
                  <span className="text-2xl" aria-hidden>{t.emoji}</span>
                  <span className="block font-bold">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-sm">
            <label className="label" htmlFor="hero">¿Quién es el protagonista? (opcional)</label>
            <input id="hero" maxLength={40} className="field" value={input.hero} onChange={(e) => set({ hero: e.target.value })} placeholder="Ej.: Mateo" />
          </div>
          <details className="rounded-2xl bg-shell p-4">
            <summary className="cursor-pointer list-none font-bold">⚙️ Más opciones <span className="hint font-normal">(dificultad, duración, jugadores…)</span></summary>
            <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">Dificultad</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                  <button key={d} type="button" className="chip" aria-pressed={input.difficulty === d} onClick={() => set({ difficulty: d })}>{DIFFICULTIES[d]}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Duración</span>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" className="chip" aria-pressed={input.duration === d} onClick={() => set({ duration: d })}>{d} min</button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="players">Participantes</label>
              <input id="players" type="number" min={1} max={20} className="field" value={input.players} onChange={(e) => set({ players: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} />
            </div>
            <div>
              <label className="label" htmlFor="team">Nombre del equipo</label>
              <input id="team" maxLength={40} className="field" value={input.team} onChange={(e) => set({ team: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
            </div>
          </details>
          {error && <p role="alert" className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral-dark">{error}</p>}
          <button className="btn btn-primary w-full text-lg" onClick={play} disabled={busy}>
            {busy ? "Preparando la aventura…" : demo ? "Generar otra demo con estos datos" : "▶ Jugar la demo gratis"}
          </button>
        </div>

        <aside className="card hidden h-fit p-5 lg:block">
          <h2 className="font-display text-2xl font-bold">Qué recibirás en el juego completo</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>✓ <b>{n} acertijos</b> encadenados para {input.duration} minutos ({DIFFICULTIES[input.difficulty].toLowerCase()}), pensados para {AGES[input.age].toLowerCase()}.</li>
            <li>✓ Historia original para leer en voz alta{input.hero ? `, protagonizada por ${input.hero}` : ""}.</li>
            <li>✓ Guía del organizador: materiales, preparación paso a paso, tiempos y seguridad.</li>
            <li>✓ Tarjetas de recompensa con letras que forman la palabra final ({n} letras).</li>
            <li>✓ {n * 2} tarjetas de pistas y hoja de soluciones explicadas.</li>
            <li>✓ Reto final y diploma para {input.players} {input.players === 1 ? "participante" : "participantes"}.</li>
            <li>✓ PDF A4 listo para imprimir en casa.</li>
          </ul>
          <p className="hint mt-3">Los acertijos se generan con plantillas propias revisadas y se comprueban automáticamente para que siempre tengan solución.</p>
        </aside>
      </div>

      {demo && (
        <section ref={gameRef} className="mt-10 scroll-mt-24" aria-live="polite">
          <div className="rounded-[2rem] bg-ink p-5 text-white sm:p-8">
            <p className="text-sun font-bold tracking-widest text-xs uppercase">Demo · {demo.themeName}</p>
            <h2 className="font-display text-3xl font-black mt-1">{demo.title}</h2>
            {step === 0 && !feedback && <p className="mt-3 max-w-3xl text-white/85 leading-relaxed">{demo.intro}</p>}
            <div className="mt-4 flex gap-2" aria-label="Progreso">
              {demo.puzzles.map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < step || (i === step && feedback?.ok) ? "bg-sun" : i === step ? "bg-white/60" : "bg-white/20"}`} />
              ))}
            </div>
          </div>
          {puzzle && (
            <div className="card mt-4 p-5 sm:p-8">
              <p className="text-sm italic text-ink-soft">{puzzle.chapter}</p>
              <h3 className="font-display text-2xl font-bold mt-1">Reto {step + 1}: {puzzle.title}</h3>
              <p className="mt-2">{puzzle.instructions}</p>
              <div className="mt-4">
                <PrintableHtml p={puzzle.printable} />
              </div>
              {!feedback?.ok ? (
                <form onSubmit={check} className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="answer" className="sr-only">Respuesta</label>
                  <input id="answer" className="field" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escribe vuestra respuesta" autoComplete="off" />
                  <button className="btn btn-dark">Comprobar</button>
                </form>
              ) : null}
              {feedback && <p className={`mt-3 rounded-xl p-3 font-semibold ${feedback.ok ? "bg-mint/15 text-ink" : "bg-coral/10 text-coral-dark"}`}>{feedback.text}</p>}
              {hints.map((h, i) => (
                <p key={i} className="mt-2 rounded-xl bg-sun/25 p-3 text-sm"><b>Pista {i + 1}:</b> {h}</p>
              ))}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {!feedback?.ok && hints.length < 2 && <button type="button" className="underline" onClick={hint}>Pedir una pista</button>}
                {!feedback?.ok && hints.length === 2 && <button type="button" className="underline" onClick={reveal}>Ver la solución</button>}
                {feedback?.ok && step < demo.puzzles.length - 1 && <button type="button" className="btn btn-primary" onClick={next}>Siguiente reto →</button>}
              </div>
              {ending && (
                <div className="mt-5 rounded-2xl bg-violet/10 p-5">
                  <p className="font-display text-xl font-bold">{ending}</p>
                  <p className="mt-2 text-sm">Así funciona cada reto del juego completo: en papel, con sobres, pistas y una palabra final para abrir el premio.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {project?.status !== "paid" && (
        <div className="mx-auto mt-10 max-w-3xl">
          <UnlockPanel product="escape" projectId={project?.id ?? null} token={project?.token ?? ""} ensureProject={ensureProject} />
        </div>
      )}
    </div>
  );
}
