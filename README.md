# REGALUMO

> Crea algo único. Sorprende a alguien especial.

Plataforma de regalos personalizados descargables. Cada producto tiene una **prueba gratuita real, sin registro ni tarjeta**: la persona introduce sus propios datos, ve el resultado, lo modifica y solo después decide si lo desbloquea.

| Producto | Precio por defecto | Prueba gratuita | Tras el pago |
|---|---|---|---|
| Periódico personalizado | 6,99 € | Portada real editable con sus fotos y textos (con marca de agua) | PDF A3 de alta calidad (texto vectorial), sin marca de agua |
| Escape room personalizado | 9,99 € | Mini aventura jugable de 3 acertijos con pistas y comprobación | PDF con historia, 4–9 acertijos, pistas, soluciones, guía y materiales |
| Libro para colorear con fotos | 7,99 € | Lámina de cada foto a resolución limitada y con marca de agua | PDF con portada, título y hasta 12 láminas a tamaño completo |
| Pack de los tres | 19,99 € | — | Un hueco de cada producto |

Los precios se cambian desde `/admin/productos` sin tocar código.

## Arranque rápido (local)

```bash
npm install
cp .env.example .env.local   # y rellena APP_SECRET y ADMIN_PASSWORD
echo "PAYMENTS_MODE=mock" >> .env.local   # pagos simulados, solo en desarrollo
npm run dev                  # http://localhost:3000
```

Sin Supabase, los datos se guardan en `.data/` (solo desarrollo). Sin Stripe, el modo `mock` permite recorrer la compra completa con un pago simulado que **nunca** se activa en producción.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm test` | Pruebas unitarias (generadores, PDF, pagos, webhook, tokens, límites) |
| `npm run test:e2e` | Pruebas de navegador con pagos simulados (escritorio y móvil) |
| `npm run lint` / `npm run typecheck` | Calidad de código |
| `npm run samples` | Regenera los ejemplos de colorear de la portada |

## Documentación

- [docs/DEPLOY.md](docs/DEPLOY.md): despliegue en Vercel + Supabase + Stripe (modo prueba) + Resend.
- [docs/TESTING.md](docs/TESTING.md): qué se prueba y resultados.
- [docs/COSTES-Y-PENDIENTES.md](docs/COSTES-Y-PENDIENTES.md): costes fijos y variables, y lo que falta para el lanzamiento.
- [docs/SEO.md](docs/SEO.md): páginas SEO, Google Search Console y Bing.
- [docs/MARKETING.md](docs/MARKETING.md): contenidos para TikTok, Instagram y Pinterest.
- [docs/MARCA.md](docs/MARCA.md): comprobaciones de marca y dominio.
- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md): cómo está construido y cómo añadir un producto nuevo.

## Estado

Todo funciona de extremo a extremo con **pagos simulados**. Para cobrar (aunque sea en modo prueba de Stripe) faltan claves y un despliegue; ver [docs/COSTES-Y-PENDIENTES.md](docs/COSTES-Y-PENDIENTES.md). Los cobros reales están bloqueados por código salvo `ALLOW_LIVE_PAYMENTS=true`, que solo debe activar el propietario.
