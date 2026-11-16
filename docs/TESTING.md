# Pruebas

```bash
npm test            # unitarias (vitest)
npm run test:e2e    # navegador (Playwright), arranca su propio servidor en :3100 con pagos simulados
npm run lint && npm run typecheck && npm run build
```

Las pruebas e2e usan `PAYMENTS_MODE=mock` y un almacén aparte (`.data-e2e`), así que no tocan datos reales ni necesitan claves.

## Unitarias (15 pruebas)

| Archivo | Qué comprueba |
|---|---|
| `tests/unit/escape.test.ts` | Las 288 combinaciones de edad × temática × dificultad × duración generan un juego completo y **resoluble**: cada respuesta es correcta según su propio acertijo (cifrados, laberintos con solución, sopas de letras que contienen las palabras, secuencias, figuras contadas…), las letras premio forman la palabra final, el resultado es determinista y la demo tiene 3 retos. |
| `tests/unit/pdf.test.ts` | El PDF del escape room se genera para cada temática; el periódico cabe en **una sola página** con las tres plantillas, incluso con todos los textos al máximo. `PDF_OUT_DIR=/ruta npm test` guarda los PDF para revisarlos. |
| `tests/unit/payments.test.ts` | Tokens firmados (propósito, manipulación, caducidad). Límites por IP. `fulfillOrder` es idempotente, rechaza importe o moneda distintos y pagos en modo real sin autorización. Webhook de Stripe: firma no válida → 400 sin tocar el pedido; firma válida → pedido y proyecto pagados; reenvío → sin efectos; importe incorrecto → 500 y pedido fallido. |

## Navegador (26 pruebas)

| Archivo | Qué comprueba |
|---|---|
| `tests/e2e/productos.spec.ts` | **Periódico**: crear con datos propios, subir foto, valorar, pagar (simulado), descargar PDF. **Escape room**: demo con pista, respuesta incorrecta, solución, siguiente reto, compra y PDF. **Colorear**: dos fotos, láminas de vista previa, compra y PDF. Un pedido no se puede consultar sin su enlace firmado. |
| `tests/e2e/sitio.spec.ts` | Portada con eslogan, precios y datos estructurados. Las 8 páginas SEO responden 200 con un único H1, canonical propio, Open Graph, BreadcrumbList y sin `noindex`. Sitemap con las públicas y sin rutas privadas; `robots.txt` bloquea API y pedidos. Editores con `noindex` (cabecera y meta). Fotos no accesibles sin token. Panel protegido por contraseña. |
| `tests/e2e/movil.spec.ts` | 9 páginas en un móvil (Pixel 7) sin desplazamiento horizontal. |

## Resultados (16/11/2026)

- `npm test`: **15/15** correctas.
- `npm run test:e2e`: **26/26** correctas.
- `npm run build`: correcta. `tsc --noEmit`: sin errores. `npm run lint`: sin errores; 3 avisos intencionados (recargas completas de página tras el pago y el inicio de sesión en el panel).

Además, se revisaron a mano capturas en escritorio y en móvil (390 px) de la portada, los tres editores y las páginas SEO, y los PDF finales de los tres productos.

## Lo que NO está probado

- Pago real con Stripe (ni en modo prueba): requiere claves. El webhook está probado con eventos firmados localmente con la librería oficial de Stripe.
- Driver de Supabase contra un proyecto real.
- Envío de correos con Resend.
- Rendimiento con mucho tráfico simultáneo.
