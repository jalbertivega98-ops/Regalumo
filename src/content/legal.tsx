import { config } from "@/lib/config";

/**
 * BORRADORES para revisión por un profesional. Los datos entre [corchetes] los debe
 * completar el titular. No se afirma el cumplimiento de ninguna normativa.
 */
const T = "[RAZÓN SOCIAL O NOMBRE DEL TITULAR]";
const NIF = "[NIF/CIF]";
const DIR = "[DOMICILIO COMPLETO]";
const REG = "[DATOS REGISTRALES, si es sociedad]";
const MAIL = config.contactEmail;

export const LEGAL: Record<string, { title: string; description: string; body: React.ReactNode }> = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Información del titular del sitio web REGALUMO.",
    body: (
      <>
        <h2>Titular del sitio web</h2>
        <p>En cumplimiento del deber de información (art. 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico, LSSI), se informa:</p>
        <ul>
          <li>Titular: {T}</li>
          <li>NIF/CIF: {NIF}</li>
          <li>Domicilio: {DIR}</li>
          <li>Correo electrónico: {MAIL}</li>
          <li>{REG}</li>
        </ul>
        <h2>Objeto</h2>
        <p>REGALUMO es una plataforma que permite crear productos digitales personalizados (periódicos, juegos de escape imprimibles y libros para colorear) y adquirirlos en formato PDF.</p>
        <h2>Propiedad intelectual</h2>
        <p>El diseño, los textos, las plantillas, el logotipo y el software de REGALUMO pertenecen a su titular o se usan con licencia. Las fuentes tipográficas se distribuyen bajo licencia SIL Open Font License. El contenido que aporta cada usuario (textos y fotografías) sigue siendo suyo.</p>
        <h2>Responsabilidad sobre el contenido de los usuarios</h2>
        <p>Quien sube fotografías o textos declara tener derecho a usarlos y, cuando aparezcan otras personas, contar con su consentimiento o el de sus representantes legales. REGALUMO no revisa previamente ese contenido, pero lo retirará si tiene conocimiento de que es ilícito.</p>
        <h2>Legislación aplicable</h2>
        <p>Este sitio se rige por la legislación española. [Revisar cláusula de jurisdicción: con consumidores no puede imponerse un fuero distinto al de su domicilio.]</p>
      </>
    ),
  },
  condiciones: {
    title: "Condiciones de venta",
    description: "Condiciones generales de contratación de los productos digitales de REGALUMO.",
    body: (
      <>
        <h2>1. Vendedor</h2>
        <p>{T}, con NIF {NIF} y domicilio en {DIR}. Contacto: {MAIL}.</p>
        <h2>2. Productos</h2>
        <p>Se venden contenidos digitales personalizados que se entregan como archivos PDF descargables: periódico personalizado, escape room personalizado, libro para colorear personalizado y el pack de los tres. No se envía ningún producto físico.</p>
        <h2>3. Precio y pago</h2>
        <p>Los precios se muestran en euros e incluyen los impuestos aplicables [confirmar régimen de IVA con la asesoría]. El pago se realiza con tarjeta u otros métodos ofrecidos por Stripe Payments Europe, Ltd. REGALUMO no accede a los datos completos de la tarjeta.</p>
        <h2>4. Proceso de compra</h2>
        <p>Antes de pagar, la persona usuaria puede crear y revisar gratuitamente la vista previa del producto. Al pulsar el botón de pago se le redirige a la pasarela segura. Una vez confirmado el pago por la pasarela, el producto se desbloquea y se muestra una página privada de descarga. Si se facilita un correo electrónico, se envía también el enlace.</p>
        <h2>5. Entrega y plazo de descarga</h2>
        <p>La entrega es inmediata tras la confirmación del pago. El enlace de descarga está disponible durante 30 días. Recomendamos guardar el archivo.</p>
        <h2>6. Derecho de desistimiento</h2>
        <p>
          De acuerdo con el artículo 103.m) del Texto Refundido de la Ley General para la Defensa de los Consumidores y Usuarios, el derecho de desistimiento no es aplicable al suministro de contenido digital que no se preste en soporte material cuando la ejecución haya comenzado con el previo consentimiento expreso del consumidor y con el conocimiento por su parte de que pierde dicho derecho. Antes del pago, la persona compradora marca una casilla en la que da ese consentimiento y reconoce esa pérdida; REGALUMO guarda constancia de la fecha y hora. [Revisar redacción y confirmación posterior en soporte duradero (correo de compra).]
        </p>
        <p>Además, los productos se confeccionan conforme a las especificaciones del consumidor (art. 103.c).</p>
        <h2>7. Conformidad y garantía</h2>
        <p>Si el archivo no se corresponde con la vista previa o presenta un defecto técnico, escríbenos a {MAIL} y lo corregiremos o, si no es posible, reembolsaremos el importe.</p>
        <h2>8. Uso permitido</h2>
        <p>Los archivos son para uso privado y familiar. No está permitida su reventa.</p>
        <h2>9. Contenido aportado</h2>
        <p>La persona usuaria es responsable de tener derecho a usar las fotografías y textos que aporta. Los textos sugeridos por la herramienta son orientativos y editables.</p>
        <h2>10. Reclamaciones</h2>
        <p>Puedes contactar en {MAIL}. [Indicar si se dispone de hojas de reclamaciones y adhesión a sistemas de resolución de conflictos.] La plataforma europea de resolución de litigios en línea (ODR) dejó de estar operativa en julio de 2025; [revisar la referencia vigente].</p>
      </>
    ),
  },
  privacidad: {
    title: "Política de privacidad",
    description: "Cómo trata REGALUMO tus datos y tus fotografías.",
    body: (
      <>
        <h2>Responsable del tratamiento</h2>
        <p>{T}, NIF {NIF}, {DIR}. Contacto: {MAIL}.</p>
        <h2>Qué datos tratamos y para qué</h2>
        <ul>
          <li><b>Contenido de tus proyectos</b> (textos, nombres, fechas y fotografías): para generar la vista previa y el producto que solicitas. Base jurídica: ejecución de la solicitud del usuario y, en su caso, del contrato (art. 6.1.b RGPD).</li>
          <li><b>Datos de compra</b> (correo electrónico, importe, identificadores de pago): para gestionar el pedido, enviarte el enlace de descarga y cumplir obligaciones contables y fiscales (art. 6.1.b y 6.1.c RGPD).</li>
          <li><b>Datos técnicos</b>: la dirección IP se transforma en un identificador cifrado que cambia cada día, solo para limitar abusos de las pruebas gratuitas (interés legítimo, art. 6.1.f RGPD). No guardamos la IP en claro.</li>
          <li><b>Estadísticas</b>: contadores agregados de visitas y uso, sin cookies ni identificadores personales.</li>
        </ul>
        <h2>Fotografías de terceras personas y de menores</h2>
        <p>Si subes fotos en las que aparecen otras personas, debes contar con su permiso; en el caso de menores, con el de sus padres, madres o tutores. Las fotos se usan exclusivamente para crear tu producto.</p>
        <h2>Conservación</h2>
        <p>Los proyectos que no se compran se eliminan automáticamente a los {config.retention.unpaidDays} días de su última modificación. Los proyectos comprados se conservan {config.retention.paidDays} días para que puedas volver a descargarlos. Los datos de facturación se conservan el tiempo exigido por la ley. Puedes borrar un proyecto y sus fotos en cualquier momento desde el propio editor.</p>
        <h2>Encargados del tratamiento</h2>
        <ul>
          <li>Vercel Inc. (alojamiento web). [Verificar región y garantías de transferencia internacional.]</li>
          <li>Supabase Inc. (base de datos y almacenamiento privado de archivos). [Elegir región UE y verificar contrato.]</li>
          <li>Stripe Payments Europe, Ltd. (pagos).</li>
          <li>Resend (correos de compra), si se activa. [Verificar contrato y región.]</li>
        </ul>
        <p>No vendemos tus datos ni los usamos para publicidad. Las fotos no se usan para entrenar modelos de IA.</p>
        <h2>Tus derechos</h2>
        <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {MAIL} o con el formulario de abajo. También puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>
      </>
    ),
  },
  cookies: {
    title: "Política de cookies",
    description: "Uso de cookies y tecnologías similares en REGALUMO.",
    body: (
      <>
        <h2>Resumen</h2>
        <p>REGALUMO no usa cookies de publicidad ni de analítica de terceros. Por eso no mostramos un banner de cookies. [Revisar si se añaden servicios de terceros en el futuro.]</p>
        <h2>Qué usamos</h2>
        <ul>
          <li><b>rg_admin</b> (cookie técnica): solo en el panel de administración, para mantener la sesión del personal autorizado. Duración: 12 horas.</li>
          <li><b>Almacenamiento local del navegador</b> (técnico): guarda la llave de tus proyectos y pedidos en tu propio dispositivo para que solo tú puedas abrirlos sin necesidad de registrarte. No se envía a terceros. Puedes borrarlo desde la configuración del navegador.</li>
          <li><b>sessionStorage</b>: una marca para contar una sesión por pestaña en las estadísticas agregadas. No identifica a nadie.</li>
          <li><b>Stripe</b>: al pagar, la pasarela de Stripe puede usar sus propias cookies técnicas para prevenir el fraude, en su propio dominio.</li>
        </ul>
        <p>Estas tecnologías son necesarias para prestar el servicio solicitado, supuesto exceptuado del consentimiento según el art. 22.2 LSSI. [Confirmar con asesoría la calificación de cada elemento.]</p>
      </>
    ),
  },
};
