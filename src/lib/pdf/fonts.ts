import path from "path";
import { Font } from "@react-pdf/renderer";

let done = false;
const dir = () => path.join(process.cwd(), "assets", "fonts");

/** Registra las fuentes (incluidas en el repositorio, licencia SIL OFL) para los PDF. */
export function registerFonts() {
  if (done) return;
  const f = (file: string) => path.join(dir(), file);
  // Sin guiones automáticos (el separador por defecto es inglés y partía palabras en sitios raros: "d / e").
  Font.registerHyphenationCallback((word) => [word]);
  Font.register({ family: "Unifraktur", src: f("unifrakturmaguntia-latin-400-normal.woff") });
  Font.register({
    family: "Playfair",
    fonts: [
      { src: f("playfair-display-latin-400-normal.woff"), fontWeight: 400 },
      { src: f("playfair-display-latin-400-italic.woff"), fontWeight: 400, fontStyle: "italic" },
      { src: f("playfair-display-latin-700-normal.woff"), fontWeight: 700 },
      { src: f("playfair-display-latin-900-normal.woff"), fontWeight: 900 },
    ],
  });
  Font.register({
    family: "OldStandard",
    fonts: [
      { src: f("old-standard-tt-latin-400-normal.woff"), fontWeight: 400 },
      { src: f("old-standard-tt-latin-400-italic.woff"), fontWeight: 400, fontStyle: "italic" },
      { src: f("old-standard-tt-latin-700-normal.woff"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Inter",
    fonts: [
      { src: f("inter-latin-400-normal.woff"), fontWeight: 400 },
      { src: f("inter-latin-400-normal.woff"), fontWeight: 400, fontStyle: "italic" },
      { src: f("inter-latin-600-normal.woff"), fontWeight: 600 },
      { src: f("inter-latin-800-normal.woff"), fontWeight: 800 },
    ],
  });
  Font.register({
    family: "Fraunces",
    fonts: [
      { src: f("fraunces-latin-400-normal.woff"), fontWeight: 400 },
      { src: f("fraunces-latin-400-normal.woff"), fontWeight: 400, fontStyle: "italic" },
      { src: f("fraunces-latin-700-normal.woff"), fontWeight: 700 },
      { src: f("fraunces-latin-900-normal.woff"), fontWeight: 900 },
    ],
  });
  Font.register({
    family: "Caveat",
    fonts: [
      { src: f("caveat-latin-400-normal.woff"), fontWeight: 400 },
      { src: f("caveat-latin-700-normal.woff"), fontWeight: 700 },
    ],
  });
  // Sin guiones automáticos: el español se parte mal con el algoritmo inglés.
  // Las palabras muy largas se trocean para que nunca se salgan de su columna.
  Font.registerHyphenationCallback((word) => (word.length > 16 ? word.match(/.{1,12}/g) ?? [word] : [word]));
  done = true;
}
