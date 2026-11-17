import { watermarkCssUrl } from "@/lib/brand/watermark";

/** Capa «REGALUMO» repetida sobre toda la vista previa. El contenedor padre debe ser `relative`. */
export function Watermark({ opacity = 0.3, size = 380 }: { opacity?: number; size?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 select-none"
      style={{ backgroundImage: watermarkCssUrl(opacity), backgroundSize: `${size}px ${(size * 240) / 420}px`, backgroundRepeat: "repeat" }}
    />
  );
}
