# Costes y configuración pendiente

> Precios de terceros orientativos a noviembre de 2026, tomados de sus tarifas públicas conocidas. **Compruébalos en cada web antes de contratar**; cambian con frecuencia.

## Costes fijos mensuales

| Servicio | Para qué | Plan mínimo para vender | Coste aprox. |
|---|---|---|---|
| Vercel | Web y funciones | Pro (Hobby no permite uso comercial) | 20 USD/mes por miembro |
| Supabase | Base de datos y fotos privadas | Free sirve para empezar, pero pausa el proyecto tras una semana sin actividad; Pro recomendado al lanzar | 0 → 25 USD/mes |
| Resend | Correos de compra | Free: 3.000 correos/mes y 100/día | 0 € al principio |
| Dominio `.es` / `.com` | Marca | Registro anual | 10–15 €/año |
| Stripe | Pagos | Sin cuota fija | 0 € |

Mínimo realista para lanzar: **unos 20–45 USD/mes + dominio**.

## Costes variables por venta

| Concepto | Periódico 6,99 € | Escape room 9,99 € | Colorear 7,99 € | Pack 19,99 € |
|---|---|---|---|---|
| IVA (21 %, incluido en el precio) | 1,21 € | 1,73 € | 1,39 € | 3,47 € |
| Comisión Stripe, tarjeta europea estándar (1,5 % + 0,25 €) | 0,35 € | 0,40 € | 0,37 € | 0,55 € |
| Cómputo y almacenamiento (estimado) | ~0,002 € | ~0,002 € | ~0,01 € | ~0,014 € |
| **Neto aprox. por venta** | **~5,43 €** | **~7,86 €** | **~6,22 €** | **~15,96 €** |

- Las tarjetas de fuera del EEE y algunos métodos tienen comisiones mayores (consulta stripe.com/es/pricing).
- El IVA depende del régimen fiscal del titular y del país del comprador (ventanilla única OSS para ventas a otros países de la UE). Confírmalo con la asesoría.

## Coste de las pruebas gratuitas

Todo se genera con plantillas y algoritmos propios, **sin APIs de pago**: el coste de cada prueba es solo cómputo (milésimas de euro). Aun así hay topes configurables por variables de entorno:

| Límite | Por defecto |
|---|---|
| Proyectos nuevos por IP y día | 25 |
| Fotos subidas por IP y día | 40 |
| Vistas previas de colorear por IP y día | 20 |
| Demos de escape room por IP y día | 30 |
| Tope global de generaciones gratuitas al día | 3.000 |
| Tamaño máximo de foto | 10 MB |

El uso se ve en `/admin/pruebas`.

## IA de imágenes (no activada)

El estilo "ilustración" del libro para colorear necesitaría una API de generación de imágenes de pago (del orden de 0,02–0,08 € por imagen según proveedor). **No está conectada** y la web lo muestra como "próximamente". Solo se activará con tu autorización, fijando `IMAGE_AI_PROVIDER` e `IMAGE_AI_API_KEY` y un tope de gasto.

## Qué falta para el lanzamiento comercial

| # | Pendiente | Quién | Notas |
|---|---|---|---|
| 1 | Cuenta de Stripe, claves `sk_test_` y webhook | Propietario | Ver DEPLOY.md §2. Hasta entonces solo funciona el pago simulado en local. |
| 2 | Probar una compra con Stripe en modo prueba de extremo a extremo | Propietario + desarrollo | El código del webhook está probado con firmas generadas localmente, no contra Stripe real. |
| 3 | Proyecto Supabase con `schema.sql` | Propietario | El driver de Supabase no se ha probado contra un proyecto real. |
| 4 | Despliegue en Vercel (plan Pro) | Propietario | |
| 5 | Comprobación de marca y compra del dominio | Propietario | Ver MARCA.md: no se pudo verificar desde aquí. |
| 6 | Resend con dominio verificado | Propietario | Sin él no se envían correos (el enlace de descarga sí funciona). |
| 7 | Revisión legal de los textos | Abogado/asesoría (opcional) | Los textos legales siguen el mismo formato que oposaprueba.com (titular REGALUMO, correo y web). Si se quiere cumplir el art. 10 LSSI al completo, faltaría añadir nombre o razón social, NIF y domicilio en `src/content/legal.tsx`. |
| 8 | Régimen de IVA y facturación | Asesoría | Stripe puede emitir recibos; las facturas completas requieren configuración adicional. |
| 9 | Verificación de Stripe para cobros reales y `ALLOW_LIVE_PAYMENTS=true` | Propietario | Solo con autorización expresa. |
| 10 | Google Search Console y Bing Webmaster | Propietario | Ver SEO.md. |
| 11 | IA de imágenes (opcional) | Propietario | Requiere autorización de gasto. |

## Limitaciones conocidas

- El libro para colorear funciona muy bien con fotos de contraste claro (personas, objetos, paisajes); con pelaje o texturas muy finas el dibujo sale más abstracto. La vista previa gratuita permite verlo antes de pagar.
- El escape room usa acertijos generados con plantillas y un banco propio: son originales pero menos "literarios" que un texto escrito a mano.
