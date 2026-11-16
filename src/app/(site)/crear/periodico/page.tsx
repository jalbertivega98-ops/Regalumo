import type { Metadata } from "next";
import { Suspense } from "react";
import { NewspaperEditor } from "@/components/newspaper/NewspaperEditor";

export const metadata: Metadata = {
  title: "Crea tu periódico personalizado gratis",
  robots: { index: false, follow: true },
  alternates: { canonical: "/periodico-personalizado" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Cargando…</p>}>
      <NewspaperEditor />
    </Suspense>
  );
}
