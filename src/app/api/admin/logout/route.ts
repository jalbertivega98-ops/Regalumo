import { json } from "@/lib/http";
import { logout } from "@/lib/admin";

export async function POST() {
  await logout();
  return json({ ok: true });
}
