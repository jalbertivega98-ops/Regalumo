/**
 * Marca de agua de las muestras gratuitas: «REGALUMO» repetido en diagonal por toda la superficie,
 * en filas alternas desplazadas para que no quede ningún hueco limpio que recortar.
 * La misma tesela se usa en la web (fondo CSS) y en las imágenes generadas en el servidor.
 */
export const WATERMARK_COLOR = "#FF6B4A";
export const WATERMARK_TEXT = "REGALUMO";

/** Tesela SVG (tamaño base 420×240) con dos textos desplazados. */
export function watermarkTile(opacity = 0.3, scale = 1) {
  const w = 420 * scale, h = 240 * scale, fs = 30 * scale;
  const t = (x: number, y: number) =>
    `<text x="${x}" y="${y}" text-anchor="middle" transform="rotate(-30 ${x} ${y})" font-family="Inter, Arial, Helvetica, sans-serif" font-weight="800" letter-spacing="${2 * scale}" font-size="${fs}" fill="${WATERMARK_COLOR}" fill-opacity="${opacity}">${WATERMARK_TEXT}</text>`;
  return { w, h, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${t(w * 0.25, h * 0.3)}${t(w * 0.75, h * 0.8)}</svg>` };
}

/** SVG del tamaño indicado cubierto entero con la tesela (para componer sobre imágenes). */
export function watermarkSvg(width: number, height: number, opacity = 0.3) {
  const scale = Math.max(0.6, Math.min(width, height) / 700);
  const { w, h, svg } = watermarkTile(opacity, scale);
  const inner = svg.replace(/^<svg[^>]*>|<\/svg>$/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><pattern id="wm" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${inner}</pattern></defs><rect width="100%" height="100%" fill="url(#wm)"/></svg>`;
}

/** URL data: de la tesela, para usarla como fondo repetido en CSS. */
export function watermarkCssUrl(opacity = 0.3) {
  return `url("data:image/svg+xml,${encodeURIComponent(watermarkTile(opacity).svg)}")`;
}
