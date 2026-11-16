/** Limpieza de texto de usuario: sin caracteres de control y con longitud acotada. */
export function clean(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .slice(0, max)
    .trim();
}

/** Normaliza respuestas de acertijos: minúsculas, sin tildes ni espacios. */
export function normalizeAnswer(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");
}
