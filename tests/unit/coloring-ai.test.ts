import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import sharp from "sharp";

const photo = readFileSync("assets/samples/chelsea.png");

async function load() {
  vi.resetModules();
  return import("@/lib/coloring/ai");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("láminas con IA", () => {
  it("sin clave usa el método propio y no llama a ninguna API", async () => {
    vi.stubEnv("IMAGE_AI_PROVIDER", "");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const { sheet, aiEnabled } = await load();
    expect(aiEnabled()).toBe(false);
    const r = await sheet("p1", "a", photo, "sencillo", 600);
    expect(r.ai).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it("con clave llama a fal, limpia la imagen a blanco y negro y la guarda para reutilizarla", async () => {
    vi.stubEnv("IMAGE_AI_PROVIDER", "fal");
    vi.stubEnv("IMAGE_AI_API_KEY", "test");
    // Imagen "de la IA": fondo gris claro (como un papel) con una línea gris oscura.
    const fake = await sharp({ create: { width: 512, height: 384, channels: 3, background: "#e6e6e6" } })
      .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><circle cx="256" cy="192" r="120" fill="none" stroke="#333" stroke-width="10"/></svg>') }])
      .png().toBuffer();
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).startsWith("https://fal.run/")) {
        const body = JSON.parse(String(init?.body));
        expect(body.image_urls[0]).toMatch(/^data:image\/jpeg;base64,/);
        expect(body.image_size.width % 16).toBe(0);
        expect((init?.headers as Record<string, string>).Authorization).toBe("Key test");
        return new Response(JSON.stringify({ images: [{ url: "https://cdn.example/x.png" }], has_nsfw_concepts: [false] }));
      }
      return new Response(new Uint8Array(fake));
    });
    vi.stubGlobal("fetch", f);
    const { sheet } = await load();
    const r = await sheet("p-ai", "a", photo, "infantil", 1000);
    expect(r.ai).toBe(true);
    const { data } = await sharp(r.png).raw().toBuffer({ resolveWithObject: true });
    const hist = new Set(data);
    expect(data.filter((v) => v === 255).length / data.length).toBeGreaterThan(0.9); // papel blanco puro
    expect(hist.has(0)).toBe(true); // tinta negra
    // Segunda vez: sale de la copia guardada, sin volver a pagar.
    f.mockClear();
    const r2 = await sheet("p-ai", "a", photo, "infantil", 700);
    expect(r2.ai).toBe(true);
    expect(f).not.toHaveBeenCalled();
  });

  it("si la IA falla, usa el método propio", async () => {
    vi.stubEnv("IMAGE_AI_PROVIDER", "fal");
    vi.stubEnv("IMAGE_AI_API_KEY", "test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    const { sheet } = await load();
    const r = await sheet("p-fail", "a", photo, "sencillo", 600);
    expect(r.ai).toBe(false);
    expect(r.png.subarray(1, 4).toString()).toBe("PNG");
  });
});
