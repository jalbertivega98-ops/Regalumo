"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EscapeDemo, type PublicDemo } from "./EscapeDemo";
import { UnlockPanel } from "@/components/UnlockPanel";
import { api, getOrderKey, getToken, saveToken } from "@/lib/client";
import { AGES, DIFFICULTIES, DURATIONS, THEME_OPTIONS, puzzleCount, type AgeId, type Difficulty } from "@/lib/escape/options";
import { trackStep } from "@/lib/track-client";

type Input = { age: AgeId; theme: string; players: number; difficulty: Difficulty; duration: number; hero: string; team: string };

const DEFAULT: Input = { age: "ninos", theme: "piratas", players: 4, difficulty: "media", duration: 60, hero: "", team: "" };

export function EscapeEditor() {
  const params = useSearchParams();
  const [input, setInput] = useState<Input>(() => {
    // Las guías pueden enlazar con una temática ya elegida (p. ej. ?tema=navidad).
    const tema = params.get("tema");
    return THEME_OPTIONS.some((t) => t.id === tema) ? { ...DEFAULT, theme: tema as string } : DEFAULT;
  });
  const [demo, setDemo] = useState<PublicDemo | null>(null);
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
      const d = await api<PublicDemo>("/api/escape/demo", { method: "POST", body: JSON.stringify({ input }) });
      setDemo(d);
      trackStep("preview", "escape");
      setTimeout(() => gameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="font-semibold text-violet">Escape room personalizado · demo gratuita</p>
      <h1 className="font-display text-4xl font-black mt-1">Diseña vuestra aventura</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Elige edad y aventura, y juega ahora gratis una mini aventura de 3 retos: un puzle, una búsqueda y un candado. Sin registro.</p>

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
            <li>✓ Etiquetas numeradas para los sobres e invitaciones para los jugadores.</li>
            <li>✓ Código QR para jugar con el móvil: cuenta atrás, respuestas y pistas (opcional).</li>
            <li>✓ PDF A4 listo para imprimir en casa.</li>
          </ul>
          <p className="hint mt-3">Los acertijos se generan con plantillas propias revisadas y se comprueban automáticamente para que siempre tengan solución.</p>
        </aside>
      </div>

      {demo && (
        <section ref={gameRef} className="mt-10 scroll-mt-24" aria-live="polite">
          <EscapeDemo key={demo.state} demo={demo} />
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
