# SEO

## Qué está hecho

- **13 páginas de aterrizaje con contenido original** (`src/content/seo.ts`), cada una con título, descripción, H1, secciones, preguntas frecuentes, enlaces internos y llamada a la prueba gratuita:
  - `/escape-room-personalizado`, `/escape-room-para-cumpleanos`, `/escape-room-para-imprimir`
  - `/periodico-personalizado`, `/periodico-de-cumpleanos`, `/regalo-de-aniversario-original`
  - `/regalos-personalizados`, `/regalo-personalizado-con-foto`, `/regalos-de-navidad-personalizados`, `/regalo-de-ultima-hora`
  - `/foto-para-colorear`, `/laminas-para-colorear-con-foto`, `/libro-para-colorear-personalizado`
- La portada y el pie enlazan a todas las guías (sección «Ideas y guías de regalo»), para que Google las encuentre y entienda de qué trata cada una.
- Cada guía tiene su propia **imagen para compartir** (`/og/<página>`, 1200×630) que se ve al pegar el enlace en WhatsApp, Facebook o X. Los metadatos se generan con `src/lib/seo/meta.ts` para que ninguna página pierda la imagen, el nombre del sitio ni el idioma.
- Pruebas automáticas del contenido (`tests/unit/seo.test.ts`): títulos y descripciones con longitud adecuada para Google, sin duplicados y enlaces internos válidos.
- Metadatos propios, URL canónica, Open Graph y Twitter Card en cada página; imagen OG generada.
- Datos estructurados JSON-LD (`src/lib/seo/jsonld.ts`): `Organization` (con contacto), `WebSite` y `FAQPage` en la portada; `WebPage`, `BreadcrumbList`, `FAQPage` y `Product` con `Offer` (precio real del panel, imagen, envío 0 € e inmediato y política de devolución de contenido digital) en las páginas de producto. No hay valoraciones (`AggregateRating`) porque no hay reseñas reales.
- `sitemap.xml` y `robots.txt` automáticos. El sitemap solo lista páginas indexables (no `/crear`, que lleva `noindex`) y su fecha (`CONTENT_UPDATED` en `src/app/sitemap.ts`) solo cambia cuando se revisa el contenido. Los despliegues de prueba de Vercel no se indexan.
- **Nunca se indexa contenido privado**: editores, pedidos, panel, API y fotos llevan `noindex` y están fuera del sitemap; las fotos solo se sirven con token.
- Diseño mobile-first y páginas estáticas (rápidas). La imagen principal de las guías se carga con prioridad (mejor LCP) y hay icono PNG para iPhone y Google (`/apple-icon`).

No se puede garantizar ninguna posición en Google. Lo que sí ayuda: contenido útil, enlaces desde redes y otras webs, y tiempo.

## Google Search Console

1. Entra en <https://search.google.com/search-console> con la cuenta de Google del negocio.
2. **Añadir propiedad**:
   - *Dominio* (recomendado): introduce `regalumo.es` y añade el registro TXT que te indique en DonDominio (panel → Zona DNS). Cubre http/https y www.
   - *Prefijo de URL* (alternativa sin DNS): introduce `https://regalumo.es`, elige **Etiqueta HTML**, copia solo el valor de `content="..."` en la variable `GOOGLE_SITE_VERIFICATION` de Vercel, vuelve a desplegar y pulsa **Verificar**.
3. **Enviar el sitemap**: menú *Sitemaps* → escribe `sitemap.xml` → *Enviar*. Debe quedar como "Correcto" y mostrar unas 18 URL.
4. **Solicitar indexación**: pega en la barra superior (*Inspeccionar URL*) la portada y cada página de aterrizaje, y pulsa **Solicitar indexación**. Hay un límite diario: empieza por la portada y las tres páginas principales.
5. Revisa cada semana *Páginas* (errores de indexación), *Rendimiento* (búsquedas reales) y *Experiencia*. Las rutas privadas aparecerán como "Excluida por la etiqueta noindex" o "Bloqueada por robots.txt": es lo esperado.

## Bing Webmaster Tools

1. <https://www.bing.com/webmasters> → puedes **importar desde Search Console** (más rápido) o verificar con la etiqueta meta (`BING_SITE_VERIFICATION`).
2. Envía `https://regalumo.es/sitemap.xml`.

## Google Business Profile

No aplica por ahora: Google solo admite fichas de empresas que atienden en persona (tienda física o servicio a domicilio). Una tienda solo online no es elegible y la ficha podría suspenderse.

## Siguientes pasos de contenido (sin spam)

- Añadir ejemplos reales (con permiso) en cada página cuando haya clientes.
- Una página por ocasión con búsqueda real (jubilación, bodas, comuniones) solo si se puede escribir contenido distinto y útil.
- Actualizar `CONTENT_UPDATED` en `src/app/sitemap.ts` al cambiar textos de las guías.
- Pinterest es un buen canal de enlaces para colorear y escape rooms (ver MARKETING.md).
