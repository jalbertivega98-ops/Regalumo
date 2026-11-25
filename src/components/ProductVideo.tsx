"use client";
import { useEffect, useRef, useState } from "react";
import type { ProductId } from "@/lib/products/catalog";

const FILES: Record<ProductId, { file: string; label: string }> = {
  newspaper: { file: "periodico", label: "Vídeo de 15 segundos: cómo se crea el periódico personalizado y cómo queda" },
  escape: { file: "escape-room", label: "Vídeo de 15 segundos: cómo se crea el escape room personalizado y cómo queda" },
  coloring: { file: "libro-colorear", label: "Vídeo de 15 segundos: cómo se convierte una foto en lámina para colorear" },
};

/**
 * Vídeo corto del producto. Se reproduce solo, en bucle y sin sonido (los navegadores
 * solo permiten la reproducción automática silenciada); lleva subtítulos incrustados
 * y un botón para activar la voz. Si el usuario prefiere menos movimiento, no arranca solo.
 */
export function ProductVideo({ product }: { product: ProductId }) {
  const { file, label } = FILES[product];
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().catch(() => {});
  }, []);

  function toggleSound() {
    const v = ref.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }

  function togglePlay() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  return (
    <figure className="mx-auto w-full max-w-[15rem] sm:max-w-[20rem] lg:max-w-[22rem]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-ink shadow-[0_24px_60px_rgba(30,22,51,0.25)]">
        <video
          ref={ref}
          className="absolute inset-0 size-full object-cover"
          src={`/videos/${file}.mp4`}
          poster={`/videos/${file}.webp`}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={togglePlay}
        />
        <div className="absolute left-2 right-2 top-2 flex justify-between gap-2">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pausar el vídeo" : "Reproducir el vídeo"} title={playing ? "Pausar" : "Reproducir"} className="grid size-9 place-items-center rounded-full bg-white/90 text-sm font-bold text-ink shadow">
            <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
          </button>
          <button type="button" onClick={toggleSound} aria-label={muted ? "Activar el sonido" : "Quitar el sonido"} aria-pressed={!muted} title={muted ? "Activar sonido" : "Quitar sonido"} className="grid size-9 place-items-center rounded-full bg-white/90 text-base shadow">
            <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
          </button>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-ink-soft sm:text-sm">Cómo se hace y cómo queda, en 15 segundos</figcaption>
    </figure>
  );
}
