# Conectar el dominio propio (paso a paso)

Para hacer el día que compres el dominio. Ejemplo con `regalumo.com`; cambia el nombre si compras otro.

**Antes de pagar el dominio:** la disponibilidad y los posibles conflictos de marca **no se han podido verificar** desde aquí. Busca "regalumo" en el registrador, en <https://www.tmdn.org/tmview> (marcas UE y España) y en Google. Si sale una marca parecida de regalos o papelería, consúltalo antes de comprar.

## 1. Vercel (5 minutos)
1. Proyecto **regalumo-6oku** → Settings → Domains → Add → escribe `regalumo.com` y acepta también `www.regalumo.com`.
2. Vercel te muestra los registros DNS (normalmente un `A` a `76.76.21.21` y un `CNAME` `www` a `cname.vercel-dns.com`). Ponlos en el panel DNS del registrador donde compraste el dominio.
3. Espera a que salga "Valid Configuration" (de minutos a unas horas).

## 2. Variables de entorno
Vercel → Settings → Environment Variables → `NEXT_PUBLIC_SITE_URL` = `https://regalumo.com` (solo Production). Después **Deployments → Redeploy**.

## 3. Stripe (modo real)
1. Developers → Webhooks → tu endpoint → editar la URL a `https://regalumo.com/api/webhooks/stripe`. El secreto `whsec_` no cambia.
2. Settings → Business → Public details: sitio web `https://regalumo.com`.

## 4. Correos de compra (Resend, gratis hasta 3.000/mes)
1. Cuenta en <https://resend.com> → Domains → Add `regalumo.com` → copia los registros DNS (SPF, DKIM) en el registrador.
2. Cuando aparezca "Verified": API Keys → crear clave → en Vercel añade `RESEND_API_KEY` y `EMAIL_FROM` = `REGALUMO <pedidos@regalumo.com>` → Redeploy.
3. A partir de ahí la web promete y envía el enlace por correo automáticamente.

## 5. Google
1. <https://search.google.com/search-console> → añadir propiedad de dominio → registro TXT en el DNS.
2. Sitemaps → enviar `https://regalumo.com/sitemap.xml`.

## 6. Comprobación final
- `https://regalumo.com/api/health` → todo "ok" y `pagos: stripe-live`.
- `https://regalumo.com/sitemap.xml` muestra regalumo.com en las URLs.
- Haz una compra real pequeña y reembólsala desde Stripe.
