export function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-black">{value}</p>
      {note && <p className="hint mt-1">{note}</p>}
    </div>
  );
}

export function Table({ head, rows, empty = "Sin datos todavía." }: { head: string[]; rows: React.ReactNode[][]; empty?: string }) {
  if (!rows.length) return <p className="card p-5 text-ink-soft">{empty}</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {r.map((c, j) => <td key={j} className="px-4 py-2.5 align-top">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—");
