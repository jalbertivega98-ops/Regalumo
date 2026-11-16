"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Analítica sin cookies: una visita por página y una sesión por pestaña (sessionStorage). */
export function Analytics() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const send = (event: string) =>
      fetch("/api/track", { method: "POST", body: JSON.stringify({ event }), keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    try {
      if (!sessionStorage.getItem("rg_s")) {
        sessionStorage.setItem("rg_s", "1");
        send("session");
      }
    } catch {
      /* navegación privada */
    }
    send("pageview");
  }, [path]);
  return null;
}
