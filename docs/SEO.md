# SEO

## Qué está hecho

- **8 páginas de aterrizaje con contenido original** (`src/content/seo.ts`), cada una con título, descripción, H1, secciones, preguntas frecuentes, enlaces internos y llamada a la prueba gratuita:
  - `/escape-room-personalizado`, `/escape-room-para-cumpleanos`, `/escape-room-para-imprimir`
  - `/periodico-personalizado`, `/periodico-de-cumpleanos`
  - `/regalos-personalizados`
  - `/foto-para-colorear`, `/libro-para-colorear-personalizado`
- Metadatos propios, URL canónica, Open Graph y Twitter Card en cada página; imagen OG generada.
- Datos estructurados JSON-LD: `Organization`, `WebSite` y `FAQPage` en la portada; `BreadcrumbList`, `FAQPage` y `Product` con `Offer` (precio real del panel) en las páginas de producto. No hay valoraciones (`AggregateRating`) porque no hay reseñas reales.
- `sitemap.xml` y `robots.txt` automáticos. Los despliegues de prueba de Vercel no se indexan.
- **Nunca se indexa contenido privado**: editores, pedidos, panel, API y fotos llevan `noindex` y están fuera del sitemap; las fotos solo se sirven con token.
- Diseño mobile-first y páginas estáticas (rápidas).

No se puede garantizar ninguna posición en Google. Lo que sí ayuda: contenido útil, enlaces desde redes y otras webs, y tiempo.

## Google Search Console

1. Entra en <https://search.google.com/search-console> con la cuenta de Google del negocio.
2. **Añadir propiedad**:
   - *Dominio* (recomendado): introduce `tudominio.es` y añade el registro TXT que te indique en el DNS de tu registrador. Cubre http/https y www.
   - *Prefijo de URL* (alternativa sin DNS): introduce `https://www.tudominio.es`, elige **Etiqueta HTML**, copia solo el valor de `content="..."` en la variable `GOOGLE_SITE_VERIFICATION` de Vercel, vuelve a desplegar y pulsa **Verificar**.
3. **Enviar el sitemap**: menú *Sitemaps* → escribe `sitemap.xml` → *Enviar*. Debe quedar como "Correcto" y mostrar unas 15 URL.
4. **Solicitar indexación**: pega en la barra superior (*Inspeccionar URL*) la portada y cada página de aterrizaje, y pulsa **Solicitar indexación**. Hay un límite diario: empieza por la portada y las tres páginas principales.
5. Revisa cada semana *Páginas* (errores de indexación), *Rendimiento* (búsquedas reales) y *Experiencia*. Las rutas privadas aparecerán como "Excluida por la etiqueta noindex" o "Bloqueada por robots.txt": es lo esperado.

## Bing Webmaster Tools

1. <https://www.bing.com/webmasters> → puedes **importar desde Search Console** (más rápido) o verificar con la etiqueta meta (`BING_SITE_VERIFICATION`).
2. Envía `https://www.tudominio.es/sitemap.xml`.

## Siguientes pasos de contenido (sin spam)

- Añadir ejemplos reales (con permiso) en cada página cuando haya clientes.
- Una página por ocasión con búsqueda real (jubilación, bodas, comuniones) solo si se puede escribir contenido distinto y útil.
- Pinterest es un buen canal de enlaces para colorear y escape rooms (ver MARKETING.md).
