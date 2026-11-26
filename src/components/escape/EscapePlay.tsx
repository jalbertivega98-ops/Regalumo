"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { PublicPlayState } from "@/lib/escape/play";

/** Progreso guardado en el móvil (solo en este navegador). */
type Progress = {
  startedAt: number | null;
  finishedAt: number | null;
  /** Letra conseguida en cada acertijo resuelto. */
  letters: Record<number, string>;
  /** Pistas leídas por acertijo (0, 1 o 2). */
  hints: Record<number, string[]>;
  tokensUsed: number;
  ending: string;
  finalWord: string;
};
const EMPTY: Progress = { startedAt: null, finishedAt: null, letters: {}, hints: {}, tokensUsed: 0, ending: "", finalWord: "" };
const storeKey = (id: string) => `rg_play_${id}`;

function load(id: string): Progress {
  try {
    const raw = localStorage.getItem(storeKey(id));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function mmss(sec: number) {
  const s = Math.abs(Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function EscapePlay({ id, k }: { id: string; k: string }) {
  const [game, setGame] = useState<PublicPlayState | null>(null);
  const [error, setError] = useState("");
  const [prog, setProg] = useState<Progress>(EMPTY);
  const [now, setNow] = useState(() => Date.now());
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string; letter?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const call = useCallback(<T,>(body: object) => api<T>(`/api/escape/play/${id}`, { method: "POST", body: JSON.stringify({ k, ...body }) }), [id, k]);

  useEffect(() => {
    // El progreso vive en localStorage: se lee al montar (no existe en el servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProg(load(id));
    call<PublicPlayState>({ action: "state" }).then(setGame).catch((e: Error) => setError(e.message));
  }, [id, call]);

  const save = (p: Progress) => {
    setProg(p);
    try {
      localStorage.setItem(storeKey(id), JSON.stringify(p));
    } catch {}
  };

  const running = !!prog.startedAt && !prog.finishedAt;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    // Mientras dura la partida, la pantalla no se apaga (si el navegador lo permite).
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const ask = () => nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    ask();
    const onVis = () => document.visibilityState === "visible" && ask();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, [running]);

  if (error)
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-2xl font-bold">No hemos podido abrir el juego</p>
        <p className="mt-2 text-ink-soft">{error}. Revisa que el enlace esté completo (cópialo tal cual desde tu pedido o escanea el código QR de la hoja de control).</p>
      </div>
    );
  if (!game) return <p className="p-10 text-center">Cargando la aventura…</p>;

  const n = game.puzzles.length;
  const solved = Object.keys(prog.letters).length;
  const current = solved < n ? solved : -1;
  const tokensLeft = Math.max(0, game.hintTokens - prog.tokensUsed);
  const elapsed = prog.startedAt ? ((prog.finishedAt ?? now) - prog.startedAt) / 1000 : 0;
  const left = game.duration * 60 - elapsed;
  const letters = Array.from({ length: n }, (_, i) => prog.letters[i] ?? "");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || busy || current < 0) return;
    setBusy(true);
    try {
      const r = await call<{ correct: boolean; reward?: string }>({ action: "check", index: current, answer });
      if (r.correct && r.reward) {
        save({ ...prog, startedAt: prog.startedAt ?? Date.now(), letters: { ...prog.letters, [current]: r.reward } });
        setFeedback({ ok: true, letter: r.reward, text: "" });
        setAnswer("");
        try {
          navigator.vibrate?.(120);
        } catch {}
      } else {
        setFeedback({ ok: false, text: "No es correcto. Revisad el sobre y probad otra vez." });
        try {
          navigator.vibrate?.([60, 60, 60]);
        } catch {}
      }
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function hint() {
    if (current < 0 || busy) return;
    const used = prog.hints[current]?.length ?? 0;
    if (used >= 2 || tokensLeft <= 0) return;
    setBusy(true);
    try {
      const r = await call<{ hint: string }>({ action: "hint", index: current, hint: used });
      save({ ...prog, hints: { ...prog.hints, [current]: [...(prog.hints[current] ?? []), r.hint] }, tokensUsed: prog.tokensUsed + 1 });
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function finalCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || busy) return;
    setBusy(true);
    try {
      const r = await call<{ correct: boolean; ending?: string; finalWord?: string }>({ action: "final", answer });
      if (r.correct) {
        save({ ...prog, finishedAt: Date.now(), ending: r.ending ?? "", finalWord: r.finalWord ?? "" });
        setFeedback(null);
        setAnswer("");
        try {
          navigator.vibrate?.([100, 50, 100, 50, 200]);
        } catch {}
      } else setFeedback({ ok: false, text: "Esa no es la palabra. Probad a ordenar las letras de otra manera." });
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function reset() {
    save(EMPTY);
    setFeedback(null);
    setAnswer("");
    setShowIntro(true);
    setConfirmReset(false);
  }

  const timer = (
    <div className={`rounded-2xl p-4 text-center ${left < 0 ? "bg-coral/15" : left < 300 && running ? "bg-sun/30" : "bg-white/10"}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-80">{left < 0 ? "Tiempo extra" : "Tiempo"}</p>
      <p className="font-display text-5xl font-black tabular-nums" aria-live="off">
        {left < 0 ? "+" : ""}
        {mmss(prog.startedAt ? left : game.duration * 60)}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-ink p-5 text-white sm:p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-sun">Escape room · {game.themeName}</p>
        <h1 className="mt-1 font-display text-3xl font-black leading-tight sm:text-4xl">{game.title}</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          {showIntro && !prog.startedAt ? <p className="leading-relaxed text-white/85">{game.intro}</p> : <div className="hidden sm:block" />}
          {timer}
        </div>
        {!prog.startedAt && (
          <button className="btn btn-primary mt-4 w-full text-lg sm:w-auto" onClick={() => { save({ ...prog, startedAt: Date.now() }); setShowIntro(false); setTimeout(() => inputRef.current?.focus(), 50); }}>
            ▶ Empezar la cuenta atrás
          </button>
        )}
        {/* Letras conseguidas */}
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Letras conseguidas">
          {letters.map((l, i) => (
            <span key={i} className={`grid h-12 w-10 place-items-center rounded-lg font-display text-2xl font-black ${l ? "bg-sun text-ink" : "border-2 border-dashed border-white/30 text-white/40"}`}>
              {l || i + 1}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm text-white/70">
          {solved} de {n} sobres resueltos · fichas de pista: {tokensLeft} de {game.hintTokens}
        </p>
      </div>

      {prog.startedAt && current >= 0 && (
        <div className="card p-5 sm:p-6">
          {feedback?.ok && feedback.letter ? (
            <div className="text-center">
              <p className="font-bold text-mint">¡Correcto!</p>
              <p className="mt-2">Vuestra letra es</p>
              <p className="mx-auto mt-2 grid h-24 w-20 place-items-center rounded-2xl bg-sun font-display text-6xl font-black">{feedback.letter}</p>
              <p className="mt-4">
                Pedid a {game.guardian} la tarjeta de recompensa del sobre {solved}: os dirá dónde está {solved < n ? `el sobre ${solved + 1}` : "el último sobre, el del reto final"}.
              </p>
              <button className="btn btn-dark mt-4" onClick={next}>
                {solved < n ? `Ya tenemos el sobre ${solved + 1} →` : "Ir al reto final →"}
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-violet">Sobre {current + 1}</p>
              <h2 className="font-display text-2xl font-bold">{game.puzzles[current].title}</h2>
              <p className="mt-1 italic text-ink-soft">{game.puzzles[current].chapter}</p>
              <form onSubmit={check} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="play-answer" className="sr-only">Vuestra respuesta</label>
                <input ref={inputRef} id="play-answer" className="field" value={answer} onChange={(e) => { setAnswer(e.target.value); if (feedback && !feedback.ok) setFeedback(null); }} placeholder="Vuestra respuesta" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="done" />
                <button className="btn btn-primary" disabled={busy}>Comprobar</button>
              </form>
              {feedback && !feedback.ok && <p className="mt-2 rounded-xl bg-coral/10 p-2 text-sm font-semibold text-coral-dark" role="alert">{feedback.text}</p>}
              {(prog.hints[current] ?? []).map((h, j) => (
                <p key={j} className="mt-2 rounded-xl bg-sun/25 p-3 text-sm"><b>Pista {j + 1}:</b> {h}</p>
              ))}
              {(prog.hints[current]?.length ?? 0) < 2 && (
                <button type="button" className="btn btn-ghost mt-3 !py-2 text-sm" onClick={hint} disabled={busy || tokensLeft <= 0}>
                  {tokensLeft > 0 ? `💡 Usar una ficha de pista (quedan ${tokensLeft})` : "No os quedan fichas de pista"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {prog.startedAt && current < 0 && !prog.finishedAt && (
        <div className="card p-5 sm:p-6">
          {feedback?.ok && feedback.letter ? (
            <div className="text-center">
              <p className="font-bold text-mint">¡Correcto! Vuestra última letra es</p>
              <p className="mx-auto mt-2 grid h-24 w-20 place-items-center rounded-2xl bg-sun font-display text-6xl font-black">{feedback.letter}</p>
              <p className="mt-4">Pedid a {game.guardian} la tarjeta de recompensa: os dirá dónde está el sobre del reto final.</p>
              <button className="btn btn-dark mt-4" onClick={next}>Ir al reto final →</button>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-violet">Reto final</p>
              <h2 className="font-display text-2xl font-bold">La palabra que lo abre todo</h2>
              <p className="mt-1">Ordenad vuestras {n} letras para formar una palabra de {game.finalLength} letras relacionada con la aventura.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {letters.map((l, i) => (
                  <span key={i} className="grid h-12 w-10 place-items-center rounded-lg bg-sun font-display text-2xl font-black">{l}</span>
                ))}
              </div>
              <form onSubmit={finalCheck} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="play-final" className="sr-only">Palabra final</label>
                <input ref={inputRef} id="play-final" className="field" value={answer} onChange={(e) => { setAnswer(e.target.value); if (feedback && !feedback.ok) setFeedback(null); }} placeholder="Palabra final" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="done" maxLength={20} />
                <button className="btn btn-primary" disabled={busy}>Abrir {game.prize}</button>
              </form>
              {feedback && !feedback.ok && <p className="mt-2 rounded-xl bg-coral/10 p-2 text-sm font-semibold text-coral-dark" role="alert">{feedback.text}</p>}
            </>
          )}
        </div>
      )}

      {prog.finishedAt && (
        <div className="card p-6 text-center">
          <p className="text-4xl" aria-hidden>🎉🗝️🎉</p>
          <h2 className="mt-2 font-display text-3xl font-black">¡Lo habéis conseguido!</h2>
          <p className="mt-2 font-display text-4xl font-black tracking-widest text-violet">{prog.finalWord}</p>
          <p className="mt-3 leading-relaxed">{prog.ending}</p>
          <p className="mt-4 rounded-2xl bg-shell p-3 font-semibold">
            Tiempo: {mmss(elapsed)} {left >= 0 ? `(os sobraron ${mmss(left)})` : `(${mmss(-left)} de tiempo extra)`} · pistas usadas: {prog.tokensUsed}
          </p>
          <p className="mt-3 hint">Es el momento de entregar los diplomas y abrir {game.prize}.</p>
        </div>
      )}

      <div className="text-center">
        {confirmReset ? (
          <p className="text-sm">
            ¿Seguro? Se borra el progreso de este móvil.{" "}
            <button className="font-bold text-coral-dark underline" onClick={reset}>Sí, empezar de cero</button>{" "}
            <button className="underline" onClick={() => setConfirmReset(false)}>No</button>
          </p>
        ) : (
          prog.startedAt && <button className="hint underline" onClick={() => setConfirmReset(true)}>Reiniciar la partida</button>
        )}
      </div>
    </div>
  );
}
