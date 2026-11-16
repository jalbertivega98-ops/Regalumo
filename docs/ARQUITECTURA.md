# Arquitectura

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · zod · Stripe Checkout · Supabase (Postgres + Storage privado) · @react-pdf/renderer (PDF vectoriales) · sharp (imágenes). Todo gratuito y de código abierto salvo los servicios externos, que tienen plan gratuito o de prueba.

## Piezas comunes

| Carpeta | Responsabilidad |
|---|---|
| `src/lib/products/catalog.ts` | Catálogo: nombre, precio por defecto, rutas, qué incluye la prueba y la compra, coste estimado. |
| `src/lib/products/schemas.ts` · `generators.ts` | Validación de datos y generador del PDF final de cada producto. |
| `src/lib/store/` | Almacén de documentos y archivos con dos drivers: local (`.data/`, desarrollo) y Supabase (producción). |
| `src/lib/projects.ts` | Proyectos anónimos: cada uno tiene un token aleatorio que se guarda solo en el navegador; el servidor guarda su hash. |
| `src/lib/security/` | Tokens firmados (HMAC), límites por IP anonimizada (hash con sal diaria) y limpieza de texto. |
| `src/lib/payments/orders.ts` | Presupuesto, Stripe Checkout, cumplimiento idempotente del pedido y canje de packs. |
| `src/app/api/webhooks/stripe` | Única fuente de verdad del pago (firma verificada, importe, moneda y modo comprobados). |
| `src/lib/analytics.ts` | Contadores agregados por día, sin cookies ni datos personales. |
| `src/app/admin` | Panel: ventas, pedidos, clientes, productos y precios, promociones, uso de pruebas, errores, solicitudes de privacidad y correos. |

## Flujo de compra

1. Prueba gratuita → proyecto `draft` (sin registro).
2. Botón de desbloqueo → `/api/checkout` crea un pedido `pending` y una sesión de Stripe Checkout (o el pago simulado en desarrollo). Antes de pagar se pide el consentimiento para el suministro inmediato del contenido digital.
3. Stripe llama al webhook → `fulfillOrder` comprueba importe, moneda y modo, marca pedido y proyecto como pagados y envía el correo con el enlace firmado.
4. `/pedido/[id]?k=…` → descarga `/api/download/...`, que genera el PDF final solo si el pedido está pagado y el enlace es válido (30 días).

## Añadir un producto nuevo

1. Añadir la entrada en `PRODUCTS` (`catalog.ts`) con su id, precio y textos.
2. Definir su esquema zod en `schemas.ts` y su generador de PDF en `generators.ts`.
3. Crear su editor en `src/app/(site)/crear/<ruta>/page.tsx` reutilizando `UnlockPanel`, `Rating` y `DeleteProject`.
4. Opcional: añadir sus páginas SEO en `src/content/seo.ts` (entran solas en el sitemap).

Pagos, pedidos, descargas, panel, analítica, límites y borrado funcionan sin cambios.

## Privacidad por diseño

- Fotos en almacenamiento privado; solo se sirven con el token del proyecto o el enlace firmado del pedido. Se eliminan los metadatos EXIF al subirlas.
- Editores, pedidos, panel y API llevan `noindex` (cabecera y meta) y están fuera del sitemap y bloqueados en `robots.txt`.
- Borrado: botón en cada editor, formulario de solicitudes de privacidad y borrado automático diario (`/api/cron/cleanup`).
