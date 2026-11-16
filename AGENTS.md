<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## REGALUMO

- Idioma de la interfaz, textos y commits: español.
- Pagos: solo Stripe en modo prueba. Nunca activar `ALLOW_LIVE_PAYMENTS` ni usar claves `sk_live_` ni APIs de pago sin autorización del propietario.
- Desarrollo local: `.env.local` con `PAYMENTS_MODE=mock`; datos en `.data/`.
- Antes de entregar: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`.
- Estructura y cómo añadir un producto: `docs/ARQUITECTURA.md`.
