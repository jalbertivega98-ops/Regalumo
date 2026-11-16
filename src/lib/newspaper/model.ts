import { z } from "zod";

/**
 * Modelo del periódico personalizado. Es puro (sin dependencias de servidor)
 * para que el editor en el navegador y el generador de PDF compartan las mismas reglas.
 *
 * Regla editorial: nunca se inventan datos biográficos. Los textos sugeridos son
 * neutrales y solo usan lo que la persona introduce; todo es editable.
 */
export const TEMPLATES = {
  clasico: { name: "Clásico", description: "Cabecera gótica, blanco y negro, aire de diario histórico." },
  moderno: { name: "Moderno", description: "Tipografía editorial, color y mucho aire." },
  vintage: { name: "Vintage", description: "Papel envejecido, tono sepia y adornos." },
} as const;
export type TemplateId = keyof typeof TEMPLATES;

export const OCCASIONS = {
  cumpleanos: "Cumpleaños",
  boda: "Boda",
  aniversario: "Aniversario",
  jubilacion: "Jubilación",
  nacimiento: "Nacimiento",
  graduacion: "Graduación",
  despedida: "Despedida",
  otro: "Otra celebración",
} as const;
export type OccasionId = keyof typeof OCCASIONS;

export const LIMITS = {
  honoree: 60,
  paperName: 40,
  place: 40,
  age: 3,
  headline: 90,
  subheadline: 160,
  lead: 1100,
  caption: 90,
  anecdoteTitle: 60,
  anecdoteText: 480,
  from: 40,
  message: 240,
  quote: 160,
  dateLabel: 60,
  signoff: 80,
  anecdotes: 3,
  messages: 6,
  dates: 4,
  photos: 4,
};

const str = (max: number) => z.string().max(max).default("");

export const newspaperSchema = z.object({
  template: z.enum(["clasico", "moderno", "vintage"]).default("clasico"),
  occasion: z.enum(Object.keys(OCCASIONS) as [OccasionId, ...OccasionId[]]).default("cumpleanos"),
  honoree: str(LIMITS.honoree),
  paperName: str(LIMITS.paperName),
  editionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default(""),
  place: str(LIMITS.place),
  age: z.string().regex(/^\d{0,3}$/).default(""),
  headline: str(LIMITS.headline),
  subheadline: str(LIMITS.subheadline),
  lead: str(LIMITS.lead),
  quote: str(LIMITS.quote),
  signoff: str(LIMITS.signoff),
  photos: z
    .array(z.object({ id: z.string().max(40), caption: str(LIMITS.caption) }))
    .max(LIMITS.photos)
    .default([]),
  anecdotes: z
    .array(z.object({ title: str(LIMITS.anecdoteTitle), text: str(LIMITS.anecdoteText) }))
    .max(LIMITS.anecdotes)
    .default([]),
  messages: z
    .array(z.object({ from: str(LIMITS.from), text: str(LIMITS.message) }))
    .max(LIMITS.messages)
    .default([]),
  dates: z
    .array(z.object({ date: z.string().max(20).default(""), label: str(LIMITS.dateLabel) }))
    .max(LIMITS.dates)
    .default([]),
});

export type NewspaperData = z.infer<typeof newspaperSchema>;

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "";
}

