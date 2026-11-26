import { createHmac } from "crypto";
import { config } from "../config";
import { safeEqual } from "../security/tokens";
import { generateGame, type EscapeGame } from "./generator";

/**
 * Panel de juego en el móvil. El enlace lleva una clave corta firmada con el secreto del servidor
 * (no caduca: el juego puede jugarse meses después de la compra). Las respuestas nunca salen del servidor.
 */
export function playKey(projectId: string) {
  return createHmac("sha256", config.secret).update("escape-play." + projectId).digest("base64url").slice(0, 16);
}

export function checkPlayKey(projectId: string, key: string) {
  return !!key && safeEqual(playKey(projectId), key);
}

export function playUrl(projectId: string) {
  return `${config.siteUrl}/jugar/${projectId}?k=${playKey(projectId)}`;
}

/** Lo que ve el equipo: nada que permita deducir las respuestas. */
export function publicPlayState(g: EscapeGame) {
  return {
    title: g.title,
    intro: g.intro,
    theme: g.input.theme,
    themeName: g.themeName,
    guardian: g.guardian,
    prize: g.prize,
    duration: g.input.duration,
    hintTokens: g.hintTokens,
    finalLength: g.finalWord.length,
    puzzles: g.puzzles.map((p) => ({ title: p.title, chapter: p.chapter })),
  };
}
export type PublicPlayState = ReturnType<typeof publicPlayState>;

export { generateGame };
