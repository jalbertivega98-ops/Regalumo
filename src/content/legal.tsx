import { config } from "@/lib/config";
import { DOWNLOAD_DAYS } from "@/lib/payments/orders";

/**
 * Textos legales de REGALUMO. Los datos del titular siguen el mismo formato que las
 * páginas legales de oposaprueba.com (mismo titular). Si cambian, se actualizan aquí.
 */
const T = "REGALUMO";
const MAIL = config.contactEmail;
const WEB = "regalumo.es";
const UPDATED = "18 de noviembre de 2026";

function Titular() {
  return (
    <ul>
      <li>Titular: {T}</li>
      <li>Correo electrónico: <a href={`mailto:${MAIL}`}>{MAIL}</a></li>
      <li>Sitio web: {WEB}</li>
    </ul>
  );
}

function Updated() {
  return <p>Última actualización: {UPDATED}.</p>;
}

export const LEGAL: Record<string, { title: string; description: string; body: React.ReactNode }> = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Información del titular del sitio web REGALUMO.",
    body: (
      <>
        <p>En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
        <Titular />
        <h2>Objeto</h2>
        <p>REGALUMO es una tienda online de regalos digitales personalizados: periódicos, juegos de escape imprimibles y libros para colorear creados a partir de los textos y las fotos que aporta cada persona. Los productos se entregan como archivos PDF descargables; no se envía nada en papel.</p>
        <h2>Contenidos y propiedad intelectual</h2>
        <p>El diseño, los textos, las plantillas, los juegos, el logotipo y el código de REGALUMO son obra original del titular o se usan con licencia, y están protegidos por la normativa de propiedad intelectual. Las fuentes tipográficas se distribuyen bajo licencia SIL Open Font License. Está prohibido copiarlos, redistribuirlos o venderlos sin autorización escrita.</p>
        <p>Los textos y fotografías que aporta cada persona siguen siendo suyos. REGALUMO solo los usa para crear el producto que ha pedido.</p>
        <h2>Contenido que aportan los usuarios</h2>
        <p>Quien sube fotos o textos declara que tiene derecho a usarlos y que, si aparecen otras personas, cuenta con su permiso (en el caso de menores, el de sus padres o tutores). REGALUMO no revisa ese contenido antes, pero lo retirará en cuanto sepa que es ilícito o vulnera derechos de otra persona. Puedes avisarnos en {MAIL}.</p>
        <h2>Responsabilidad</h2>
        <p>Las vistas previas gratuitas muestran cómo quedará el producto, con marca de agua. El titular no responde de los daños causados por el contenido que aporte cada usuario ni de las interrupciones técnicas ajenas a su control.</p>
        <h2>Legislación aplicable</h2>
        <p>Este sitio se rige por la legislación española. Si eres consumidor, son competentes los juzgados de tu domicilio.</p>
        <Updated />
      </>
    ),
  },
  condiciones: {
    title: "Condiciones de venta",
    description: "Condiciones generales de contratación de los productos digitales de REGALUMO.",
    body: (
      <>
        <p>Estas condiciones regulan la compra de los productos digitales de REGALUMO. Al comprar, las aceptas. Puedes guardarlas o imprimirlas desde esta página.</p>
        <Titular />
        <h2>1. Productos</h2>
        <p>REGALUMO vende contenidos digitales personalizados que se entregan como archivos PDF descargables: periódico personalizado, escape room personalizado, libro para colorear personalizado y el pack con los tres. No se envía ningún producto físico. No hace falta crear una cuenta.</p>
        <h2>2. Precios</h2>
        <p>Los precios se muestran en euros, con todos los impuestos incluidos, antes de pagar. Se aplica el precio vigente en el momento de la compra. Si usas un código promocional válido, el descuento se muestra antes del pago.</p>
        <h2>3. Compra y pago</h2>
        <p>Antes de pagar puedes crear y revisar gratis la vista previa del producto. El pago se hace en la pasarela segura de Stripe (tarjeta u otros métodos que ofrezca). REGALUMO no ve ni guarda los datos de tu tarjeta. Al confirmarse el pago, el producto se desbloquea al momento y se abre la página privada de tu pedido, con el enlace de descarga. Guarda ese enlace: es tu forma de volver a descargarlo.</p>
        <h2>4. Entrega y descarga</h2>
        <p>La entrega es inmediata. El pedido puede volver a descargarse desde su enlace durante {DOWNLOAD_DAYS} días desde el pago. Te recomendamos guardar el archivo en tu dispositivo.</p>
        <h2>5. Derecho de desistimiento</h2>
        <p>Como consumidor tienes, en general, 14 días naturales para desistir de una compra a distancia. Pero los productos de REGALUMO son contenido digital, hecho a medida con tus textos y fotos, que se entrega al momento. Por eso, antes de pagar te pedimos que marques que quieres recibirlo de inmediato y que sabes que así pierdes el derecho de desistimiento (artículo 103, letras c y m, del Real Decreto Legislativo 1/2007, texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios). Guardamos constancia de la fecha y la hora en que lo aceptaste.</p>
        <p>Aun así, si el archivo no funciona o no corresponde con la vista previa, escríbenos a {MAIL}: lo arreglaremos y, si no es posible, te devolveremos el importe.</p>
        <h2>6. Uso permitido</h2>
        <p>Los archivos son para uso privado y familiar: puedes imprimirlos tantas veces como quieras para ti y para regalar. No está permitido revenderlos ni usarlos con fines comerciales.</p>
        <h2>7. Contenido que aportas</h2>
        <p>Eres responsable de tener derecho a usar las fotos y textos que subes. Los textos que sugiere la herramienta son orientativos y puedes cambiarlos antes de comprar.</p>
        <h2>8. Reclamaciones, ley y jurisdicción</h2>
        <p>Puedes reclamar escribiendo a {MAIL}, y te responderemos en el plazo más breve posible (como máximo, un mes). También puedes acudir a las oficinas de consumo o al arbitraje de consumo. Estas condiciones se rigen por la ley española, y son competentes los juzgados de tu domicilio.</p>
        <Updated />
      </>
    ),
  },
  privacidad: {
    title: "Política de privacidad",
    description: "Cómo trata REGALUMO tus datos y tus fotografías.",
    body: (
      <>
        <h2>Responsable del tratamiento</h2>
        <Titular />
        <h2>Qué datos tratamos</h2>
        <ul>
          <li><b>Tus proyectos</b>: textos, nombres, fechas y fotografías que subes para crear el producto.</li>
          <li><b>Compras</b>: qué compraste, importe, estado del pago y, si lo das, tu correo electrónico. Los datos de la tarjeta los trata solo Stripe.</li>
          <li><b>Solicitudes</b>: tu correo y tu mensaje si nos escribes o usas el formulario de esta página.</li>
          <li><b>Técnicos</b>: para limitar abusos de las pruebas gratuitas, tu dirección IP se convierte en un código cifrado que cambia cada día; nunca guardamos la IP en claro. La estadística de visitas es agregada por día (página vista, móvil u ordenador y tipo de origen de la visita, como «Google» o «TikTok», o la etiqueta utm del enlace), sin cookies ni identificadores personales. Si compras, el pedido guarda también ese tipo de origen (por ejemplo «Pinterest»).</li>
        </ul>
        <h2>Para qué y con qué base legal</h2>
        <ul>
          <li>Crear la vista previa y el producto que pides, cobrarlo y entregarlo: ejecución del contrato.</li>
          <li>Facturar y cumplir obligaciones contables y fiscales: obligación legal.</li>
          <li>Seguridad, prevención del fraude y atenderte cuando nos escribes: interés legítimo. Puedes oponerte escribiéndonos.</li>
          <li>Saber de dónde llegan las visitas y qué canales funcionan, con estadística agregada: interés legítimo.</li>
        </ul>
        <h2>Fotos de otras personas y de menores</h2>
        <p>Si subes fotos en las que aparecen otras personas, necesitas su permiso; si son menores, el de sus padres o tutores. Las fotos solo se usan para crear tu producto: no se publican, no se usan para publicidad y no se usan para entrenar modelos de inteligencia artificial.</p>
        <h2>Cuánto tiempo los guardamos</h2>
        <p>Los proyectos que no se compran, con sus fotos, se borran solos a los {config.retention.unpaidDays} días de su última modificación. Los comprados se guardan {config.retention.paidDays} días, para que puedas descargarlos y para atenderte si hay algún problema con el pedido, y después se borran. Puedes borrar un proyecto y sus fotos cuando quieras desde el propio editor. De las compras solo conservamos los datos que exige la ley (6 años, según el artículo 30 del Código de Comercio, y los plazos de la normativa tributaria).</p>
        <h2>Con quién los compartimos</h2>
        <p>Solo con proveedores que los tratan por cuenta nuestra y con contrato de encargo:</p>
        <ul>
          <li>Vercel: alojamiento de la web, con las funciones ejecutándose en la UE (París).</li>
          <li>Supabase: base de datos y almacenamiento privado de las fotos y los archivos, en servidores de la UE (Fráncfort).</li>
          <li>Stripe: pagos (Stripe Payments Europe, Irlanda).</li>
        </ul>
        <p>Si algún proveedor accede a datos desde fuera del Espacio Económico Europeo, lo hace con las garantías del RGPD: Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo. No vendemos tus datos ni los usamos para publicidad.</p>
        <h2>Tus derechos</h2>
        <p>Puedes acceder a tus datos, rectificarlos, suprimirlos, oponerte, limitar su tratamiento y llevártelos (portabilidad). Escríbenos a {MAIL} o usa el formulario de abajo. Si crees que no los tratamos bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
        <Updated />
      </>
    ),
  },
  cookies: {
    title: "Política de cookies",
    description: "Uso de cookies y tecnologías similares en REGALUMO.",
    body: (
      <>
        <p>REGALUMO solo usa cookies y almacenamiento técnicos, necesarios para que la web funcione. No requieren consentimiento (artículo 22.2 LSSI-CE), por eso no verás un aviso de cookies. No usamos cookies de analítica ni de publicidad: la estadística de visitas se cuenta de forma agregada y sin cookies.</p>
        <ul>
          <li><b>Almacenamiento local del navegador</b> (rg_tok_*, rg_ord_*, rg_pack): guarda en tu propio dispositivo la llave de tus proyectos y pedidos, para que solo tú puedas abrirlos sin registrarte. Dura hasta que lo borres desde el navegador.</li>
          <li><b>Almacenamiento de sesión</b> (rg_s, rg_src, rg_camp, rg_f_*): marcas para contar una sola vez cada visita y cada paso (abrir un producto, ver la muestra, ir a pagar) en la estadística agregada, y el tipo de origen de la visita (por ejemplo «Google»). No identifica a nadie, no se envía ningún identificador y se borra al cerrar la pestaña.</li>
          <li><b>rg_admin</b> (cookie): solo en el panel de administración, para mantener la sesión del personal autorizado. Dura 12 horas.</li>
        </ul>
        <p>Cuando pagas, lo haces en la página de Stripe (checkout.stripe.com), que usa sus propias cookies para la seguridad del pago, según su política. Si algún día añadimos cookies que no sean técnicas, te pediremos antes el consentimiento.</p>
        <Updated />
      </>
    ),
  },
};
