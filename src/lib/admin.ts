import { cookies } from "next/headers";
import { config } from "./config";
import { HttpError } from "./projects";
import { safeEqual, sign, verify } from "./security/tokens";

const COOKIE = "rg_admin";

export async function isAdmin() {
  if (!config.adminPassword) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return !!verify(c, "admin");
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new HttpError(401, "Acceso restringido");
}

export async function login(password: string) {
  if (!config.adminPassword || !safeEqual(password, config.adminPassword)) return false;
  (await cookies()).set(COOKIE, sign({ exp: Date.now() + 12 * 3600 * 1000 }, "admin"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 3600,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
