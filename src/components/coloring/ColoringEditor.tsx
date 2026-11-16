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
    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-line bg-white">
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
  const pendingSave = useRef<(() => Promise<void>) | null>(null);
  const flushSave = async () => {
    clearTimeout(timer.current);
    await pendingSave.current?.();
  };

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
      const run = async () => {
        pendingSave.current = null;
        await api(`/api/projects/${p.id}`, { method: "PUT", token: tok, body: JSON.stringify({ data: next }) }).catch((e) => {
          setError(e.message);
          throw e;
        });
      };
      pendingSave.current = run;
      timer.current = setTimeout(() => run().catch(() => {}), 600);
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
      <p className="mt-2 max-w-2xl text-ink-soft">Sube una foto y mira al momento cómo queda. Gratis y sin registro.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral-dark">{error}</p>}
      {paid && project?.orderId && (
        <div className="mt-4 rounded-2xl bg-mint/15 p-4">
          <p className="font-bold">¡Pagado! Tu libro en alta resolución está listo.</p>
          <a className="btn btn-dark mt-2 !py-2" href={`/pedido/${project.orderId}?k=${encodeURIComponent(getOrderKey(project.orderId))}`}>Ir a mis descargas</a>
        </div>
      )}

      <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />

      {data.pages.length === 0 || !project ? (
        <div className="mt-6 grid items-center gap-6 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading > 0 || paid}
            className="group grid min-h-72 w-full place-items-center rounded-[2rem] border-[3px] border-dashed border-mint bg-mint/10 p-8 text-center transition hover:-translate-y-1 hover:bg-mint/15"
          >
            <span>
              <span aria-hidden className="mx-auto grid size-20 place-items-center rounded-3xl bg-mint text-4xl text-white shadow-lg transition group-hover:scale-110">📷</span>
              <span className="mt-4 block font-display text-3xl font-black">{uploading ? "Convirtiendo tu foto…" : "Sube una foto"}</span>
              <span className="mt-1 block text-ink-soft">Desde el móvil o el ordenador. En segundos verás tu lámina.</span>
              <span className="hint mt-3 block">Mejor fotos nítidas y con buena luz · Son privadas y puedes borrarlas</span>
            </span>
          </button>
          <div className="card grid grid-cols-2 gap-3 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/samples/chelsea.webp" alt="Foto de ejemplo de un gato" className="aspect-square rounded-2xl object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/samples/chelsea-sencillo.webp" alt="La misma foto convertida en lámina para colorear" className="aspect-square rounded-2xl bg-white object-cover" />
            <p className="hint col-span-2 text-center">Así queda: tu foto → lámina para colorear (ejemplo real).</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <div className="card p-4">
              <div className="relative mx-auto max-w-md">
                <PreviewImg key={previewUrl(active)} src={previewUrl(active)} alt={`Lámina para colorear de la página ${active + 1}`} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={origUrl(data.pages[active].photoId, 500)} alt="Foto original" className="absolute bottom-3 left-3 w-1/3 rotate-[-4deg] rounded-xl border-4 border-white shadow-lg" />
              </div>
              <p className="label mt-4">¿Más o menos detalle?</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(STYLE_INFO) as Style[]).map((s) => (
                  <button key={s} type="button" className="chip" disabled={paid} aria-pressed={pageStyle(active) === s} onClick={() => update({ pages: data.pages.map((p, j) => (j === active ? { ...p, style: s } : p)) })}>
                    {STYLE_INFO[s].name}
                  </button>
                ))}
              </div>
              <p className="hint mt-2">Muestra gratuita con marca de agua. El libro final va en alta calidad (A4, 300 ppp) y sin marca.</p>
            </div>
            {!paid && <Rating projectId={project.id} token={token} />}
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-display text-xl font-bold">Tu libro · {data.pages.length} {data.pages.length === 1 ? "página" : "páginas"} <span className="hint font-sans font-normal">(hasta {MAX_PAGES})</span></h2>
              <ul className="mt-3 grid grid-cols-4 gap-2">
                {data.pages.map((pg, i) => (
                  <li key={pg.photoId} className="relative">
                    <button type="button" onClick={() => setActive(i)} className={`block w-full overflow-hidden rounded-xl border-[3px] ${active === i ? "border-mint" : "border-transparent"}`} aria-label={`Ver página ${i + 1}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={origUrl(pg.photoId)} alt="" className="aspect-square w-full object-cover" />
                    </button>
                    {!paid && (
                      <button type="button" aria-label={`Quitar página ${i + 1}`} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink text-xs text-white" onClick={() => removePage(i)}>✕</button>
                    )}
                  </li>
                ))}
                {!paid && data.pages.length < MAX_PAGES && (
                  <li>
                    <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading > 0} className="grid aspect-square w-full place-items-center rounded-xl border-2 border-dashed border-ink/30 bg-shell text-center text-xs font-bold">
                      {uploading ? "…" : <span><span className="block text-2xl">+</span>Foto</span>}
                    </button>
                  </li>
                )}
              </ul>
              <div className="mt-4">
                <label className="label" htmlFor="title">Título de la portada (opcional)</label>
                <input id="title" className="field" maxLength={50} disabled={paid} value={data.title} placeholder="Las aventuras de Simba" onChange={(e) => update({ title: e.target.value })} />
              </div>
              <details className="mt-4 group">
                <summary className="cursor-pointer list-none text-sm font-bold underline">Más opciones (dedicatoria, estilo de todo el libro)</summary>
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="label" htmlFor="ded">Dedicatoria en la portada</label>
                    <input id="ded" className="field" maxLength={120} disabled={paid} value={data.dedication} placeholder="Para Leo, con mucho cariño" onChange={(e) => update({ dedication: e.target.value })} />
                  </div>
                  <div>
                    <span className="label">Estilo para todas las páginas</span>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(Object.keys(STYLE_INFO) as Style[]).map((s) => (
                        <button key={s} type="button" disabled={paid} aria-pressed={data.style === s} onClick={() => update({ style: s, pages: data.pages.map((p) => ({ photoId: p.photoId })) })} className={`rounded-2xl border-2 p-3 text-left ${data.style === s ? "border-ink bg-mint/10" : "border-line bg-white"}`}>
                          <span className="block font-bold">{STYLE_INFO[s].name}</span>
                          <span className="hint">{STYLE_INFO[s].text}</span>
                        </button>
                      ))}
                    </div>
                    {!aiConfigured && <p className="hint mt-2">El estilo «ilustración con IA» aún no está disponible.</p>}
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {!paid && data.pages.length > 0 && (
        <div className="mx-auto mt-10 max-w-3xl">
          <UnlockPanel product="coloring" projectId={project?.id ?? null} token={token} beforePay={flushSave} disabledReason={uploading ? "Espera a que terminen de subirse las fotos." : data.pages.length ? undefined : "Añade al menos una foto para poder comprar el libro."} />
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
