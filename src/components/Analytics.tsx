"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { markOwner, trackPage } from "@/lib/track-client";

/** Analítica sin cookies: visitas, origen y páginas (ver src/lib/track-client.ts). */
export function Analytics() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return markOwner();
    trackPage(path);
  }, [path]);
  return null;
}
