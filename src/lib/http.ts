import { NextResponse } from "next/server";
import { HttpError } from "./projects";
import { LimitError } from "./security/ratelimit";
import { logError } from "./errors";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Envuelve un handler para convertir errores en respuestas JSON con mensaje en español. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError || e instanceof LimitError) {
        return json({ error: e.message }, e.status);
      }
      const req = args[0] instanceof Request ? args[0] : null;
      await logError(e, req ? new URL(req.url).pathname : "unknown");
      return json({ error: "Ha ocurrido un error inesperado. Lo hemos registrado para revisarlo." }, 500);
    }
  };
}
