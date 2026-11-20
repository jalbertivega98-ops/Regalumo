"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewspaperPreview } from "./NewspaperPreview";
import { UnlockPanel } from "@/components/UnlockPanel";
import { Rating } from "@/components/Rating";
import { DeleteProject } from "@/components/DeleteProject";
import { api, getOrderKey, getToken, saveToken } from "@/lib/client";
import { LIMITS, OCCASIONS, TEMPLATES, newspaperSchema, suggestions, type NewspaperData, type OccasionId, type TemplateId } from "@/lib/newspaper/model";
import { trackStep } from "@/lib/track-client";

type ProjectDto = { id: string; data: NewspaperData; status: "draft" | "paid"; orderId?: string; photos: string[] };

function Counter({ v, max }: { v: string; max: number }) {
  return <span className={`hint ${v.length > max * 0.9 ? "text-coral-dark" : ""}`}>{v.length}/{max}</span>;
}

function Section({ n, title, children, open = false }: { n: number; title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="card group">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-bold text-white">{n}</span>
        <span className="font-display text-lg font-bold flex-1">{title}</span>
        <span aria-hidden className="transition group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-4 px-4 pb-5 sm:px-5">{children}</div>
    </details>
  );
}

export function NewspaperEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [token, setToken] = useState("");
  const [data, setData] = useState<NewspaperData>(() => newspaperSchema.parse({}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(0);
  const [more, setMore] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceId = useRef<string | null>(null);
  const pendingSave = useRef<(() => Promise<void>) | null>(null);
  const flushSave = async () => {
    clearTimeout(saveTimer.current);
    await pendingSave.current?.();
  };
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Arranque rápido
  const [start, setStart] = useState({ honoree: "", occasion: "cumpleanos" as OccasionId, age: "", template: "clasico" as TemplateId });

  useEffect(() => {
    const id = params.get("p");
    const tok = id ? getToken(id) : "";
    if (!id || !tok) {
      const t = setTimeout(() => {
        if (id) setError("Este proyecto se creó en otro navegador o dispositivo. Por privacidad, solo se puede abrir desde allí.");
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }
    api<{ project: ProjectDto }>(`/api/projects/${id}`, { token: tok })
      .then((r) => {
        setProject(r.project);
        setData(newspaperSchema.parse(r.project.data));
        setToken(tok);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params]);

  const persist = useCallback(
    (next: NewspaperData) => {
      if (!project || project.status === "paid") return;
      clearTimeout(saveTimer.current);
      setSaving("saving");
      const run = async () => {
        pendingSave.current = null;
        try {
          await api(`/api/projects/${project.id}`, { method: "PUT", token, body: JSON.stringify({ data: next }) });
          setSaving("saved");
        } catch (e) {
          setSaving("error");
          setError((e as Error).message);
          throw e;
        }
      };
      pendingSave.current = run;
      saveTimer.current = setTimeout(() => run().catch(() => {}), 700);
    },
    [project, token],
  );

  const update = (patch: Partial<NewspaperData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      persist(next);
      return next;
    });
  };

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const s = suggestions({ occasion: start.occasion, honoree: start.honoree, age: start.age });
    const first = start.honoree.trim().split(/\s+/)[0];
    const initial = newspaperSchema.parse({
      ...start,
      paperName: first ? `El Diario de ${first}` : "",
      editionDate: new Date().toISOString().slice(0, 10),
      headline: s.headline,
      subheadline: s.sub,
      lead: s.lead,
    });
    try {
      const r = await api<{ project: ProjectDto; token: string }>("/api/projects", { method: "POST", body: JSON.stringify({ product: "newspaper", data: initial }) });
      saveToken(r.project.id, r.token);
      setToken(r.token);
      setProject(r.project);
      setData(newspaperSchema.parse(r.project.data));
      router.replace(`/crear/periodico?p=${r.project.id}`, { scroll: false });
      trackStep("preview", "newspaper");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function upload(files: FileList | null) {
    if (!files || !project) return;
    setError("");
    const replacing = replaceId.current;
    replaceId.current = null;
    const room = replacing ? 1 : LIMITS.photos - data.photos.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (!list.length) return setError(`Máximo ${LIMITS.photos} fotos. Borra alguna para añadir otra.`);
    for (const f of list) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", f);
        const r = await api<{ photoId: string; project: ProjectDto }>(`/api/projects/${project.id}/photos`, { method: "POST", token, body: fd });
        setProject((p) => (p ? { ...p, photos: r.project.photos } : p));
        trackStep("upload", "newspaper");
        setData((d) => {
          const photos = replacing
            ? [{ id: r.photoId, caption: "" }, ...d.photos.filter((x) => x.id !== replacing)]
            : [...d.photos, { id: r.photoId, caption: "" }];
          const next = { ...d, photos: photos.slice(0, LIMITS.photos) };
          persist(next);
          return next;
        });
        if (replacing) api(`/api/projects/${project.id}/photos/${replacing}`, { method: "DELETE", token }).catch(() => {});
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function removePhoto(id: string) {
    if (!project) return;
    try {
      await api(`/api/projects/${project.id}/photos/${id}`, { method: "DELETE", token });
      update({ photos: data.photos.filter((p) => p.id !== id) });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const photoUrl = useCallback((id: string) => (project && token ? `/api/projects/${project.id}/photos/${id}?t=${encodeURIComponent(token)}&w=1200` : null), [project, token]);
  const paid = project?.status === "paid";
  const sugg = useMemo(() => suggestions(data), [data]);

  if (loading) return <p className="p-10 text-center">Cargando tu proyecto…</p>;

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="font-semibold text-coral">Periódico personalizado · prueba gratuita</p>
        <h1 className="font-display text-4xl font-black mt-1">¿A quién vamos a sacar en portada?</h1>
        <p className="mt-3 text-ink-soft">Escribe su nombre, elige la ocasión y verás tu portada al instante. Sin registro y sin tarjeta.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral-dark">{error}</p>}
        <form onSubmit={create} className="card mt-6 space-y-4 p-5">
          <div>
            <label className="label" htmlFor="hn">Nombre de la persona protagonista</label>
            <input id="hn" required maxLength={LIMITS.honoree} className="field" value={start.honoree} onChange={(e) => setStart({ ...start, honoree: e.target.value })} placeholder="Por ejemplo: Lucía García" />
          </div>
          <div>
            <span className="label">Ocasión</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(OCCASIONS) as OccasionId[]).map((o) => (
                <button type="button" key={o} className="chip" aria-pressed={start.occasion === o} onClick={() => setStart({ ...start, occasion: o })}>
                  {OCCASIONS[o]}
                </button>
              ))}
            </div>
          </div>
          {start.occasion === "cumpleanos" && (
            <div>
              <label className="label" htmlFor="age">¿Cuántos años cumple? (opcional)</label>
              <input id="age" inputMode="numeric" maxLength={3} className="field max-w-32" value={start.age} onChange={(e) => setStart({ ...start, age: e.target.value.replace(/\D/g, "") })} />
            </div>
          )}
          <button className="btn btn-primary w-full text-lg">Crear mi portada gratis</button>
          <p className="hint text-center">En el siguiente paso subes la foto de portada y puedes cambiar todos los textos.</p>
        </form>
      </div>
    );
  }

  const field = <K extends keyof NewspaperData>(k: K, label: string, max: number, opts: { area?: boolean; placeholder?: string; rows?: number } = {}) => (
    <div>
      <div className="flex justify-between">
        <label className="label" htmlFor={`f-${String(k)}`}>{label}</label>
        <Counter v={String(data[k] ?? "")} max={max} />
      </div>
      {opts.area ? (
        <textarea id={`f-${String(k)}`} rows={opts.rows ?? 4} maxLength={max} className="field" disabled={paid} value={String(data[k] ?? "")} placeholder={opts.placeholder} onChange={(e) => update({ [k]: e.target.value } as Partial<NewspaperData>)} />
      ) : (
        <input id={`f-${String(k)}`} maxLength={max} className="field" disabled={paid} value={String(data[k] ?? "")} placeholder={opts.placeholder} onChange={(e) => update({ [k]: e.target.value } as Partial<NewspaperData>)} />
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-coral">Periódico personalizado</p>
          <h1 className="font-display text-3xl font-black">Edita tu portada</h1>
        </div>
        <p className="hint" aria-live="polite">
          {paid ? "Pedido pagado: el proyecto queda bloqueado." : saving === "saving" ? "Guardando…" : saving === "saved" ? "Guardado ✓" : saving === "error" ? "Error al guardar" : "Los cambios se guardan solos"}
        </p>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral-dark">{error}</p>}
      {paid && project.orderId && (
        <div className="mt-4 rounded-2xl bg-mint/15 p-4">
          <p className="font-bold">¡Pagado! Tu PDF sin marca de agua está listo.</p>
          <a className="btn btn-dark mt-2 !py-2" href={`/pedido/${project.orderId}?k=${encodeURIComponent(getOrderKey(project.orderId))}`}>Ir a mis descargas</a>
        </div>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-3">
<input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-label="Elegir fotos" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          <div className="card space-y-4 p-4 sm:p-5">
            <p className="font-display text-xl font-bold">Tu portada</p>
            {!paid && data.photos.length === 0 && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading > 0}
              className="flex w-full items-center gap-4 rounded-3xl border-2 border-dashed border-coral bg-coral/5 p-5 text-left transition hover:-translate-y-0.5 hover:bg-coral/10"
            >
              <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl bg-coral text-2xl text-white">📷</span>
              <span>
                <span className="block font-display text-xl font-bold">{uploading ? "Subiendo foto…" : "Sube la foto de portada"}</span>
                <span className="hint block">Desde el móvil o el ordenador. Sale en grande junto al titular. Puedes añadir hasta {LIMITS.photos}.</span>
              </span>
            </button>
          )}
            {data.photos.length > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-shell p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/projects/${project.id}/photos/${data.photos[0].id}?t=${encodeURIComponent(token)}&w=300`} alt="Foto de portada" className="size-16 rounded-xl object-cover" />
                <span className="flex-1 text-sm font-semibold">Foto de portada ✓</span>
                {!paid && (
                  <button type="button" className="btn btn-ghost !px-3 !py-2 text-sm" disabled={uploading > 0} onClick={() => { replaceId.current = data.photos[0].id; fileInput.current?.click(); }}>
                    Cambiar
                  </button>
                )}
              </div>
            )}
            <div>
              <span className="label">Estilo</span>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TEMPLATES) as TemplateId[]).map((t) => (
                  <button key={t} type="button" disabled={paid} className="chip" aria-pressed={data.template === t} onClick={() => update({ template: t })}>
                    {TEMPLATES[t].name}
                  </button>
                ))}
              </div>
            </div>
            {field("headline", "Titular", LIMITS.headline)}
            {field("lead", "Texto principal", LIMITS.lead, { area: true, rows: 4 })}
            {!paid && (
              <button type="button" className="text-sm font-semibold underline" onClick={() => update({ headline: sugg.headline, subheadline: sugg.sub, lead: sugg.lead })}>
                ✨ Escribir los textos por mí
              </button>
            )}
          </div>

          <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="flex w-full items-center justify-between rounded-2xl border-2 border-line bg-white px-4 py-3 text-left font-bold transition hover:border-ink">
            <span>{more ? "Ocultar opciones" : "➕ Añadir más (anécdotas, mensajes, fechas, más fotos…)"}</span>
            <span aria-hidden className={`transition ${more ? "rotate-180" : ""}`}>▾</span>
          </button>

          {more && (
            <>
          <Section n={1} title="Ocasión">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(OCCASIONS) as OccasionId[]).map((o) => (
                <button type="button" key={o} disabled={paid} className="chip" aria-pressed={data.occasion === o} onClick={() => update({ occasion: o })}>
                  {OCCASIONS[o]}
                </button>
              ))}
            </div>
          </Section>

          <Section n={2} title="Protagonista y cabecera">
            {field("honoree", "Nombre de la persona protagonista", LIMITS.honoree)}
            {field("paperName", "Nombre del periódico", LIMITS.paperName, { placeholder: "El Diario de…" })}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="f-date">Fecha de la edición</label>
                <input id="f-date" type="date" className="field" disabled={paid} value={data.editionDate} onChange={(e) => update({ editionDate: e.target.value })} />
              </div>
              {field("place", "Lugar (opcional)", LIMITS.place)}
            </div>
            <div className="max-w-40">
              <label className="label" htmlFor="f-age">Años o número (opcional)</label>
              <input id="f-age" inputMode="numeric" maxLength={3} className="field" disabled={paid} value={data.age} onChange={(e) => update({ age: e.target.value.replace(/\D/g, "") })} />
            </div>
          </Section>

          <Section n={3} title="Textos de la portada">
            {field("headline", "Titular", LIMITS.headline)}
            {field("subheadline", "Subtítulo", LIMITS.subheadline)}
            {field("lead", "Texto principal", LIMITS.lead, { area: true, rows: 6 })}
            {!paid && (
              <button type="button" className="btn btn-ghost !py-2 text-sm" onClick={() => update({ headline: sugg.headline, subheadline: sugg.sub, lead: sugg.lead })}>
                Usar textos sugeridos para «{OCCASIONS[data.occasion]}»
              </button>
            )}
            <p className="hint">Los textos sugeridos solo usan los datos que tú escribes: nunca inventamos datos de la vida de nadie.</p>
            {field("quote", "Frase destacada (opcional)", LIMITS.quote)}
          </Section>

          <Section n={4} title={`Fotos (${data.photos.length}/${LIMITS.photos})`}>
            <p className="hint">La primera foto será la principal. Formatos JPG, PNG, WEBP o HEIC, hasta 10 MB. Tus fotos son privadas: no se publican ni se indexan, y puedes borrarlas cuando quieras.</p>
            {!paid && (
              <button type="button" className="btn btn-dark !py-2" onClick={() => fileInput.current?.click()} disabled={data.photos.length >= LIMITS.photos || uploading > 0}>
                {uploading ? "Subiendo…" : "Añadir fotos"}
              </button>
            )}
            <ul className="space-y-3">
              {data.photos.map((ph, i) => (
                <li key={ph.id} className="flex gap-3 items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/projects/${project.id}/photos/${ph.id}?t=${encodeURIComponent(token)}&w=300`} alt={`Foto ${i + 1}`} className="size-20 rounded-xl object-cover" />
                  <div className="flex-1 space-y-2">
                    <input className="field !py-1.5" maxLength={LIMITS.caption} disabled={paid} aria-label={`Pie de la foto ${i + 1} (opcional)`} placeholder="Pie de foto (opcional)" value={ph.caption} onChange={(e) => update({ photos: data.photos.map((x) => (x.id === ph.id ? { ...x, caption: e.target.value } : x)) })} />
                    {!paid && (
                      <div className="flex gap-3 text-sm">
                        {i > 0 && (
                          <button type="button" className="underline" onClick={() => update({ photos: [ph, ...data.photos.filter((x) => x.id !== ph.id)] })}>
                            Hacer principal
                          </button>
                        )}
                        <button type="button" className="underline text-coral-dark" onClick={() => removePhoto(ph.id)}>Borrar</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section n={5} title={`Anécdotas (${data.anecdotes.length}/${LIMITS.anecdotes})`}>
            {data.anecdotes.map((a, i) => (
              <div key={i} className="rounded-2xl bg-shell p-3 space-y-2">
                <input className="field" maxLength={LIMITS.anecdoteTitle} disabled={paid} aria-label={`Título de la anécdota ${i + 1}`} placeholder="Título de la anécdota" value={a.title} onChange={(e) => update({ anecdotes: data.anecdotes.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <textarea className="field" rows={3} maxLength={LIMITS.anecdoteText} disabled={paid} aria-label={`Texto de la anécdota ${i + 1}`} placeholder="Cuéntala con tus palabras" value={a.text} onChange={(e) => update({ anecdotes: data.anecdotes.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                {!paid && <button type="button" className="text-sm underline text-coral-dark" onClick={() => update({ anecdotes: data.anecdotes.filter((_, j) => j !== i) })}>Quitar</button>}
              </div>
            ))}
            {!paid && data.anecdotes.length < LIMITS.anecdotes && (
              <button type="button" className="btn btn-ghost !py-2 text-sm" onClick={() => update({ anecdotes: [...data.anecdotes, { title: "", text: "" }] })}>+ Añadir anécdota</button>
            )}
          </Section>

          <Section n={6} title={`Mensajes de familia y amistades (${data.messages.length}/${LIMITS.messages})`}>
            {data.messages.map((m, i) => (
              <div key={i} className="rounded-2xl bg-shell p-3 space-y-2">
                <textarea className="field" rows={2} maxLength={LIMITS.message} disabled={paid} aria-label={`Mensaje ${i + 1}`} placeholder="El mensaje" value={m.text} onChange={(e) => update({ messages: data.messages.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                <div className="flex gap-2">
                  <input className="field" maxLength={LIMITS.from} disabled={paid} aria-label={`Firma del mensaje ${i + 1}`} placeholder="Firma (quién lo escribe)" value={m.from} onChange={(e) => update({ messages: data.messages.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)) })} />
                  {!paid && <button type="button" className="text-sm underline text-coral-dark" onClick={() => update({ messages: data.messages.filter((_, j) => j !== i) })}>Quitar</button>}
                </div>
              </div>
            ))}
            {!paid && data.messages.length < LIMITS.messages && (
              <button type="button" className="btn btn-ghost !py-2 text-sm" onClick={() => update({ messages: [...data.messages, { from: "", text: "" }] })}>+ Añadir mensaje</button>
            )}
          </Section>

          <Section n={7} title="Fechas importantes y firma">
            {data.dates.map((x, i) => (
              <div key={i} className="flex gap-2">
                <input className="field max-w-28" maxLength={20} disabled={paid} aria-label={`Fecha ${i + 1}: año o fecha`} placeholder="Año o fecha" value={x.date} onChange={(e) => update({ dates: data.dates.map((y, j) => (j === i ? { ...y, date: e.target.value } : y)) })} />
                <input className="field" maxLength={LIMITS.dateLabel} disabled={paid} aria-label={`Fecha ${i + 1}: qué pasó`} placeholder="Qué pasó" value={x.label} onChange={(e) => update({ dates: data.dates.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)) })} />
                {!paid && <button type="button" aria-label="Quitar fecha" className="px-2 text-coral-dark" onClick={() => update({ dates: data.dates.filter((_, j) => j !== i) })}>✕</button>}
              </div>
            ))}
            {!paid && data.dates.length < LIMITS.dates && (
              <button type="button" className="btn btn-ghost !py-2 text-sm" onClick={() => update({ dates: [...data.dates, { date: "", label: "" }] })}>+ Añadir fecha</button>
            )}
            {field("signoff", "Firma al pie (opcional)", LIMITS.signoff, { placeholder: "Con cariño, tu familia" })}
          </Section>
            </>
          )}
          {!paid && <Rating projectId={project.id} token={token} />}
        </div>

        <div className="order-first lg:order-none">
          <div className="lg:sticky lg:top-20 space-y-4">
            <NewspaperPreview data={data} photoUrl={photoUrl} watermark={!paid} onPhotoSlotClick={paid ? undefined : () => fileInput.current?.click()} />
            <p className="hint text-center">
              Vista previa en pantalla. El PDF final es A3 vertical (29,7 × 42 cm), vectorial y sin marca de agua.
            </p>
          </div>
        </div>
      </div>

      {!paid && (
        <div className="mt-8 max-w-3xl mx-auto">
          <UnlockPanel product="newspaper" projectId={project.id} token={token} beforePay={flushSave} disabledReason={uploading ? "Espera a que termine de subirse la foto." : undefined} />
        </div>
      )}
      <div className="mt-6 text-center">
        <DeleteProject projectId={project.id} token={token} redirect="/crear/periodico" />
      </div>
    </div>
  );
}
