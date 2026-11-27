import type { ProductId } from "@/lib/products/catalog";

/**
 * Contenido de las páginas públicas indexables. Texto original de REGALUMO,
 * escrito para responder a lo que busca cada persona (no para repetir palabras clave).
 */
export interface SeoPage {
  slug: string;
  /** Texto corto para enlaces (pie, portada y «También te puede interesar»). */
  label: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  product: ProductId | "all";
  visual: "newspaper" | "escape" | "coloring" | "all";
  cta: string;
  /** Enlace del botón si no es el editor del producto (p. ej. con una temática ya elegida). */
  ctaHref?: string;
  /** links: guías enlazadas dentro de la sección (por su slug). */
  sections: { h2: string; paragraphs: string[]; bullets?: string[]; links?: string[] }[];
  faq: { q: string; a: string }[];
  related: string[];
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "escape-room-personalizado",
    label: "Escape room personalizado",
    title: "Escape room personalizado para imprimir en casa",
    description:
      "Crea un escape room personalizado con historia, acertijos, pistas y soluciones según la edad y la temática. Prueba gratis una aventura de 3 retos.",
    eyebrow: "Escape room personalizado",
    h1: "Un escape room hecho a medida para jugar en casa",
    intro:
      "Elige la edad, la temática, el número de participantes, la dificultad y la duración. REGALUMO prepara una aventura completa con historia, acertijos encadenados, tarjetas de pistas, soluciones y una guía para que cualquier persona pueda organizarla sin experiencia.",
    product: "escape",
    visual: "escape",
    cta: "Jugar la demo gratis",
    sections: [
      {
        h2: "Qué hace diferente a un escape room personalizado",
        paragraphs: [
          "Un juego de escape genérico está pensado para cualquiera. Uno personalizado está pensado para tu grupo: el protagonista puede ser quien cumple años, la dificultad se ajusta a la edad real de quienes juegan y la duración encaja con el tiempo que tienes.",
          "Cada acertijo se genera junto con su solución y se comprueba automáticamente antes de entregarlo, para que nunca haya un reto imposible de resolver.",
        ],
      },
      {
        h2: "Qué incluye el PDF",
        paragraphs: ["Todo lo necesario para imprimir, recortar y jugar el mismo día:"],
        bullets: [
          "Historia original para leer en voz alta al empezar.",
          "Entre 4 y 9 retos variados: búsqueda por casa, puzle recortable, disco descifrador, rejilla secreta, código de símbolos, laberintos, adivinanzas, candados y lógica.",
          "Tarjetas de recompensa con letras que forman la palabra final.",
          "Dos pistas por acertijo, en tarjetas para recortar.",
          "Guía del organizador con materiales, preparación paso a paso y consejos de seguridad.",
          "Hoja de soluciones explicadas y diploma final.",
          "Panel opcional para jugar con el móvil (se abre con un código QR): cuenta atrás, comprobar respuestas y pistas, sin ver las soluciones.",
        ],
      },
      {
        h2: "Temáticas y edades",
        paragraphs: [
          "Puedes elegir piratas, espacio, detectives, magia, selva, misterio en el museo o Navidad. Para peques de 5 a 7 años hay retos de contar figuras y laberintos; para 8 a 11, cifrados sencillos y sopas de letras; para jóvenes y adultos, lógica, cifrado César y series numéricas.",
        ],
      },
    ],
    faq: [
      { q: "¿Necesito materiales especiales?", a: "No. Basta con una impresora, papel A4, tijeras, sobres y una caja que haga de cofre final. Un candado de números es opcional." },
      { q: "¿Cuánto se tarda en prepararlo?", a: "Entre 20 y 30 minutos: imprimir, recortar las tarjetas, meter cada acertijo en su sobre y esconderlos." },
      { q: "¿Puedo probarlo antes de pagar?", a: "Sí. La demo gratuita genera una mini aventura con los datos que elijas: un puzle de piezas, una búsqueda de objetos y un candado que se abre con lo que ganáis en cada reto." },
    ],
    related: ["escape-room-para-cumpleanos", "escape-room-para-imprimir", "regalos-personalizados"],
  },
  {
    slug: "escape-room-para-cumpleanos",
    label: "Escape room para cumpleaños",
    title: "Escape room de cumpleaños infantil para imprimir",
    description:
      "Organiza un escape room de cumpleaños con el nombre del protagonista, retos adaptados a su edad y todo listo para imprimir. Demo gratuita sin registro.",
    eyebrow: "Fiestas de cumpleaños",
    h1: "Escape room para cumpleaños: la fiesta se convierte en aventura",
    intro:
      "Convierte la merienda de cumpleaños en una misión. Quien cumple años protagoniza la historia, el grupo resuelve los retos en equipo y el premio final puede ser la tarta, los regalos o una sorpresa que tú elijas.",
    product: "escape",
    visual: "escape",
    cta: "Crear la aventura del cumpleaños",
    sections: [
      {
        h2: "Cómo encaja en una fiesta",
        paragraphs: [
          "Una partida de 45 o 60 minutos funciona muy bien después de comer y antes de la tarta. Si sois más de 6 participantes, la guía explica cómo imprimir los acertijos dos veces y formar dos equipos.",
          "El organizador actúa como guardián: comprueba respuestas, entrega tarjetas de recompensa y reparte pistas si el grupo se atasca. No hace falta haber jugado nunca a un escape room.",
        ],
      },
      {
        h2: "Ideas para el premio final",
        paragraphs: ["La última palabra abre el «cofre»: una caja, un cajón o una bolsa con algo especial dentro."],
        bullets: [
          "Las bolsas de chuches o los recuerdos de la fiesta.",
          "El regalo principal de la persona homenajeada.",
          "Una carta o un vídeo de la familia.",
          "La propia tarta, escondida hasta el final.",
        ],
      },
      {
        h2: "Seguridad y edades",
        paragraphs: [
          "Los retos para 5 a 7 años no requieren leer mucho y la guía recomienda acompañar la búsqueda. Nunca escondas sobres en sitios altos, cerca de enchufes o en la cocina.",
        ],
      },
      {
        h2: "El día de la fiesta, paso a paso",
        paragraphs: ["Con media hora de preparación tienes el juego listo:"],
        bullets: [
          "La víspera: imprime el PDF, recorta las tarjetas y mete cada acertijo en un sobre numerado.",
          "Antes de que lleguen: esconde los sobres por la casa o el jardín y prepara el «cofre» con el premio.",
          "Al empezar: lee la historia en voz alta y entrega el primer sobre.",
          "Durante el juego: comprueba respuestas con la hoja de soluciones y da pistas si se atascan.",
          "Al final: con la palabra secreta se abre el cofre y llega la tarta.",
        ],
      },
      {
        h2: "Temáticas para cada fiesta",
        paragraphs: [
          "Piratas, espacio, detectives, magia, selva, misterio en el museo y Navidad. Si la fiesta tiene una temática, elige la más parecida: el nombre de quien cumple años aparece en la historia y el título.",
        ],
        links: ["escape-room-de-navidad", "escape-room-para-imprimir"],
      },
    ],
    faq: [
      { q: "¿Para qué edades sirve?", a: "Desde 5 años hasta adultos. Al elegir la edad cambian el tipo de retos, el vocabulario y la dificultad." },
      { q: "¿Puedo poner el nombre de quien cumple años?", a: "Sí, el campo «protagonista» incluye su nombre en el título y en la historia." },
      { q: "¿Cuánto cuesta?", a: "El juego completo cuesta 9,99 € e incluye el PDF para imprimir tantas copias como necesites para tu fiesta." },
      { q: "¿Cuántos niños pueden jugar?", a: "Lo ideal son de 3 a 6 por equipo. Con más invitados, imprime los acertijos dos veces y haz dos equipos que compitan por llegar antes al cofre." },
      { q: "¿Se puede jugar en un piso pequeño?", a: "Sí. Los sobres se pueden esconder en una sola habitación; lo importante son los acertijos, no el espacio." },
    ],
    related: ["escape-room-personalizado", "periodico-de-cumpleanos", "escape-room-para-imprimir"],
  },
  {
    slug: "escape-room-para-imprimir",
    label: "Escape room para imprimir",
    title: "Escape room para imprimir en PDF, listo en minutos",
    description:
      "Escape room imprimible en PDF con acertijos, pistas, soluciones y guía del organizador. Personalízalo por edad y temática y descárgalo al momento.",
    eyebrow: "Imprimible en PDF",
    h1: "Escape room para imprimir: descarga, recorta y a jugar",
    intro:
      "Un documento A4 pensado para impresoras domésticas: márgenes amplios, tarjetas con líneas de corte, tipografía clara y blanco y negro legible. Sin aplicaciones, sin pantallas durante el juego y sin esperas de envío.",
    product: "escape",
    visual: "escape",
    cta: "Probar un escape room gratis",
    sections: [
      {
        h2: "Preparado para imprimir en casa",
        paragraphs: [
          "Cada acertijo ocupa su propia página, con el número de sobre en la cabecera. Las tarjetas de recompensa y de pistas se agrupan en hojas para recortar, y la hoja de soluciones va aparte para que solo la vea quien organiza.",
          "Se descarga en PDF justo después del pago y el enlace sigue disponible durante 30 días.",
        ],
      },
      {
        h2: "Lista de materiales",
        paragraphs: ["Lo que necesitas además del PDF:"],
        bullets: ["Papel A4 normal", "Tijeras", "Sobres numerados (uno por acertijo más el final)", "Lápices", "Una caja para el premio final"],
      },
      {
        h2: "Personalizado, no genérico",
        paragraphs: [
          "A diferencia de un imprimible estándar, este se genera con tus elecciones: temática, edad, dificultad, duración y nombres. Dos personas que elijan opciones distintas recibirán juegos distintos.",
        ],
      },
    ],
    faq: [
      { q: "¿Se puede imprimir en blanco y negro?", a: "Sí. Los colores son de apoyo y todo se entiende igual en blanco y negro." },
      { q: "¿Puedo imprimirlo varias veces?", a: "Sí, para uso privado y familiar puedes imprimir las copias que necesites." },
      { q: "¿Qué tamaño tiene?", a: "Hojas A4. El documento completo suele tener entre 12 y 18 páginas según la duración." },
    ],
    related: ["escape-room-personalizado", "escape-room-para-cumpleanos", "foto-para-colorear"],
  },
  {
    slug: "periodico-personalizado",
    label: "Periódico personalizado",
    title: "Periódico personalizado con fotos y mensajes",
    description:
      "Diseña la portada de un periódico personalizado con fotos, anécdotas y mensajes. Elige plantilla, edita los textos y descarga un PDF A3 de alta calidad.",
    eyebrow: "Periódico personalizado",
    h1: "Un periódico personalizado con su historia en portada",
    intro:
      "Escribe el nombre, elige la ocasión y sube tus fotos: la portada aparece al momento y puedes cambiar cada texto hasta que quede perfecta. Al terminar, descargas un PDF A3 listo para imprimir o enmarcar.",
    product: "newspaper",
    visual: "newspaper",
    cta: "Crear mi portada gratis",
    sections: [
      {
        h2: "Tres plantillas con personalidad",
        paragraphs: [
          "Clásico, con cabecera gótica y fotos en blanco y negro, como un diario histórico. Moderno, con tipografía editorial y un toque de color. Vintage, en tono sepia con marco envejecido. Puedes cambiar de plantilla en cualquier momento sin perder lo escrito.",
        ],
      },
      {
        h2: "Qué puedes incluir",
        paragraphs: ["La portada se adapta a lo que añadas:"],
        bullets: [
          "Titular, subtítulo y noticia principal.",
          "Hasta 4 fotos con pie de foto.",
          "Hasta 3 anécdotas con título.",
          "Hasta 6 mensajes de familia y amistades.",
          "Fechas importantes y una firma manuscrita al pie.",
        ],
      },
      {
        h2: "Solo cuenta lo que tú escribes",
        paragraphs: [
          "Los textos sugeridos son neutrales y usan únicamente los datos que introduces. REGALUMO no inventa fechas, logros ni datos biográficos: la historia la pones tú, y nosotros le damos forma de portada.",
        ],
      },
    ],
    faq: [
      { q: "¿Qué tamaño tiene el PDF?", a: "A3 vertical (29,7 × 42 cm), vectorial y con las fotos en alta calidad. También se puede imprimir reducido en A4." },
      { q: "¿Puedo probarlo sin pagar?", a: "Sí. Puedes crear la portada completa con tus datos y fotos y verla en pantalla. Solo pagas si quieres el PDF sin marca de agua." },
      { q: "¿Mis fotos son públicas?", a: "No. Se guardan de forma privada, solo las ve quien tiene el enlace del proyecto y puedes borrarlas en cualquier momento." },
    ],
    related: ["periodico-de-boda", "regalo-de-jubilacion-original", "regalo-de-aniversario-original"],
  },
  {
    slug: "periodico-de-cumpleanos",
    label: "Periódico de cumpleaños",
    title: "Periódico o diario de cumpleaños personalizado",
    description:
      "Crea un periódico o diario de cumpleaños personalizado con su nombre en la cabecera, fotos, anécdotas y mensajes de la familia. Pruébalo gratis.",
    eyebrow: "Regalo de cumpleaños",
    h1: "Periódico de cumpleaños personalizado: su día merece portada",
    intro:
      "Un 18, un 40, un 80 o un primer cumpleaños: el periódico convierte los recuerdos de la familia en una portada que se lee, se comparte en la fiesta y se guarda durante años.",
    product: "newspaper",
    visual: "newspaper",
    cta: "Crear su periódico gratis",
    sections: [
      {
        h2: "Ideas de contenido que funcionan",
        paragraphs: ["Lo que más emociona suele ser lo más sencillo:"],
        bullets: [
          "Una foto de cuando era pequeño o pequeña y otra actual.",
          "La anécdota que siempre se cuenta en las comidas familiares.",
          "Mensajes cortos de varias personas, cada uno con su firma.",
          "Las fechas que marcaron su vida, contadas por la familia.",
        ],
      },
      {
        h2: "Cómo regalarlo",
        paragraphs: [
          "Imprime el PDF en A3 en una copistería y enmárcalo, o imprímelo en A4 para repartir copias en la fiesta. También puedes enviarlo por mensaje el mismo día del cumpleaños.",
          "Un truco: pide a cada invitado una frase antes de la fiesta y añádela como mensaje de los lectores.",
        ],
      },
      {
        h2: "Hecho con tus palabras",
        paragraphs: ["El titular puede incluir la edad («¡Marta cumple 40 años!») y todos los textos se pueden editar. Nada se inventa: la portada solo muestra lo que tú escribes."],
      },
      {
        h2: "¿Diario de cumpleaños o periódico del día que nació?",
        paragraphs: [
          "Mucha gente busca un «diario de cumpleaños» pensando en el periódico real del día en que nació alguien. Eso son reimpresiones de prensa antigua. Lo que creamos en REGALUMO es otra cosa: un periódico nuevo cuya noticia principal es la propia persona, con vuestras fotos y recuerdos.",
          "Si quieres el toque del día de su nacimiento, pon esa fecha en la sección «Fechas importantes» junto al lugar donde nació, y añade lo que la familia recuerda de aquel día.",
        ],
      },
      {
        h2: "Titulares de ejemplo según la edad",
        paragraphs: ["Sirven de punto de partida; luego los cambias a tu gusto:"],
        bullets: [
          "1 año: «Lucas celebra su primera vuelta al sol».",
          "18 años: «Paula alcanza la mayoría de edad y promete seguir siendo la misma».",
          "30 o 40 años: «Edición especial: Marta cumple 40 y la familia lo celebra en portada».",
          "50 o 60 años: «Medio siglo de anécdotas: Javier cumple 50».",
          "80 años o más: «La abuela Carmen cumple 80 rodeada de nietos».",
        ],
      },
    ],
    faq: [
      { q: "¿Sirve para un cumpleaños infantil?", a: "Sí. Funciona igual de bien para un primer cumpleaños, con fotos del bebé y mensajes de la familia." },
      { q: "¿Cuánto cuesta?", a: "6,99 € por el PDF sin marca de agua. La portada y la vista previa son gratis." },
      { q: "¿Puedo hacer cambios después de pagar?", a: "El PDF pagado corresponde a la versión que compraste. Revisa bien la vista previa antes del pago." },
      { q: "¿Incluye las noticias reales del día en que nació?", a: "No. Es un periódico personalizado nuevo, no una copia de la prensa de aquel día. Puedes añadir su fecha de nacimiento y los recuerdos de la familia en la sección de fechas importantes." },
      { q: "¿En qué tamaño se imprime?", a: "El PDF está pensado para A3, el tamaño ideal para enmarcar. También se puede imprimir en A4 para repartir copias." },
    ],
    related: ["periodico-personalizado", "escape-room-para-cumpleanos", "regalos-personalizados"],
  },
  {
    slug: "regalos-personalizados",
    label: "Regalos personalizados",
    title: "Regalos personalizados originales online y con foto",
    description:
      "Crea regalos personalizados online con tus fotos y vuestra historia: periódico, escape room y libro para colorear. Pruébalo gratis y descárgalo al momento.",
    eyebrow: "Regalos personalizados",
    h1: "Regalos personalizados online: créalos tú en minutos",
    intro:
      "Un buen regalo personalizado habla de la persona que lo recibe. En REGALUMO puedes crear tres tipos de regalo, probarlos gratis con tus propios datos y descargarlos al momento para imprimir o compartir.",
    product: "all",
    visual: "all",
    cta: "Crear un regalo gratis",
    sections: [
      {
        h2: "Tres regalos, tres maneras de sorprender",
        paragraphs: [
          "El periódico personalizado celebra una historia: cumpleaños, bodas, jubilaciones o nacimientos. El escape room convierte una reunión en una aventura en equipo. El libro para colorear transforma las fotos de la familia o de la mascota en láminas para pintar.",
        ],
      },
      {
        h2: "Por qué un regalo digital imprimible",
        paragraphs: [
          "Llega a tiempo aunque sea el mismo día, no tiene gastos de envío y se puede imprimir en el tamaño y el papel que prefieras. Y como lo personalizas tú, nadie más tendrá uno igual.",
        ],
      },
      {
        h2: "Primero lo ves, luego decides",
        paragraphs: [
          "Todas las herramientas tienen una prueba gratuita real, sin registro ni tarjeta. Ves el resultado con tus datos y solo pagas si te gusta.",
        ],
        bullets: ["Periódico: 6,99 €", "Libro para colorear: 7,99 €", "Escape room: 9,99 €", "Pack de los tres: 19,99 €"],
      },
      {
        h2: "Cómo crear un regalo personalizado paso a paso",
        paragraphs: ["Todo se hace desde el móvil o el ordenador, sin instalar nada:"],
        bullets: [
          "Elige el regalo: periódico, escape room o libro para colorear.",
          "Añade lo que lo hace único: nombres, fotos, anécdotas, la edad o la temática favorita.",
          "Mira la vista previa gratis y cambia lo que quieras tantas veces como necesites.",
          "Si te gusta, paga y descarga el PDF al momento para imprimirlo o enviarlo.",
        ],
      },
      {
        h2: "Qué regalo personalizado elegir según la persona",
        paragraphs: ["Una forma rápida de acertar:"],
        bullets: [
          "Para alguien que lo guarda todo (padres, abuelos, pareja): el periódico con su historia, enmarcado.",
          "Para niños de 5 a 10 años: el libro para colorear con sus fotos o un escape room con su nombre.",
          "Para un grupo de amigos o la familia reunida: el escape room, porque se juega entre todos.",
          "Para quien tiene mascota: láminas para colorear con fotos de su perro o su gato.",
        ],
      },
      {
        h2: "Ideas de regalos personalizados por ocasión",
        paragraphs: ["Guías con ideas concretas, ejemplos y consejos para cada momento:"],
        links: [
          "regalos-de-navidad-personalizados",
          "regalos-de-reyes-para-ninos",
          "regalo-amigo-invisible-original",
          "escape-room-de-navidad",
          "regalo-para-abuelos-personalizado",
          "periodico-de-cumpleanos",
          "escape-room-para-cumpleanos",
          "regalo-de-aniversario-original",
          "periodico-de-boda",
          "regalo-de-jubilacion-original",
          "regalo-personalizado-con-foto",
          "regalo-de-ultima-hora",
        ],
      },
    ],
    faq: [
      { q: "¿Recibo algo físico?", a: "No. Recibes un PDF de alta calidad para imprimir donde quieras o compartir en digital." },
      { q: "¿Tengo que crear una cuenta?", a: "No. Puedes probar y comprar sin registrarte. Tras el pago verás tu página privada de descarga, con un botón para copiar el enlace y guardarlo." },
      { q: "¿Qué pasa con mis fotos?", a: "Se guardan en privado, no se indexan en buscadores y puedes borrarlas cuando quieras. Los proyectos sin pagar se borran automáticamente pasado un tiempo." },
      { q: "¿Cuánto se tarda en crear un regalo personalizado?", a: "Entre 5 y 15 minutos, según cuántas fotos y textos quieras añadir. El archivo se descarga justo después del pago." },
      { q: "¿Puedo regalarlo a alguien que vive lejos?", a: "Sí. Como es un PDF, puedes enviárselo por mensaje o correo, o imprimirlo tú y entregarlo en mano cuando os veáis." },
    ],
    related: ["regalo-personalizado-con-foto", "regalos-de-navidad-personalizados", "regalo-de-ultima-hora"],
  },
  {
    slug: "foto-para-colorear",
    label: "Convertir foto para colorear",
    title: "Convertir una foto en dibujo para colorear",
    description:
      "Convierte una foto en un dibujo para colorear con contornos cerrados. Elige estilo infantil, sencillo o detallado y prueba gratis con tu imagen.",
    eyebrow: "Foto para colorear",
    h1: "Convierte cualquier foto en un dibujo para colorear",
    intro:
      "Sube una foto y en unos segundos verás una lámina con contornos negros sobre fondo blanco, con zonas cerradas listas para pintar. Puedes elegir entre tres estilos según la edad de quien vaya a colorear.",
    product: "coloring",
    visual: "coloring",
    cta: "Probar con mi foto",
    sections: [
      {
        h2: "Cómo funciona la conversión",
        paragraphs: [
          "La foto se simplifica en zonas de color parecidas y después se dibujan los límites entre ellas. Así se obtienen contornos cerrados, que es lo que hace que una lámina se pueda colorear de verdad, en lugar de un simple efecto de bordes.",
          "Es un proceso automático propio, sin servicios externos de IA, por eso la muestra gratuita es inmediata.",
        ],
      },
      {
        h2: "Qué fotos dan mejor resultado",
        paragraphs: ["Algunos consejos para que la lámina quede clara:"],
        bullets: [
          "Un protagonista claro: una mascota, una persona o un edificio.",
          "Buena luz y poco desenfoque.",
          "Fondos sencillos: una pared lisa o el cielo.",
          "Para peques, el estilo infantil reduce detalles y engrosa el trazo.",
        ],
      },
      {
        h2: "De una foto a un libro completo",
        paragraphs: [
          "Con una sola foto puedes ver la muestra gratuita. Si te gusta, puedes crear un libro de hasta 12 láminas con portada y título personalizado, en alta resolución para imprimir.",
        ],
      },
    ],
    faq: [
      { q: "¿Es gratis?", a: "La muestra de una página es gratuita, con resolución limitada y marca de agua. El libro completo en alta resolución cuesta 7,99 €." },
      { q: "¿Funciona con retratos de personas?", a: "Sí, aunque el resultado es una interpretación con líneas, no un retrato realista. Las fotos con buena luz y fondo simple funcionan mejor." },
      { q: "¿Guardáis mis fotos?", a: "Se guardan en privado mientras trabajas en tu proyecto y puedes borrarlas al momento. Nunca se publican ni se usan para otros fines." },
    ],
    related: ["laminas-para-colorear-con-foto", "libro-para-colorear-personalizado", "regalo-personalizado-con-foto"],
  },
  {
    slug: "libro-para-colorear-personalizado",
    label: "Libro para colorear personalizado",
    title: "Libro para colorear personalizado con tus fotos",
    description:
      "Crea un libro para colorear personalizado con fotos de tu familia, mascotas o viajes. Portada con título, hasta 12 láminas y PDF A4 en alta resolución.",
    eyebrow: "Libro para colorear",
    h1: "Un libro para colorear protagonizado por tu familia",
    intro:
      "Elige tus fotos favoritas, ponle título al libro y descarga un PDF con portada y hasta 12 láminas listas para imprimir. Un regalo perfecto para peques que se ven a sí mismos, a sus abuelos o a su mascota en cada página.",
    product: "coloring",
    visual: "coloring",
    cta: "Crear mi libro gratis",
    sections: [
      {
        h2: "Qué incluye",
        paragraphs: ["El libro completo tiene:"],
        bullets: [
          "Portada con el título y una dedicatoria opcional.",
          "Hasta 12 láminas, una por página, en A4 a 300 ppp.",
          "Estilo por página: infantil, sencillo o detallado.",
          "Espacio «Este libro pertenece a…» para escribir el nombre.",
        ],
      },
      {
        h2: "Ideas para tu libro",
        paragraphs: [
          "Un viaje en familia contado en láminas, las mascotas de la casa, los abuelos y los primos, el primer año del bebé o los edificios de tu ciudad. Mezclar fotos cercanas con paisajes da variedad al libro.",
        ],
      },
      {
        h2: "Privacidad de tus fotos",
        paragraphs: [
          "Las fotos se procesan para crear tu libro y se guardan de forma privada. No se publican, no se indexan en buscadores y puedes borrar el proyecto completo con un solo botón.",
        ],
      },
    ],
    faq: [
      { q: "¿Cuántas páginas puede tener?", a: "Hasta 12 láminas más la portada." },
      { q: "¿Hay un estilo con ilustración por IA?", a: "Está en preparación y se activará cuando conectemos un servicio de generación de imágenes. Hoy funcionan los estilos infantil, sencillo y detallado." },
      { q: "¿Puedo ver el resultado antes de pagar?", a: "Sí. Cada foto genera una muestra gratuita a resolución limitada y con marca de agua." },
    ],
    related: ["foto-para-colorear", "laminas-para-colorear-con-foto", "regalos-de-navidad-personalizados"],
  },
  {
    slug: "regalo-personalizado-con-foto",
    label: "Regalo personalizado con foto",
    title: "Regalo personalizado con foto, listo en minutos",
    description:
      "Convierte tus fotos en un regalo personalizado: la portada de un periódico con su historia o un libro para colorear con la familia. Pruébalo gratis.",
    eyebrow: "Regalo con foto",
    h1: "Un regalo personalizado con foto que no termina en un cajón",
    intro:
      "Las fotos del móvil se quedan en el móvil. Con REGALUMO puedes darles una segunda vida: ponerlas en la portada de un periódico que cuenta su historia o convertirlas en láminas para colorear con quien más quieres. Lo pruebas gratis con tus propias fotos y descargas el PDF al momento.",
    product: "all",
    visual: "all",
    cta: "Probar con mis fotos",
    sections: [
      {
        h2: "Dos formas de regalar con tus fotos",
        paragraphs: [
          "El periódico personalizado admite hasta 4 fotos con su pie de foto, junto a un titular, anécdotas y mensajes de familia y amistades. Es ideal para cumpleaños redondos, jubilaciones, bodas o aniversarios.",
          "El libro para colorear convierte cada foto en una lámina con contornos negros sobre fondo blanco, con hasta 12 láminas y portada con título. A los peques les encanta pintar a sus abuelos, a su mascota o a sí mismos.",
        ],
      },
      {
        h2: "Qué fotos elegir",
        paragraphs: ["No hace falta que sean perfectas, pero estas ideas ayudan:"],
        bullets: [
          "Para el periódico: una foto de cuando era pequeño o pequeña y otra reciente dan mucho juego.",
          "Para colorear: un protagonista claro, buena luz y un fondo sencillo.",
          "Mejor fotos originales que capturas de pantalla, que pierden calidad.",
          "Si dudas entre varias, pruébalas: la vista previa es gratis y puedes cambiarlas.",
        ],
      },
      {
        h2: "Tus fotos siguen siendo tuyas",
        paragraphs: [
          "Las fotos se usan solo para crear tu regalo. Se guardan en privado, nunca se publican ni aparecen en buscadores y puedes borrar el proyecto con un botón. Los proyectos que no se compran se eliminan solos pasado un tiempo.",
        ],
      },
    ],
    faq: [
      { q: "¿Cuántas fotos puedo usar?", a: "Hasta 4 en el periódico y hasta 12 en el libro para colorear, una por lámina." },
      { q: "¿El escape room también lleva fotos?", a: "No. El escape room se personaliza con el nombre del protagonista, la edad, la temática y la dificultad, pero no usa fotos." },
      { q: "¿Cuánto tarda?", a: "Unos minutos. La vista previa aparece al momento y, si decides comprar, el PDF se descarga justo después del pago." },
    ],
    related: ["periodico-personalizado", "libro-para-colorear-personalizado", "regalos-personalizados"],
  },
  {
    slug: "laminas-para-colorear-con-foto",
    label: "Láminas para colorear con tu foto",
    title: "Láminas para colorear personalizadas con tu foto",
    description:
      "Crea láminas para colorear con tus fotos: la familia, la mascota o un viaje convertidos en dibujos con contornos cerrados. Muestra gratis y PDF A4.",
    eyebrow: "Láminas para colorear",
    h1: "Láminas para colorear con tu foto, para imprimir en casa",
    intro:
      "Elige una foto y REGALUMO la convierte en una lámina para colorear con trazos limpios y zonas cerradas. Puedes ver una muestra gratis al momento y, si te gusta, juntar hasta 12 láminas en un PDF A4 para imprimir las veces que quieras.",
    product: "coloring",
    visual: "coloring",
    cta: "Hacer mi lámina gratis",
    sections: [
      {
        h2: "Para qué usar láminas personalizadas",
        paragraphs: ["Una lámina con caras y lugares conocidos engancha mucho más que un dibujo cualquiera:"],
        bullets: [
          "Una actividad tranquila en un cumpleaños infantil, con la foto del protagonista.",
          "Una tarde de lluvia pintando a la mascota de casa.",
          "Un recuerdo del verano: la playa, el pueblo o la excursión en familia.",
          "Un regalo para los abuelos, para colorear juntos con sus nietos.",
        ],
      },
      {
        h2: "Tres estilos según la edad",
        paragraphs: [
          "Infantil, con menos detalles y trazo grueso para manos pequeñas. Sencillo, equilibrado para la mayoría de edades. Detallado, con más zonas para quien disfruta coloreando con calma. Puedes elegir un estilo distinto en cada lámina.",
        ],
      },
      {
        h2: "Listas para imprimir",
        paragraphs: [
          "Las láminas se entregan en un PDF A4 a 300 ppp, con trazo negro sobre fondo blanco, para que salgan nítidas en cualquier impresora doméstica. La lámina de prueba gratuita tiene resolución limitada y marca de agua; el PDF de pago no.",
        ],
      },
      {
        h2: "Cómo hacer tu lámina en tres pasos",
        paragraphs: [],
        bullets: [
          "Sube una foto con buena luz y un protagonista claro.",
          "Elige el estilo: infantil, sencillo o detallado.",
          "Mira la muestra gratis y, si te gusta, añade más fotos hasta completar tu PDF.",
        ],
      },
    ],
    faq: [
      { q: "¿Puedo hacer una sola lámina?", a: "Sí. La muestra de una lámina es gratis. Si compras, el PDF incluye portada y hasta 12 láminas por 7,99 €." },
      { q: "¿Puedo imprimirlas varias veces?", a: "Sí, para uso privado y familiar puedes imprimir todas las copias que quieras, por ejemplo una para cada niño de la fiesta." },
      { q: "¿Qué fotos salen mejor?", a: "Las que tienen un protagonista claro, buena luz y un fondo sencillo. Las fotos muy oscuras o con mucho fondo dan láminas más confusas." },
      { q: "¿Necesito saber dibujar o usar un programa?", a: "No. Subes la foto desde el móvil o el ordenador y la lámina se genera sola en unos segundos. Solo eliges el estilo." },
    ],
    related: ["foto-para-colorear", "libro-para-colorear-personalizado", "escape-room-para-cumpleanos"],
  },
  {
    slug: "regalos-de-navidad-personalizados",
    label: "Regalos de Navidad personalizados",
    title: "Regalos de Navidad personalizados y originales",
    description:
      "Ideas de regalos de Navidad personalizados: periódico con el año de la familia, escape room para la sobremesa y libro para colorear. Sin esperar envíos.",
    eyebrow: "Navidad y Reyes",
    h1: "Regalos de Navidad personalizados que llegan a tiempo",
    intro:
      "En diciembre los envíos se retrasan y las tiendas se llenan. Un regalo digital personalizado se crea en minutos, se descarga al momento y se imprime en casa o en la copistería de al lado. Pruébalo gratis antes de decidir.",
    product: "all",
    visual: "all",
    cta: "Crear un regalo de Navidad",
    sections: [
      {
        h2: "Tres ideas para estas fiestas",
        bullets: [
          "Un periódico con «el año de la familia»: las fotos y anécdotas del año, con mensajes de cada uno.",
          "Un escape room para la sobremesa de Nochebuena o la tarde de Reyes, con primos, sobrinos y abuelos jugando en equipo.",
          "Un libro para colorear con fotos de la familia para que los peques tengan su regalo hecho a medida.",
        ],
        paragraphs: ["Cada regalo encaja en un momento distinto de las fiestas:"],
      },
      {
        h2: "Para el amigo invisible",
        paragraphs: [
          "Si te ha tocado alguien a quien conoces bien, un periódico con sus anécdotas o un libro para colorear con su mascota sorprende mucho más que un regalo genérico. Y si no sabes qué le gusta, un escape room para jugar entre todos el mismo día funciona con cualquier grupo.",
        ],
      },
      {
        h2: "Cómo presentarlo",
        paragraphs: [
          "Imprime el periódico en A3 y enróllalo con un lazo, mete las láminas en una carpeta con unas pinturas o guarda los sobres del escape room en una caja bajo el árbol. Si prefieres no imprimir, también puedes enviar el PDF por mensaje.",
        ],
      },
      {
        h2: "Ideas según para quién sea",
        paragraphs: ["Guías con más detalle para cada persona de la lista:"],
        links: ["regalo-para-abuelos-personalizado", "regalos-de-reyes-para-ninos", "regalo-amigo-invisible-original", "escape-room-de-navidad", "regalo-de-ultima-hora"],
      },
    ],
    faq: [
      { q: "¿Llega a tiempo para Nochebuena o Reyes?", a: "Sí. No hay envío: el PDF se descarga justo después del pago, así que lo tienes aunque lo compres el mismo día." },
      { q: "¿Hay un pack con los tres regalos?", a: "Sí, el pack de periódico, escape room y libro para colorear cuesta 19,99 €." },
      { q: "¿Puedo probarlo antes?", a: "Sí. Todas las herramientas tienen una prueba gratuita real, sin registro ni tarjeta." },
    ],
    related: ["escape-room-de-navidad", "regalos-de-reyes-para-ninos", "regalo-amigo-invisible-original"],
  },
  {
    slug: "regalo-de-ultima-hora",
    label: "Regalo de última hora",
    title: "Regalo de última hora original, listo hoy mismo",
    description:
      "¿Se te ha echado el tiempo encima? Crea un regalo personalizado en minutos, descarga el PDF al momento e imprímelo hoy. Pruébalo gratis sin registro.",
    eyebrow: "Regalo de última hora",
    h1: "Un regalo de última hora que no lo parece",
    intro:
      "El cumpleaños es hoy, la cena es esta noche o simplemente se te había olvidado. Con REGALUMO creas un regalo personalizado en unos minutos, lo descargas en cuanto pagas y lo imprimes en casa. Nadie notará que lo hiciste a última hora.",
    product: "all",
    visual: "all",
    cta: "Crear mi regalo ahora",
    sections: [
      {
        h2: "Qué puedes tener listo en menos de una hora",
        bullets: [
          "Periódico personalizado: escribe el titular, sube un par de fotos y añade unos mensajes. Unos 15 minutos.",
          "Libro para colorear: elige varias fotos del móvil y ponle título. Unos 10 minutos.",
          "Escape room: elige edad, temática y duración, y dedica unos 20 o 30 minutos a imprimir, recortar y esconder los sobres.",
        ],
        paragraphs: ["Tiempos aproximados contando desde que empiezas hasta tenerlo impreso:"],
      },
      {
        h2: "Si no tienes impresora",
        paragraphs: [
          "Cualquier copistería imprime un PDF en A3 o A4 en el momento. También puedes enviar el archivo por mensaje: el periódico, por ejemplo, queda muy bien como sorpresa en el móvil a primera hora de la mañana.",
        ],
      },
      {
        h2: "Rápido, pero personal",
        paragraphs: [
          "Lo que hace especial al regalo son tus textos y tus fotos, no el tiempo que tardes. Un buen titular, una anécdota que solo conocéis vosotros o la foto de su mascota hacen el trabajo.",
        ],
      },
    ],
    faq: [
      { q: "¿Cuándo recibo el archivo?", a: "Justo después del pago aparece tu página privada de descarga. Guarda el enlace: funciona durante 30 días." },
      { q: "¿Necesito registrarme?", a: "No. Puedes probar y comprar sin crear una cuenta." },
      { q: "¿Y si no me gusta cómo queda?", a: "Lo ves entero antes de pagar y puedes cambiarlo cuantas veces quieras. Solo pagas si te convence." },
    ],
    related: ["periodico-de-cumpleanos", "escape-room-para-imprimir", "regalos-de-navidad-personalizados"],
  },
  {
    slug: "regalo-de-aniversario-original",
    label: "Regalo de aniversario original",
    title: "Regalo de aniversario original: vuestro periódico",
    description:
      "Un regalo de aniversario original: la portada de un periódico con vuestra historia, fotos y mensajes. Edítalo gratis y descarga el PDF A3 para enmarcar.",
    eyebrow: "Regalo de aniversario",
    h1: "Regalo de aniversario original: vuestra historia en portada",
    intro:
      "Cómo os conocisteis, el primer viaje, la casa, los hijos o las mascotas. El periódico de aniversario reúne vuestros momentos en una portada para enmarcar, con titular, fotos y mensajes de quien quieras. Lo editas gratis y solo pagas por el PDF final.",
    product: "newspaper",
    visual: "newspaper",
    cta: "Crear nuestra portada",
    sections: [
      {
        h2: "Ideas para la portada",
        paragraphs: ["Algunas secciones que siempre funcionan:"],
        bullets: [
          "Titular con los años juntos: «Diez años y contando».",
          "La foto del primer viaje y una actual.",
          "La anécdota de cómo os conocisteis, contada con humor.",
          "Mensajes de los hijos, la familia o los amigos de siempre.",
          "Las fechas que marcaron vuestra historia.",
        ],
      },
      {
        h2: "Para cualquier aniversario",
        paragraphs: [
          "Sirve para un primer aniversario de pareja y también para unas bodas de plata o de oro. En ese caso, muchas familias lo preparan entre todos: cada hijo o nieto escribe un mensaje y se regala enmarcado en la comida de celebración.",
        ],
      },
      {
        h2: "Elige el estilo",
        paragraphs: [
          "La plantilla vintage, en tono sepia, queda muy bien para aniversarios largos. La clásica recuerda a un diario de toda la vida y la moderna tiene un toque de color. Puedes cambiar de plantilla sin perder lo escrito.",
        ],
      },
    ],
    faq: [
      { q: "¿Qué tamaño tiene?", a: "A3 vertical (29,7 × 42 cm), pensado para enmarcar. También se puede imprimir en A4." },
      { q: "¿Cuánto cuesta?", a: "6,99 € por el PDF sin marca de agua. Crear y ver la portada es gratis." },
      { q: "¿Se inventa algún dato?", a: "No. La portada solo muestra lo que tú escribes; los textos sugeridos son neutrales y puedes cambiarlos todos." },
    ],
    related: ["periodico-personalizado", "periodico-de-cumpleanos", "regalo-personalizado-con-foto"],
  },
  {
    slug: "periodico-de-boda",
    label: "Periódico de boda",
    title: "Periódico de boda personalizado para los novios",
    description:
      "Crea un periódico de boda con la historia de los novios, sus fotos y mensajes de los invitados. Para regalar, enmarcar o repartir en el banquete.",
    eyebrow: "Bodas",
    h1: "Periódico de boda: la historia de los novios en portada",
    intro:
      "Cómo se conocieron, la pedida, el viaje que lo cambió todo y los mensajes de quienes les quieren. El periódico de boda convierte esa historia en una portada A3 que los novios pueden enmarcar, y que también puedes imprimir en A4 para repartir entre los invitados.",
    product: "newspaper",
    visual: "newspaper",
    cta: "Crear el periódico de la boda",
    sections: [
      {
        h2: "Tres formas de usarlo",
        paragraphs: ["El mismo PDF sirve para varios momentos de la boda:"],
        bullets: [
          "Como regalo para los novios, enmarcado en A3.",
          "Impreso en A4 en cada plato del banquete, para leer mientras llegan los entrantes.",
          "Como sorpresa en la despedida de soltero o soltera, con anécdotas de la pandilla.",
        ],
      },
      {
        h2: "Qué contar en la portada",
        paragraphs: ["Algunas ideas que siempre funcionan:"],
        bullets: [
          "Titular con sus nombres: la plantilla de boda propone «¡Ana se casa!» y puedes cambiarlo.",
          "La foto más antigua que tengáis juntos y una reciente.",
          "La anécdota de cómo se conocieron, contada por quien estaba delante.",
          "Hasta 6 mensajes cortos de familia y amistades.",
          "La fecha de la boda y las fechas que marcaron su historia.",
        ],
      },
      {
        h2: "Prepararlo entre varios",
        paragraphs: [
          "Lo más bonito es que participe más gente. Pide una frase a cada hermano, amigo o padrino unos días antes, escoge las mejores y añádelas como mensajes. Puedes volver al proyecto tantas veces como quieras antes de pagar.",
        ],
      },
    ],
    faq: [
      { q: "¿Puedo imprimir muchas copias para los invitados?", a: "Sí. Para uso privado puedes imprimir todas las copias que necesites del PDF que compras." },
      { q: "¿Cuánto cuesta?", a: "6,99 € por el PDF sin marca de agua. Crear y ver la portada es gratis." },
      { q: "¿Qué plantilla queda mejor para una boda?", a: "La clásica da un aire de diario de toda la vida y la vintage, en sepia, queda muy elegante enmarcada. Puedes cambiar de una a otra sin perder lo escrito." },
    ],
    related: ["regalo-de-aniversario-original", "periodico-personalizado", "regalo-personalizado-con-foto"],
  },
  {
    slug: "regalo-de-jubilacion-original",
    label: "Regalo de jubilación original",
    title: "Regalo de jubilación original: su periódico",
    description:
      "Un regalo de jubilación original: la portada de un periódico con su trayectoria, fotos y mensajes de compañeros y familia. Pruébalo gratis y descarga el PDF.",
    eyebrow: "Jubilaciones",
    h1: "Regalo de jubilación original: una portada para toda una carrera",
    intro:
      "Después de tantos años, la despedida merece algo más que una tarjeta. El periódico de jubilación reúne fotos, anécdotas del trabajo y mensajes de compañeros y familia en una portada que se lee en la comida de despedida y se guarda para siempre.",
    product: "newspaper",
    visual: "newspaper",
    cta: "Crear su periódico de jubilación",
    sections: [
      {
        h2: "Ideal para regalar entre compañeros",
        paragraphs: [
          "Es un regalo fácil de organizar en grupo: una persona crea la portada y el resto manda una frase. Como es digital, nadie tiene que ir a buscarlo a una tienda y se puede imprimir el mismo día de la despedida.",
        ],
      },
      {
        h2: "Qué incluir",
        bullets: [
          "Un titular con su nombre. La plantilla propone «Marta inicia su nueva etapa».",
          "Una foto de sus primeros años en el trabajo y otra reciente.",
          "Hasta 3 anécdotas: la del primer día, la más divertida y la que todos recuerdan.",
          "Mensajes cortos de compañeros, jefes y familia.",
          "Las fechas importantes: el día que empezó y el día que se despide.",
        ],
        paragraphs: ["La portada se adapta a lo que añadas:"],
      },
      {
        h2: "Cómo entregarlo",
        paragraphs: [
          "Imprímelo en A3 y enmárcalo para dárselo en la comida o la cena de despedida. También puedes imprimir copias en A4 para que cada compañero se lleve una de recuerdo.",
        ],
      },
    ],
    faq: [
      { q: "¿Se inventa algún dato de su vida?", a: "No. La portada solo muestra lo que tú escribes. Los textos sugeridos son neutrales y puedes cambiarlos todos." },
      { q: "¿Cuánto cuesta?", a: "6,99 € por el PDF en A3 sin marca de agua. Crear y ver la portada es gratis." },
      { q: "¿Puedo hacerlo el mismo día?", a: "Sí. El PDF se descarga justo después del pago y puedes imprimirlo en cualquier copistería." },
    ],
    related: ["periodico-personalizado", "regalo-de-ultima-hora", "periodico-de-cumpleanos"],
  },
  {
    slug: "regalos-de-reyes-para-ninos",
    label: "Regalos de Reyes para niños",
    title: "Regalos de Reyes para niños personalizados",
    description:
      "Ideas de regalos de Reyes para niños: un libro para colorear con sus fotos o un escape room para jugar en familia. Se crean en minutos y sin esperar envíos.",
    eyebrow: "Reyes Magos",
    h1: "Regalos de Reyes para niños que se ven en cada página",
    intro:
      "Un libro para colorear donde aparecen ellos, sus primos o su perro, o una aventura de escape room para resolver en familia la mañana del 6 de enero. Los dos se personalizan en minutos, se descargan al momento y no dependen de que llegue un paquete a tiempo.",
    product: "all",
    visual: "all",
    cta: "Crear su regalo de Reyes",
    sections: [
      {
        h2: "Un libro para colorear con su familia",
        paragraphs: [
          "Elige fotos de los peques, los abuelos o la mascota y conviértelas en láminas para colorear. El libro tiene portada con título y hasta 12 láminas. Para los más pequeños, el estilo infantil tiene menos detalles y trazos más gruesos.",
        ],
      },
      {
        h2: "Un escape room para la mañana de Reyes",
        paragraphs: [
          "Después de abrir los regalos, una aventura con historia, acertijos y un cofre final. Hay retos pensados desde los 5 años, el protagonista puede ser el propio niño o niña y el premio del cofre puede ser el último regalo.",
        ],
      },
      {
        h2: "Cómo presentarlo",
        bullets: [
          "Imprime el libro, grápalo o encuadérnalo en una copistería y déjalo junto a unas pinturas.",
          "Mete el primer sobre del escape room en el zapato, con una nota de los Reyes.",
          "Guarda el PDF: puedes volver a imprimir las láminas cuando se terminen.",
        ],
        paragraphs: ["Algunas ideas para el día 6:"],
      },
    ],
    faq: [
      { q: "¿Para qué edades sirve?", a: "El libro para colorear tiene un estilo infantil para los más pequeños. El escape room tiene retos desde 5 años hasta adultos." },
      { q: "¿Cuánto cuesta?", a: "El libro para colorear cuesta 7,99 € y el escape room 9,99 €. El pack con los tres regalos cuesta 19,99 €." },
      { q: "¿Llega a tiempo?", a: "Sí. No hay envío: el PDF se descarga justo después del pago, aunque sea la noche del 5 de enero." },
    ],
    related: ["regalos-de-navidad-personalizados", "libro-para-colorear-personalizado", "escape-room-para-cumpleanos"],
  },
  {
    slug: "regalo-amigo-invisible-original",
    label: "Amigo invisible original",
    title: "Regalo de amigo invisible original y personal",
    description:
      "Ideas de regalo de amigo invisible original por menos de 10 €: un periódico con sus anécdotas, láminas para colorear o un escape room para el grupo.",
    eyebrow: "Amigo invisible",
    h1: "Un amigo invisible original que no acaba en el cajón",
    intro:
      "La taza, los calcetines, la vela de siempre. Si te ha tocado alguien a quien conoces, un regalo personalizado sorprende mucho más y cabe en el presupuesto habitual: cada producto cuesta menos de 10 € y lo pruebas gratis antes de pagar.",
    product: "all",
    visual: "all",
    cta: "Crear mi amigo invisible",
    sections: [
      {
        h2: "Según a quién te haya tocado",
        bullets: [
          "Alguien con mucha historia en el grupo: un periódico con sus anécdotas y una foto mítica (6,99 €).",
          "Alguien con mascota o con hijos pequeños: un libro para colorear con sus fotos (7,99 €).",
          "Si no sabes qué le gusta: un escape room para que lo juegue todo el grupo después de la cena (9,99 €).",
        ],
        paragraphs: ["Tres ideas que encajan con casi cualquier persona:"],
      },
      {
        h2: "Para el amigo invisible del trabajo",
        paragraphs: [
          "Un periódico con el titular de su mejor momento del año en la oficina funciona muy bien, siempre que el humor sea con cariño. Cuenta solo lo que sabes que le hará gracia: la portada muestra únicamente lo que tú escribes.",
        ],
      },
      {
        h2: "Cómo entregarlo",
        paragraphs: [
          "Imprímelo, enróllalo con un lazo y ponle una etiqueta con su nombre. Si el amigo invisible es a distancia, puedes mandar el PDF por mensaje el día del sorteo.",
        ],
      },
    ],
    faq: [
      { q: "¿Cuánto cuesta?", a: "El periódico cuesta 6,99 €, el libro para colorear 7,99 € y el escape room 9,99 €. Crear y ver el resultado es gratis." },
      { q: "¿Sabrá que lo he hecho yo?", a: "Solo si tú quieres: no hace falta firmar la portada, y el PDF no lleva tu nombre salvo que lo escribas." },
      { q: "¿Hay que registrarse?", a: "No. Puedes probar y comprar sin crear una cuenta." },
    ],
    related: ["regalos-de-navidad-personalizados", "regalo-de-ultima-hora", "regalo-personalizado-con-foto"],
  },
  {
    slug: "escape-room-de-navidad",
    label: "Escape room de Navidad",
    title: "Escape room de Navidad para imprimir en familia",
    description:
      "Un escape room navideño para imprimir: historia del duende Cascabel, acertijos según la edad, pistas y soluciones. Para Nochebuena o Reyes. Demo gratis.",
    eyebrow: "Escape room navideño",
    h1: "Escape room de Navidad para jugar en familia",
    intro:
      "El duende Cascabel ha escondido los regalos en un baúl y ha olvidado la palabra que lo abre. Tu familia tendrá que resolver sus acertijos repartidos por la casa. Eliges la edad, la dificultad y la duración, y te llevas un PDF listo para imprimir con historia, retos, pistas y soluciones.",
    product: "escape",
    visual: "escape",
    cta: "Probar el escape navideño gratis",
    ctaHref: "/crear/escape-room?tema=navidad",
    sections: [
      {
        h2: "Cuándo jugarlo estas fiestas",
        paragraphs: ["Funciona en cualquier reunión en la que haya un rato tranquilo:"],
        bullets: [
          "En la sobremesa de Nochebuena o de Navidad, con primos, tíos y abuelos en el mismo equipo.",
          "La mañana de Reyes: el último regalo espera dentro del «baúl».",
          "En Nochevieja, antes de las campanadas, para que los peques aguanten despiertos.",
          "Una tarde de vacaciones de Navidad en casa o con los amigos del cole.",
        ],
      },
      {
        h2: "Qué incluye",
        paragraphs: ["El mismo juego completo que el resto de temáticas, ambientado en Navidad:"],
        bullets: [
          "La historia del duende Cascabel para leer en voz alta.",
          "Entre 4 y 9 retos según la edad: búsqueda por casa, puzle recortable, disco descifrador, rejilla secreta, código de símbolos, adivinanzas navideñas, laberintos, candados y lógica.",
          "Tarjetas de recompensa con letras que forman la palabra que abre el baúl.",
          "Dos pistas por acertijo, guía del organizador, soluciones y diploma final.",
        ],
      },
      {
        h2: "Para todas las edades de la familia",
        paragraphs: [
          "Al elegir la edad cambia el tipo de reto: contar figuras y laberintos para 5 a 7 años, cifrados sencillos para 8 a 11, y lógica y series numéricas para jóvenes y adultos. Si juegan pequeños y mayores juntos, elige la edad del más pequeño y que los adultos ayuden con las pistas.",
        ],
      },
      {
        h2: "Cómo prepararlo en 20 minutos",
        paragraphs: [
          "Imprime el PDF, recorta las tarjetas y mete cada acertijo en un sobre. Escóndelos junto al árbol, en el belén, dentro de un calcetín o bajo el plato del turrón. Un baúl o una caja de zapatos con lazo hace de cofre final.",
        ],
      },
    ],
    faq: [
      { q: "¿Es un juego distinto al escape room normal?", a: "Usa el mismo generador, con historia, palabras y ambientación de Navidad. Cada partida se crea con tus datos: edad, dificultad, duración y protagonista." },
      { q: "¿Llega a tiempo para Nochebuena?", a: "Sí. No hay envío: el PDF se descarga justo después del pago, aunque lo compres el mismo día." },
      { q: "¿Cuánto cuesta?", a: "9,99 € el juego completo, y puedes imprimirlo tantas veces como quieras para tu familia. La demo de 3 retos es gratis." },
    ],
    related: ["regalos-de-navidad-personalizados", "regalos-de-reyes-para-ninos", "escape-room-para-imprimir"],
  },
  {
    slug: "regalo-para-abuelos-personalizado",
    label: "Regalo para abuelos",
    title: "Regalo personalizado para abuelos con fotos",
    description:
      "Ideas de regalo personalizado para abuelos: un periódico con la historia de la familia o láminas para colorear con fotos de sus nietos. Pruébalo gratis.",
    eyebrow: "Para los abuelos",
    h1: "Un regalo personalizado para los abuelos, hecho con sus nietos",
    intro:
      "A los abuelos casi nunca les falta de nada, pero siempre les emociona lo que habla de su familia. Con REGALUMO puedes crear un periódico con su historia o un libro para colorear con fotos de sus nietos, en minutos y sin esperar envíos.",
    product: "all",
    visual: "all",
    cta: "Crear el regalo de los abuelos",
    sections: [
      {
        h2: "Un periódico con la historia de la familia",
        paragraphs: [
          "La noticia principal son ellos: cómo se conocieron, la casa del pueblo, las comidas de los domingos. Añade fotos antiguas y actuales, las fechas importantes y mensajes de hijos y nietos. Impreso en A3 y enmarcado, se queda colgado en el salón durante años.",
        ],
      },
      {
        h2: "Láminas para colorear con sus nietos",
        paragraphs: [
          "Convierte fotos de los nietos en láminas para colorear y regálalas con unas pinturas. Es un plan para hacer juntos en la próxima visita, y los dibujos terminados acaban en la nevera.",
        ],
      },
      {
        h2: "Para qué ocasiones",
        bullets: [
          "Navidad y Reyes, cuando toda la familia se reúne.",
          "Su cumpleaños, sobre todo si es redondo: 70, 80 o 90 años.",
          "Bodas de oro o de plata.",
          "El Día de los Abuelos, el 26 de julio.",
        ],
        paragraphs: ["Funciona en cualquier celebración familiar:"],
      },
      {
        h2: "Cómo hacerlo entre todos",
        paragraphs: [
          "Pide a cada hijo y nieto una frase o un recuerdo por mensaje y añádelos en «Cartas de los lectores». Si los nietos son pequeños, pueden colorear una lámina cada uno y entregarla junto al periódico.",
        ],
      },
    ],
    faq: [
      { q: "¿Hace falta que los abuelos usen el móvil?", a: "No. El regalo se imprime en papel, así que pueden disfrutarlo sin pantallas." },
      { q: "¿Qué fotos antiguas sirven?", a: "Puedes hacer una foto con el móvil a una foto en papel. Mejor con buena luz y sin reflejos." },
      { q: "¿Cuánto cuesta?", a: "El periódico cuesta 6,99 € y el libro para colorear 7,99 €. El pack con los tres regalos cuesta 19,99 €." },
    ],
    related: ["periodico-de-cumpleanos", "regalo-de-aniversario-original", "regalos-de-navidad-personalizados"],
  },
];

