# Despliegue

Objetivo: tener la web pública en Vercel, con datos en Supabase y pagos de **Stripe en modo prueba**. Nada de esto cobra dinero real: los cobros reales están bloqueados por código hasta que el propietario ponga `ALLOW_LIVE_PAYMENTS=true` y use una clave `sk_live_`.

## 1. Supabase (base de datos y fotos privadas)

1. Crea un proyecto en <https://supabase.com> (región UE, por ejemplo Frankfurt o París).
2. En **SQL Editor**, ejecuta `supabase/schema.sql`. Crea las tablas `documents` y `counters` con RLS activado sin políticas (el navegador no puede leer nada), la función `increment_counter` y el bucket privado `private`.
3. En **Project Settings → API**, copia la URL y la *service role key* (solo se usa en el servidor; nunca la pongas en una variable `NEXT_PUBLIC_`).

## 2. Stripe en modo prueba

1. Crea la cuenta en <https://dashboard.stripe.com> y deja activado **Modo de prueba**.
2. **Developers → API keys** → copia la clave secreta `sk_test_…`.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://TU-DOMINIO/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
   - Copia el *signing secret* `whsec_…`.
4. Prueba con la tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.

En local, sin desplegar:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # imprime un whsec_ para .env.local
```

Los precios se envían a Stripe en cada compra (`price_data`), así que **no hace falta crear productos en Stripe**; se cambian en `/admin/productos`.

## 3. Correo (Resend, opcional pero recomendado)

1. Cuenta en <https://resend.com>, verifica el dominio (registros DNS SPF/DKIM).
2. Crea una API key y define `RESEND_API_KEY` y `EMAIL_FROM`.

Sin clave, los correos no se envían: quedan en `/admin/correos` como "pendiente de configurar" y el comprador sigue teniendo su enlace de descarga en la página del pedido.

## 4. Vercel

1. Importa el repositorio en <https://vercel.com/new>. Framework: Next.js (detectado).
2. Variables de entorno (Production y Preview), ver `.env.example`:
   - Obligatorias: `NEXT_PUBLIC_SITE_URL`, `APP_SECRET` (`openssl rand -base64 48`), `ADMIN_PASSWORD`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (`sk_test_…`), `STRIPE_WEBHOOK_SECRET`.
   - Opcionales: `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, límites `LIMIT_*`.
   - **No pongas** `PAYMENTS_MODE=mock` (se ignora en producción igualmente) ni `ALLOW_LIVE_PAYMENTS=true` sin decisión del propietario.
3. `vercel.json` fija la región `cdg1` (París) y programa el borrado diario `/api/cron/cleanup` a las 03:30 UTC. Vercel envía `CRON_SECRET` como `Bearer` automáticamente.
4. Si la app se despliega en Vercel sin Supabase, se niega a arrancar el almacén (el disco de Vercel no persiste) en lugar de perder datos en silencio.
5. Los despliegues de *Preview* devuelven `Disallow: /` en `robots.txt` para que Google no los indexe.

> Plan: el plan Hobby de Vercel es para uso no comercial. Para vender hace falta el plan Pro (ver costes).

## 5. Dominio

Antes de comprarlo, completa las comprobaciones de [MARCA.md](MARCA.md). Después: añádelo en Vercel → Settings → Domains, actualiza `NEXT_PUBLIC_SITE_URL`, la URL del webhook de Stripe y el dominio de Resend.

## 6. Comprobación tras desplegar

- [ ] `/` carga y `/admin` pide contraseña; la etiqueta de pagos dice **Stripe (modo prueba)** y la de datos **Supabase**.
- [ ] Haz una compra con la tarjeta 4242 y comprueba en `/admin/pedidos` que pasa a *pagado* (lo marca el webhook, no la redirección).
- [ ] En Stripe → Webhooks, el evento aparece con respuesta 200.
- [ ] Llega el correo (si Resend está configurado) y el enlace descarga el PDF.
- [ ] `/sitemap.xml` y `/robots.txt` muestran el dominio correcto.

## 7. Pasar a cobros reales (solo con autorización del propietario)

1. Completar la verificación de la cuenta de Stripe (datos fiscales y bancarios).
2. Revisar los textos legales con un profesional y completar los datos del titular.
3. Crear un webhook nuevo en modo real y sustituir `STRIPE_SECRET_KEY` por `sk_live_…`, `STRIPE_WEBHOOK_SECRET` por el nuevo, y poner `ALLOW_LIVE_PAYMENTS=true`.
4. Hacer una compra real de importe bajo (con un código de promoción) y reembolsarla.
