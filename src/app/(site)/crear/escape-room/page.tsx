import type { Metadata } from "next";
import { Suspense } from "react";
import { EscapeEditor } from "@/components/escape/EscapeEditor";

export const metadata: Metadata = {
  title: "Crea tu escape room personalizado gratis",
  robots: { index: false, follow: true },
  alternates: { canonical: "/escape-room-personalizado" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Cargando…</p>}>
      <EscapeEditor />
    </Suspense>
  );
}
