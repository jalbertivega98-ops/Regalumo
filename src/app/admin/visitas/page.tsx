import { statsSince } from "@/lib/analytics";
import { PACK, PRODUCTS, PRODUCT_IDS, formatEur } from "@/lib/products/catalog";
import { pageLabel } from "@/lib/pages";
import { FUNNEL, SOURCES, type FunnelStep, type SourceId } from "@/lib/traffic";
import { config } from "@/lib/config";
import { Stat, Table } from "@/components/admin/ui";
import { ResetStats } from "@/components/admin/AdminForms";

export const metadata = { title: "Visitas y embudo" };

const PERIODS: [number, string][] = [
  [1, "Hoy"],
  [7, "7 días"],
  [30, "30 días"],
  [90, "90 días"],
];

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const fmtPct = (a: number, b: number) => (b ? `${pct(a, b).toLocaleString("es-ES")} %` : "—");

/** Fechas (AAAA-MM-DD, UTC como los contadores) de los últimos `n` días, hoy incluido. */
function lastDays(n: number) {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => new Date(now - (n - 1 - i) * 86400000).toISOString().slice(0, 10));
}

/** Consejo para el paso en el que más gente se va. */
const TIPS: Record<FunnelStep, string> = {
  visit: "",
  open: "Mucha gente entra pero no abre ningún producto: haz más visibles los botones de «Crear» en la portada y en las páginas de entrada, y enseña ejemplos reales arriba del todo.",
  preview: "Abren el producto pero no llegan a ver su muestra: el primer paso del editor (subir la foto o rellenar datos) puede asustar. Prueba a hacerlo aún más corto o con un ejemplo ya relleno.",
  checkout: "Ven su muestra pero no van a pagar: revisa el precio, que el botón de desbloquear se vea bien en el móvil y que quede claro qué reciben (PDF al momento).",
  paid: "Llegan a la pasarela pero no pagan: comprueba que el pago funciona en el móvil, que no haya sorpresas de precio y que se acepten Bizum o Apple Pay/Google Pay si los tienes activados en Stripe.",
};

