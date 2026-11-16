export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details key={f.q} className="card group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-lg">
            {f.q}
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-shell transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-ink-soft leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
