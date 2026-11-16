"use client";
import { useState } from "react";
import { NewspaperPreview } from "@/components/newspaper/NewspaperPreview";
import { demoNewspaper, TEMPLATES, type TemplateId } from "@/lib/newspaper/model";

const PHOTOS: Record<string, string> = { a: "/samples/chelsea.webp", b: "/samples/coffee.webp" };

/** Ejemplo interactivo con datos ficticios: cambia de plantilla en directo. */
export function NewspaperShowcase({ compact = false }: { compact?: boolean }) {
  const [template, setTemplate] = useState<TemplateId>("clasico");
  const data = {
    ...demoNewspaper(),
    template,
    photos: [
      { id: "a", caption: "Simba, el rey de la casa" },
      { id: "b", caption: "El café de los domingos" },
    ],
  };
  return (
    <div>
      <div className={`mx-auto ${compact ? "max-w-sm" : "max-w-md"}`}>
        <NewspaperPreview data={data} photoUrl={(id) => PHOTOS[id] ?? null} watermark={false} />
      </div>
      <div className="mt-4 flex justify-center gap-2" role="group" aria-label="Plantilla del ejemplo">
        {(Object.keys(TEMPLATES) as TemplateId[]).map((t) => (
          <button key={t} type="button" className="chip text-sm" aria-pressed={template === t} onClick={() => setTemplate(t)}>
            {TEMPLATES[t].name}
          </button>
        ))}
      </div>
      <p className="hint mt-2 text-center">Ejemplo con datos ficticios. Prueba a cambiar la plantilla.</p>
    </div>
  );
}
