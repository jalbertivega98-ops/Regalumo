import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { config } from "../config";

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** Firma un objeto JSON. Formato: payload.firma (base64url). */
export function sign(payload: object, purpose: string): string {
  const body = b64(JSON.stringify(payload));
  const mac = createHmac("sha256", config.secret).update(purpose + "." + body).digest();
  return body + "." + b64(mac);
}

export function verify<T>(token: string | null | undefined, purpose: string): T | null {
  if (!token || typeof token !== "string" || token.length > 8000) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", config.secret).update(purpose + "." + body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp?: number };
    if (data.exp && Date.now() > data.exp) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function randomId(bytes = 12) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(v: string) {
  return createHash("sha256").update(v).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
