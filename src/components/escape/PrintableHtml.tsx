import type { Printable } from "@/lib/escape/generator";

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function Shape({ shape, x, y, r, rot }: { shape: string; x: number; y: number; r: number; rot: number }) {
  const t = `rotate(${rot} ${x} ${y})`;
  const common = { stroke: "currentColor", strokeWidth: 0.9, fill: "none" };
  if (shape === "circle") return <circle cx={x} cy={y} r={r * 0.8} {...common} />;
  if (shape === "triangle") return <polygon transform={t} points={`${x},${y - r} ${x + r * 0.9},${y + r * 0.7} ${x - r * 0.9},${y + r * 0.7}`} {...common} />;
  if (shape === "heart")
    return (
      <path
        transform={t}
        d={`M ${x} ${y + r * 0.8} C ${x - r * 1.4} ${y - r * 0.2}, ${x - r * 0.6} ${y - r * 1.2}, ${x} ${y - r * 0.4} C ${x + r * 0.6} ${y - r * 1.2}, ${x + r * 1.4} ${y - r * 0.2}, ${x} ${y + r * 0.8} Z`}
        {...common}
      />
    );
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  }).join(" ");
  return <polygon transform={t} points={pts} {...common} />;
}

/** Versión en pantalla de los materiales imprimibles de cada acertijo. */
export function PrintableHtml({ p }: { p: Printable }) {
  switch (p.type) {
    case "text":
      return (
        <div className="rounded-2xl bg-violet/10 p-5 text-center">
          {p.lines.map((l, i) => (
            <p key={i} className="font-display text-xl sm:text-2xl leading-snug">{l}</p>
          ))}
          {p.big && <p className="mt-2 font-bold text-violet">{p.big}</p>}
        </div>
      );
    case "cipher":
      return (
        <div>
          <p className="rounded-2xl bg-violet/10 p-5 text-center text-2xl sm:text-3xl font-black tracking-[0.25em] break-words">{p.encoded}</p>
          {p.table && (
            <div className="mt-3 grid grid-cols-13 overflow-hidden rounded-xl border-2 border-ink text-center text-sm" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
              {ABC.split("").map((c, i) => (
                <div key={c} className="border-ink/30 py-1 [&:not(:nth-child(13n))]:border-r [&:nth-child(-n+13)]:border-b">
                  <b>{c}</b>
                  {p.mode === "numbers" && <span className="block text-[10px] text-ink-soft">{i + 1}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case "sequence":
      return (
        <div className="flex flex-wrap justify-center gap-2">
          {p.terms.map((t, i) => (
            <span key={i} className={`grid size-14 place-items-center rounded-full border-2 text-xl font-black ${t === "?" ? "border-violet text-violet" : "border-ink"}`}>{String(t)}</span>
          ))}
        </div>
      );
    case "lock":
      return (
        <ul className="space-y-2">
          {p.clues.map((c, i) => (
            <li key={i} className="rounded-xl bg-violet/10 p-3 font-semibold">{c}</li>
          ))}
        </ul>
      );
    case "logic":
      return (
        <div>
          <ul className="list-disc space-y-1 pl-5">
            {p.statements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p className="mt-2 font-bold text-violet">{p.question}</p>
        </div>
      );
    case "wordsearch":
      return (
        <div>
          <div className="mx-auto grid w-fit rounded-xl border-2 border-ink p-1 font-mono text-sm font-bold sm:text-base" style={{ gridTemplateColumns: `repeat(${p.grid.length}, 1.7em)` }}>
            {p.grid.flat().map((c, i) => (
              <span key={i} className="grid h-[1.7em] place-items-center">{c}</span>
            ))}
          </div>
          <p className="mt-2 text-center text-sm font-semibold">{p.words.join(" · ")}</p>
        </div>
      );
    case "maze": {
      const c = 10;
      const W = p.w * c, H = p.h * c;
      return (
        <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} className="mx-auto w-full max-w-sm" role="img" aria-label="Laberinto">
          {p.walls.map((wb, i) => {
            const x = (i % p.w) * c, y = Math.floor(i / p.w) * c;
            return (
              <g key={i} stroke="currentColor" strokeWidth={0.8} strokeLinecap="round">
                {wb & 1 && i !== p.start ? <line x1={x} y1={y} x2={x + c} y2={y} /> : null}
                {wb & 8 ? <line x1={x} y1={y} x2={x} y2={y + c} /> : null}
                {wb & 4 && i !== p.end ? <line x1={x} y1={y + c} x2={x + c} y2={y + c} /> : null}
                {wb & 2 ? <line x1={x + c} y1={y} x2={x + c} y2={y + c} /> : null}
              </g>
            );
          })}
          {Object.entries(p.letters).map(([k, l]) => {
            const i = Number(k);
            return (
              <text key={k} x={(i % p.w) * c + c / 2} y={Math.floor(i / p.w) * c + c * 0.7} fontSize={c * 0.55} textAnchor="middle" fontWeight={800} fill="currentColor">
                {l}
              </text>
            );
          })}
        </svg>
      );
    }
    case "shapes":
      return (
        <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-sm text-ink" role="img" aria-label="Figuras para contar">
          {p.items.map((it, i) => (
            <Shape key={i} {...it} />
          ))}
        </svg>
      );
  }
}
