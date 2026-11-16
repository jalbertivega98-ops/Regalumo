import { getStore } from "./store";
import { randomId } from "./security/tokens";

export interface ErrorLog {
  id: string;
  at: string;
  where: string;
  message: string;
}

export async function logError(e: unknown, where: string) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`[regalumo] ${where}:`, e);
  try {
    const id = randomId(8);
    await getStore().put<ErrorLog>("errors", id, { id, at: new Date().toISOString(), where, message: message.slice(0, 500) });
  } catch {
    /* no bloquear la respuesta si falla el registro */
  }
}