export default async function Visitas({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const days = Math.min(365, Math.max(1, Number((await searchParams).dias) || 30));
  const { totals, byDay } = await statsSince(days);
  const t = (k: string) => totals[k] ?? 0;

  // El origen y el embudo se empezaron a medir más tarde que las visitas: para que los
  // porcentajes cuadren, el embudo solo usa los días que ya tienen origen.
  const trackedDays = Object.keys(byDay).filter((d) => Object.keys(byDay[d]).some((k) => k.startsWith("src:")));
  const visits = t("session");
  const funnelVisits = trackedDays.reduce((s, d) => s + (byDay[d].session ?? 0), 0);
  const stepCount = (s: FunnelStep) => (s === "visit" ? funnelVisits : t(`f:${s}`));
  const steps = FUNNEL.map(([id, label]) => ({ id, label, n: stepCount(id) }));

  // Paso con más abandono (en proporción al paso anterior), solo si hay datos suficientes.
  let worst: { id: FunnelStep; from: string; to: string; lost: number } | null = null;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].n;
    if (prev < 5) continue;
    const lost = 100 - pct(Math.min(steps[i].n, prev), prev);
    if (!worst || lost > worst.lost) worst = { id: steps[i].id, from: steps[i - 1].label, to: steps[i].label, lost };
  }

  const sources = (Object.keys(SOURCES) as SourceId[])
    .map((s) => ({
      id: s,
      visits: t(`src:${s}`),
      open: t(`fs:${s}:open`),
      preview: t(`fs:${s}:preview`),
      checkout: t(`fs:${s}:checkout`),
      paid: t(`fs:${s}:paid`),
      revenue: t(`rev:${s}`),
    }))
    .filter((r) => r.visits || r.paid)
    .sort((a, b) => b.visits - a.visits || b.paid - a.paid);

  const prefixed = (prefix: string) =>
    Object.entries(totals)
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, v]) => [k.slice(prefix.length), v] as const)
      .sort((a, b) => b[1] - a[1]);
  const pages = prefixed("pv:");
  const landings = prefixed("land:");
  const campaigns = prefixed("camp:").map(([k, v]) => ({ key: k, visits: v, paid: t(`campp:${k}`) }));
  const mobile = t("dev:movil");
  const devices = mobile + t("dev:ordenador");

  const dayList = lastDays(days);
  const maxDay = Math.max(1, ...dayList.map((d) => byDay[d]?.session ?? 0));
  const site = config.siteUrl.replace(/\/$/, "");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-black">Visitas y embudo</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          {PERIODS.map(([d, label]) => (
            <a key={d} href={`/admin/visitas?dias=${d}`} className={`chip ${d === days ? "!bg-ink !text-white" : ""}`}>{label}</a>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Visitas" value={visits} note="Una por pestaña abierta" />
        <Stat label="Páginas vistas" value={t("pageview")} note={visits ? `${(t("pageview") / visits).toFixed(1).replace(".", ",")} por visita` : undefined} />
        <Stat label="Desde el móvil" value={fmtPct(mobile, devices)} note={devices ? `${mobile} de ${devices} visitas` : undefined} />
        <Stat label="Compran" value={fmtPct(t("f:paid"), funnelVisits)} note={`${t("f:paid")} compras de ${funnelVisits} visitas`} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Embudo: dónde se queda la gente</h2>
        {worst && worst.lost > 0 && (
          <div className="card mb-3 border-l-4 !border-l-coral p-4">
            <p className="font-bold">⚠️ Dónde mejorar: el {worst.lost.toLocaleString("es-ES")} % se va entre «{worst.from}» y «{worst.to}».</p>
            <p className="hint mt-1">{TIPS[worst.id]}</p>
          </div>
        )}
        <ol className="card space-y-1 p-4">
          {steps.map((s, i) => {
            const prev = i ? steps[i - 1].n : 0;
            const width = funnelVisits ? Math.max(1, Math.min(100, pct(s.n, funnelVisits))) : 0;
            return (
              <li key={s.id}>
                {i > 0 && (
                  <p className={`py-1 pl-3 text-xs ${worst?.id === s.id ? "font-bold text-coral-dark" : "text-ink-soft"}`}>
                    ↓ {prev ? `${fmtPct(Math.min(s.n, prev), prev)} sigue` : "—"}
                    {prev > s.n ? ` · se van ${prev - s.n}` : ""}
                  </p>
                )}
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{i + 1}. {s.label}</span>
                  <span className="whitespace-nowrap"><b>{s.n}</b> <span className="text-ink-soft">· {fmtPct(s.n, funnelVisits)}</span></span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-shell" title={`${s.label}: ${s.n} (${fmtPct(s.n, funnelVisits)} de las visitas)`}>
                  <div className="h-3 rounded-full bg-violet" style={{ width: `${width}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
        <p className="hint mt-2">
          Cada paso cuenta personas (pestañas), no clics: si alguien sube tres fotos cuenta una vez. Los porcentajes son sobre las visitas del periodo.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Visitas por día</h2>
        <div className="card p-4">
          <div className="flex h-32 items-end gap-[2px]" role="img" aria-label="Visitas por día">
            {dayList.map((d) => {
              const n = byDay[d]?.session ?? 0;
              return (
                <div key={d} className="flex h-full flex-1 items-end" title={`${new Date(d).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}: ${n} visitas`}>
                  <div className="w-full rounded-t bg-violet" style={{ height: `${n ? Math.max(3, (n / maxDay) * 100) : 0}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-ink-soft">
            <span>{new Date(dayList[0]).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
            <span>máx. {maxDay} al día</span>
            <span>hoy</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">De dónde vienen</h2>
        <Table
          head={["Origen", "Visitas", "Pagan", "Conversión", "Ingresos", "Abren producto", "Ven muestra", "Van a pagar"]}
          empty="Todavía no hay visitas con origen registrado."
          rows={sources.map((r) => [
            <b key="n">{SOURCES[r.id]}</b>,
            <span key="v" className="whitespace-nowrap">{r.visits} <span className="text-ink-soft">· {fmtPct(r.visits, funnelVisits)}</span></span>,
            r.paid,
            fmtPct(r.paid, r.visits),
            <span key="r" className="whitespace-nowrap">{r.revenue ? formatEur(r.revenue) : "—"}</span>,
            r.open,
            r.preview,
            r.checkout,
          ])}
        />
        <p className="hint mt-2">
          WhatsApp, Telegram y muchas apps no dicen de dónde viene la visita y salen como «Directo». Para saberlo, comparte enlaces con etiqueta, por ejemplo{" "}
          <code className="break-all rounded bg-shell px-1">{site}/?utm_source=whatsapp&amp;utm_campaign=navidad</code>. Valen <code>utm_source</code> = whatsapp, tiktok, pinterest, facebook, instagram, email…
        </p>
      </section>

      {campaigns.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Campañas (enlaces con utm_campaign)</h2>
          <Table
            head={["Origen", "Campaña", "Visitas", "Compras", "Conversión"]}
            rows={campaigns.map((c) => {
              const [src, name] = c.key.split("|");
              return [SOURCES[src as SourceId] ?? src, name, c.visits, c.paid, fmtPct(c.paid, c.visits)];
            })}
          />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-xl font-bold">Páginas más vistas</h2>
          <Table head={["Página", "Vistas"]} rows={pages.slice(0, 15).map(([k, v]) => [pageLabel(k), v])} />
        </div>
        <div>
          <h2 className="mb-3 font-display text-xl font-bold">Por dónde entran</h2>
          <Table head={["Primera página", "Visitas"]} rows={landings.slice(0, 15).map(([k, v]) => [pageLabel(k), v])} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Embudo por producto</h2>
        <Table
          head={["Producto", "Abren", "Suben foto", "Ven muestra", "Van a pagar", "Pagan", "De abrir a pagar"]}
          rows={[
            ...PRODUCT_IDS.map((p) => [
              PRODUCTS[p].name,
              t(`f:open:${p}`),
              p === "escape" ? "—" : t(`f:upload:${p}`),
              t(`f:preview:${p}`),
              t(`f:checkout:${p}`),
              t(`f:paid:${p}`),
              fmtPct(t(`f:paid:${p}`), t(`f:open:${p}`)),
            ]),
            [PACK.name, "—", "—", "—", "—", t("f:paid:pack"), "—"],
          ]}
        />
        <p className="hint mt-2">«Van a pagar» se cuenta en el producto desde el que se pulsó el botón, también si eligieron el pack.</p>
      </section>

      <p className="hint">
        Tus propias visitas no cuentan: en cada móvil u ordenador donde abras este panel, la web deja de contarte desde ese momento.
      </p>

      <ResetStats />

      <p className="hint">
        Estadísticas propias sin cookies ni datos personales: solo se guardan sumas por día (origen, página y paso). No se guarda la IP ni de qué web exacta viene nadie, así que no hace falta banner de cookies. El origen y el embudo se miden desde que se activó esta página; las visitas anteriores solo tienen el total.
      </p>
    </div>
  );
}
