import type { Metadata } from "next";
import { Suspense } from "react";
import { ColoringEditor } from "@/components/coloring/ColoringEditor";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Crea tu libro para colorear con tus fotos",
  robots: { index: false, follow: true },
  alternates: { canonical: "/libro-para-colorear-personalizado" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Cargando…</p>}>
      <ColoringEditor aiConfigured={!!(config.imageAi.provider && config.imageAi.apiKey)} />
    </Suspense>
  );
}