/** Textos sugeridos neutrales según la ocasión. Solo usan datos introducidos. */
export function suggestions(d: Pick<NewspaperData, "occasion" | "honoree" | "age">) {
  const n = d.honoree.trim() || "Nuestra persona favorita";
  const f = firstName(d.honoree) || "nuestra protagonista";
  const age = d.age ? Number(d.age) : 0;
  const map: Record<OccasionId, { headline: string; sub: string; lead: string }> = {
    cumpleanos: {
      headline: age ? `¡${f} cumple ${age} años!` : `¡Feliz cumpleaños, ${f}!`,
      sub: `Edición especial dedicada a ${n} en un día para celebrar.`,
      lead: `Esta edición especial se ha preparado para celebrar el cumpleaños de ${n}. En sus páginas se reúnen los recuerdos, las anécdotas y los mensajes de quienes han querido sumarse a la fiesta. Todo lo que aparece aquí lo han escrito las personas que más le quieren.`,
    },
    boda: {
      headline: `¡${f} se casa!`,
      sub: `Crónica especial de un día para recordar.`,
      lead: `Esta portada recoge la celebración de la boda de ${n}. Familiares y amistades han querido dejar aquí sus recuerdos y sus mejores deseos para la nueva etapa que comienza.`,
    },
    aniversario: {
      headline: `${n}: un aniversario de portada`,
      sub: `Edición conmemorativa con recuerdos y mensajes.`,
      lead: `Hoy celebramos un aniversario muy especial. Esta edición reúne momentos compartidos y mensajes de quienes han acompañado a ${n} durante este tiempo.`,
    },
    jubilacion: {
      headline: `${f} inicia su nueva etapa`,
      sub: `Edición especial con motivo de su jubilación.`,
      lead: `Después de muchos años de trabajo llega el momento de celebrar. Compañeros, familia y amistades se despiden de una etapa y dan la bienvenida a la siguiente junto a ${n}.`,
    },
    nacimiento: {
      headline: `¡Ya está aquí, ${f}!`,
      sub: `Edición especial para celebrar una llegada muy esperada.`,
      lead: `La familia tiene una noticia que no cabe en una sola página: ha llegado ${n}. Esta portada recoge la alegría y los mensajes de quienes ya le esperaban.`,
    },
    graduacion: {
      headline: `${f}, ¡objetivo cumplido!`,
      sub: `Edición especial por su graduación.`,
      lead: `El esfuerzo tiene recompensa. Esta portada celebra la graduación de ${n} con los recuerdos y las felicitaciones de quienes le han acompañado en el camino.`,
    },
    despedida: {
      headline: `Hasta pronto, ${f}`,
      sub: `Edición especial de despedida.`,
      lead: `Las despedidas también se celebran. En estas páginas, quienes han compartido tiempo con ${n} le dejan sus recuerdos y sus mejores deseos para lo que viene.`,
    },
    otro: {
      headline: `${n}, noticia del día`,
      sub: `Edición especial para una ocasión única.`,
      lead: `Esta edición especial está dedicada a ${n}. Aquí se reúnen recuerdos y mensajes de quienes han querido hacerle un regalo diferente.`,
    },
  };
  return map[d.occasion];
}

export function emptyNewspaper(): NewspaperData {
  return newspaperSchema.parse({});
}

/** Datos de ejemplo, claramente ficticios, para la página principal y la demo. */
export function demoNewspaper(): NewspaperData {
  return newspaperSchema.parse({
    template: "clasico",
    occasion: "cumpleanos",
    honoree: "Marta Ruiz",
    paperName: "El Diario de Marta",
    editionDate: "2026-06-14",
    place: "Valencia",
    age: "40",
    headline: "¡Marta cumple 40 años!",
    subheadline: "Edición especial dedicada a Marta Ruiz en un día para celebrar.",
    lead: "Esta edición especial se ha preparado para celebrar el cumpleaños de Marta. En sus páginas se reúnen los recuerdos, las anécdotas y los mensajes de quienes han querido sumarse a la fiesta.",
    quote: "La mejor fiesta es la que se comparte.",
    signoff: "Con cariño, tu familia",
    anecdotes: [
      { title: "El viaje de la tienda de campaña", text: "Aquel verano en el que la tienda salió volando y acabamos durmiendo en el coche, muertos de risa." },
      { title: "La tarta imposible", text: "Tres intentos, una cocina llena de harina y la mejor tarta que hemos probado." },
    ],
    messages: [
      { from: "Lucía", text: "¡Por muchos años más de risas juntas!" },
      { from: "Papá y mamá", text: "Estamos orgullosísimos de ti." },
      { from: "Equipo del trabajo", text: "Gracias por hacer los lunes más fáciles." },
    ],
    dates: [
      { date: "2010", label: "Primer viaje juntas" },
      { date: "2019", label: "Llega Simba a casa" },
    ],
  });
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function longDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[dt.getUTCDay()]}, ${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** Composición final: rellena huecos con sugerencias neutrales. */
export function compose(d: NewspaperData) {
  const s = suggestions(d);
  const f = firstName(d.honoree);
  return {
    template: d.template,
    paperName: d.paperName.trim() || (f ? `El Diario de ${f}` : "El Diario de Hoy"),
    dateLine: longDate(d.editionDate),
    place: d.place.trim(),
    edition: d.age ? `Edición especial nº ${d.age}` : "Edición especial",
    headline: d.headline.trim() || s.headline,
    subheadline: d.subheadline.trim() || s.sub,
    lead: d.lead.trim() || s.lead,
    quote: d.quote.trim(),
    signoff: d.signoff.trim(),
    photos: d.photos,
    anecdotes: d.anecdotes.filter((a) => a.title.trim() || a.text.trim()),
    messages: d.messages.filter((m) => m.text.trim()),
    dates: d.dates.filter((x) => x.label.trim() || x.date.trim()),
    occasion: OCCASIONS[d.occasion],
  };
}
export type Composed = ReturnType<typeof compose>;

/** Tamaño de titular adaptado a su longitud (pt sobre A3). */
export function headlineSize(text: string) {
  const l = text.length;
  if (l <= 22) return 66;
  if (l <= 34) return 54;
  if (l <= 50) return 44;
  if (l <= 70) return 36;
  return 30;
}