export function getSeoPage(slug: string) {
  return SEO_PAGES.find((p) => p.slug === slug);
}

/** FAQ general de la página principal. */
export const HOME_FAQ = [
  { q: "¿Tengo que registrarme para probar?", a: "No. Pulsa «Crear gratis», introduce tus datos y verás el resultado al momento. Para comprar solo necesitas pagar; el correo es opcional." },
  { q: "¿Qué es gratis y qué es de pago?", a: "Crear, previsualizar y modificar es gratis. Pagas solo para descargar el archivo final en alta calidad y sin marca de agua. En cada herramienta verás exactamente qué incluye cada opción." },
  { q: "¿Cómo recibo mi compra?", a: "Justo después del pago aparece tu página privada de descarga, con un botón para copiar el enlace. Guárdalo: funciona durante 30 días. Si lo pierdes, escríbenos con el correo de tu pago y te lo reenviamos." },
  { q: "¿Qué pasa con mis fotos y datos?", a: "Se guardan en privado, solo para crear tu regalo. No se publican ni se indexan, puedes borrarlos en cualquier momento y los proyectos sin pagar se eliminan automáticamente." },
  { q: "¿Usáis inteligencia artificial?", a: "Usamos generación automática propia (plantillas, algoritmos y comprobaciones) que funciona al instante y sin coste para ti. Cuando una función necesite un servicio externo de IA, lo indicaremos claramente." },
  { q: "¿Puedo pedir un reembolso?", a: "Al tratarse de contenido digital personalizado que se entrega al instante, el derecho de desistimiento se pierde al iniciar la descarga, y así lo aceptas antes de pagar. Si hay un problema técnico con tu archivo, escríbenos y lo solucionamos." },
];
