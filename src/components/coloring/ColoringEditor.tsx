"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UnlockPanel } from "@/components/UnlockPanel";
import { Rating } from "@/components/Rating";
import { DeleteProject } from "@/components/DeleteProject";
import { api, getOrderKey, getToken, saveToken } from "@/lib/client";
import { coloringSchema, type ColoringData } from "@/lib/coloring/model";

type Style = ColoringData["style"];
type ProjectDto = { id: string; data: ColoringData; status: "draft" | "paid"; orderId?: string; photos: string[] };

const STYLE_INFO: Record<Style, { name: string; text: string }> = {
  infantil: { name: "Infantil", text: "Trazos gruesos y zonas grandes (3-6 años)" },
  sencillo: { name: "Sencillo", text: "Contornos claros con algo de detalle" },
  detallado: { name: "Detallado", text: "Más zonas para colorear con calma" },
};
const MAX_PAGES = 12;

function PreviewImg({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  return (
    <div className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`max-h-full max-w-full object-contain transition-opacity ${state === "ok" ? "opacity-100" : "opacity-0"}`} onLoad={() => setState("ok")} onError={() => setState("error")} />
      {state === "loading" && <span className="absolute text-sm text-ink-soft animate-pulse">Dibujando contornos…</span>}
      {state === "error" && <span className="absolute p-4 text-center text-sm text-coral-dark">No se pudo generar la muestra (puede que hayas alcanzado el límite gratuito de hoy).</span>}
    </div>
  );
}

export function ColoringEditor({ aiConfigured }: { aiConfigured: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [token, setToken] = useState("");
  const [data, setData] = useState<ColoringData>(() => coloringSchema.parse({ title: "", style: "sencillo" }));
  const [active, setActive] = useState(0);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const id = params.get("p");
    const tok = id ? getToken(id) : "";
    if (!id || !tok) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    api<{ project: ProjectDto }>(`/api/projects/${id}`, { token: tok })
      .then((r) => {
        setProject(r.project);
        setData(coloringSchema.parse(r.project.data));
        setToken(tok);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params]);

  const persist = useCallback(
    (p: ProjectDto | null, tok: string, next: ColoringData) => {
      if (!p || p.status === "paid") return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        api(`/api/projects/${p.id}`, { method: "PUT", token: tok, body: JSON.stringify({ data: next }) }).catch((e) => setError(e.message));
      }, 600);
    },
    [],
  );

  const update = (patch: Partial<ColoringData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      persist(project, token, next);
      return next;
    });
  };

  async function ensure(): Promise<{ p: ProjectDto; tok: string }> {
    if (project) return { p: project, tok: token };
    const r = await api<{ project: ProjectDto; token: string }>("/api/projects", { method: "POST", body: JSON.stringify({ product: "coloring", data }) });
    saveToken(r.project.id, r.token);
    setProject(r.project);
    setToken(r.token);
    router.replace(`/crear/libro-colorear?p=${r.project.id}`, { scroll: false });
    return { p: r.project, tok: r.token };
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const room = MAX_PAGES - data.pages.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (!list.length) return setError(`El libro admite hasta ${MAX_PAGES} láminas.`);
    let { p } = await ensure().catch((e) => {
      setError(e.message);
      return { p: null as unknown as ProjectDto, tok: "" };
    });
    if (!p) return;
    const tok = token || getToken(p.id);
    let pages = [...data.pages];
    for (const f of list) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", f);
        const r = await api<{ photoId: string; project: ProjectDto }>(`/api/projects/${p.id}/photos`, { method: "POST", token: tok, body: fd });
        p = { ...p, photos: r.project.photos };
        pages = [...pages, { photoId: r.photoId }];
        const next = { ...data, pages };
        setData(next);
        setProject(p);
        persist(p, tok, next);
        fetch("/api/track", { method: "POST", body: JSON.stringify({ event: "preview", product: "coloring" }) }).catch(() => {});
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function removePage(i: number) {
    if (!project) return;
    const pg = data.pages[i];
    await api(`/api/projects/${project.id}/photos/${pg.photoId}`, { method: "DELETE", token }).catch(() => {});
    const pages = data.pages.filter((_, j) => j !== i);
    setData({ ...data, pages });
    setActive((a) => Math.max(0, Math.min(a, pages.length - 1)));
  }

  const paid = project?.status === "paid";
  const pageStyle = (i: number) => data.pages[i]?.style ?? data.style;
  const previewUrl = (i: number) =>
    project ? `/api/projects/${project.id}/coloring-preview/${data.pages[i].photoId}?style=${pageStyle(i)}&t=${encodeURIComponent(token)}` : "";
  const origUrl = (id: string, w = 300) => (project ? `/api/projects/${project.id}/photos/${id}?t=${encodeURIComponent(token)}&w=${w}` : "");

  if (loading) return <p className="p-10 text-center">Cargando…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="font-semibold text-mint">Libro para colorear · muestra gratuita</p>
      <h1 className="font-display text-4xl font-black mt-1">Convierte tus fotos en láminas para colorear</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Sube una foto de tu mascota, tu familia o un paisaje y mira al momento cómo queda. La muestra gratuita tiene resolución limitada y marca de agua.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral-dark">{error}</p>}
      {paid && project?.orderId && (
        <div className="mt-4 rounded-2xl bg-mint/15 p-4">
          <p className="font-bold">¡Pagado! Tu libro en alta resolución está listo.</p>
          <a className="btn btn-dark mt-2 !py-2" href={`/pedido/${project.orderId}?k=${encodeURIComponent(getOrderKey(project.orderId))}`}>Ir a mis descargas</a>
        </div>
      )}

      <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <div className="card space-y-4 p-5">
            <div>
              <label className="label" htmlFor="title">Título del libro</label>
              <input id="title" className="field" maxLength={50} disabled={paid} value={data.title} placeholder="Las aventuras de Simba" onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ded">Dedicatoria en la portada (opcional)</label>
              <input id="ded" className="field" maxLength={120} disabled={paid} value={data.dedication} placeholder="Para Leo, con mucho cariño" onChange={(e) => update({ dedication: e.target.value })} />
            </div>
            <div>
              <span className="label">Estilo general</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(STYLE_INFO) as Style[]).map((s) => (
                  <button key={s} type="button" disabled={paid} aria-pressed={data.style === s} onClick={() => update({ style: s, pages: data.pages.map((p) => ({ photoId: p.photoId })) })} className={`rounded-2xl border-2 p-3 text-left ${data.style === s ? "border-ink bg-mint/10" : "border-line bg-white"}`}>
                    <span className="block font-bold">{STYLE_INFO[s].name}</span>
                    <span className="hint">{STYLE_INFO[s].text}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-2xl border-2 border-dashed border-line p-3 text-sm" aria-disabled>
                <p className="font-bold">Estilo ilustración con IA {aiConfigured ? "" : "· Pendiente"}</p>
                <p className="hint">
                  {aiConfigured
                    ? "Disponible próximamente en este editor."
                    : "Esta función necesita una API de generación de imágenes que todavía no está configurada. Los estilos de arriba funcionan ya, sin IA externa."}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Páginas ({data.pages.length}/{MAX_PAGES})</h2>
              {!paid && (
                <button type="button" className="btn btn-dark !py-2" disabled={uploading > 0 || data.pages.length >= MAX_PAGES} onClick={() => fileInput.current?.click()}>
                  {uploading ? "Subiendo…" : "Añadir fotos"}
                </button>
              )}
            </div>
            <p className="hint mt-2">Funcionan mejor las fotos nítidas, con buena luz y un protagonista claro. Tus fotos son privadas, se usan solo para crear tu libro y puedes borrarlas cuando quieras.</p>
            {data.pages.length === 0 ? (
              <button type="button" onClick={() => fileInput.current?.click()} className="mt-4 grid w-full place-items-center rounded-2xl border-2 border-dashed border-ink/30 bg-shell p-10 text-center">
                <span className="text-4xl" aria-hidden>🖼️</span>
                <span className="mt-2 font-bold">Sube tu primera foto</span>
                <span className="hint">JPG, PNG, WEBP o HEIC · hasta 10 MB</span>
              </button>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {data.pages.map((pg, i) => (
                  <li key={pg.photoId}>
                    <button type="button" onClick={() => setActive(i)} className={`block w-full overflow-hidden rounded-xl border-2 ${active === i ? "border-mint" : "border-transparent"}`} aria-label={`Ver página ${i + 1}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={origUrl(pg.photoId)} alt="" className="aspect-square w-full object-cover" />
                    </button>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span>Pág. {i + 1}</span>
                      {!paid && <button type="button" className="underline text-coral-dark" onClick={() => removePage(i)}>Quitar</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-20 h-fit space-y-4">
          {data.pages.length > 0 && project ? (
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">Muestra de la página {active + 1}</p>
                <div className="flex gap-1">
                  {(Object.keys(STYLE_INFO) as Style[]).map((s) => (
                    <button key={s} type="button" className="chip !py-1 text-sm" disabled={paid} aria-pressed={pageStyle(active) === s} onClick={() => update({ pages: data.pages.map((p, j) => (j === active ? { ...p, style: s } : p)) })}>
                      {STYLE_INFO[s].name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_2fr] gap-3 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={origUrl(data.pages[active].photoId, 500)} alt="Foto original" className="rounded-2xl" />
                <PreviewImg key={previewUrl(active)} src={previewUrl(active)} alt={`Lámina para colorear de la página ${active + 1}`} />
              </div>
              <p className="hint mt-2">Muestra gratuita a 700 px con marca de agua. El libro final se genera a 300 ppp en A4, sin marca de agua.</p>
            </div>
          ) : (
            <div className="card grid gap-3 p-5 sm:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/samples/chelsea.webp" alt="Foto de ejemplo de un gato" className="rounded-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/samples/chelsea-sencillo.webp" alt="La misma foto convertida en lámina para colorear" className="rounded-2xl bg-white" />
              <p className="hint sm:col-span-2">Ejemplo real generado con el estilo «Sencillo» (foto de ejemplo con licencia libre).</p>
            </div>
          )}
          {project && data.pages.length > 0 && !paid && <Rating projectId={project.id} token={token} />}
        </div>
      </div>

      {!paid && (
        <div className="mx-auto mt-10 max-w-3xl">
          <UnlockPanel product="coloring" projectId={project?.id ?? null} token={token} disabledReason={data.pages.length ? undefined : "Añade al menos una foto para poder comprar el libro."} />
        </div>
      )}
      {project && (
        <div className="mt-6 text-center">
          <DeleteProject projectId={project.id} token={token} redirect="/crear/libro-colorear" />
        </div>
      )}
    </div>
  );
}
