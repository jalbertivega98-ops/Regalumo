/**
 * Temáticas del escape room. Todo el texto es original de REGALUMO.
 * {heroe} = nombre del protagonista (opcional), {equipo} = nombre del equipo.
 */
export type ThemeId = "piratas" | "espacio" | "detectives" | "magia" | "selva" | "museo" | "navidad";

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  title: string;
  /** Palabras temáticas en mayúsculas, sin tildes ni Ñ (para sopas, anagramas y cifrados). */
  words: string[];
  intro: string;
  guardian: string;
  chapters: string[];
  ending: string;
  prize: string;
  /** Nombres para los acertijos de lógica. */
  people: [string, string, string, string];
  colors: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  piratas: {
    id: "piratas",
    name: "Piratas",
    emoji: "🏴‍☠️",
    title: "El tesoro de la isla Brumosa",
    words: ["ANCLA", "TIMON", "MAPA", "BRUJULA", "LORO", "COFRE", "BARCO", "ISLA", "MONEDA", "VELA", "OLA", "CATALEJO"],
    intro:
      "La vieja capitana Brisa dejó escondido su tesoro antes de retirarse a contar historias en el puerto. Antes de marcharse, repartió sus pistas en sobres sellados y dejó al loro Perejil como guardián. {heroe_frase}Solo una tripulación valiente y unida podrá reunir todas las piezas y descubrir la palabra que abre el cofre.",
    guardian: "el loro Perejil",
    chapters: [
      "El primer sobre huele a sal y a madera vieja.",
      "Una gaviota ha dejado caer un papel arrugado junto a la bodega.",
      "En el camarote de la capitana hay un mensaje escrito con tinta de calamar.",
      "El viento cambia: la siguiente pista está cerca del timón.",
      "Las olas traen una botella con un mensaje dentro.",
      "Bajo la cubierta, alguien ha rayado unas marcas en la madera.",
      "El catalejo apunta a una roca con forma de calavera.",
      "Ya se ve la playa de la isla Brumosa.",
      "Solo queda un obstáculo antes del cofre.",
    ],
    ending: "¡El cofre se abre con un crujido! La tripulación ha demostrado que el mejor tesoro es haberlo conseguido juntos.",
    prize: "el cofre del tesoro",
    people: ["Coral", "Bruno", "Marina", "Teo"],
    colors: "Azul océano y arena",
  },
  espacio: {
    id: "espacio",
    name: "Espacio",
    emoji: "🚀",
    title: "Misión Estrella Perdida",
    words: ["COHETE", "PLANETA", "LUNA", "ESTRELLA", "COMETA", "ORBITA", "GALAXIA", "SATELITE", "ASTRO", "NAVE", "MARTE", "RADAR"],
    intro:
      "La estación orbital Aurora ha perdido el contacto con la Estrella Guía, la luz que ayuda a las naves a volver a casa. El ordenador de a bordo, ZUMO-3, ha cifrado los códigos de reinicio en varios módulos de la nave. {heroe_frase}Vuestro equipo de astronautas debe recuperarlos antes de que se agote el oxígeno de la misión.",
    guardian: "el robot ZUMO-3",
    chapters: [
      "Se enciende una luz parpadeante en el panel de control.",
      "El módulo de carga emite un pitido extraño.",
      "Un mensaje llega desde la antena de la nave.",
      "El radar detecta algo en el laboratorio de gravedad cero.",
      "ZUMO-3 proyecta un holograma con un nuevo reto.",
      "En la cápsula de descanso hay una nota flotando.",
      "El telescopio enfoca una constelación desconocida.",
      "La Estrella Guía empieza a brillar débilmente.",
      "Último código antes de reiniciar el sistema.",
    ],
    ending: "¡La Estrella Guía vuelve a brillar! Gracias a vuestro trabajo en equipo, todas las naves encuentran el camino a casa.",
    prize: "la cápsula de la Estrella Guía",
    people: ["Vega", "Leo", "Nova", "Altair"],
    colors: "Azul noche y neón",
  },
  detectives: {
    id: "detectives",
    name: "Detectives",
    emoji: "🔎",
    title: "El caso del reloj desaparecido",
    words: ["LUPA", "HUELLA", "PISTA", "CODIGO", "SOSPECHA", "TESTIGO", "MAPA", "NOTA", "LLAVE", "SOMBRERO", "CAMARA", "SECRETO"],
    intro:
      "El valioso reloj de la familia ha desaparecido justo antes de la gran celebración. Quien se lo llevó no quería hacer daño: ha dejado una cadena de pistas para comprobar si hay buenos detectives en la casa. {heroe_frase}Abrid bien los ojos, porque cualquier detalle puede ser importante.",
    guardian: "el inspector Bigotes",
    chapters: [
      "En el suelo hay una huella diminuta.",
      "Alguien ha escrito algo en una servilleta.",
      "El testigo principal recuerda una frase extraña.",
      "En el cajón aparece una nota doblada en cuatro.",
      "La lupa revela unas letras escondidas.",
      "El sospechoso ha dejado caer un papel al huir.",
      "Una fotografía antigua tiene algo escrito por detrás.",
      "Las pistas empiezan a encajar.",
      "Solo falta la última prueba para cerrar el caso.",
    ],
    ending: "¡Caso resuelto! El reloj aparece justo a tiempo y la agencia de detectives recibe su primera medalla.",
    prize: "la caja del reloj",
    people: ["Inés", "Hugo", "Clara", "Pablo"],
    colors: "Marrón tweed y amarillo",
  },
  magia: {
    id: "magia",
    name: "Magia",
    emoji: "🪄",
    title: "La escuela de los hechizos olvidados",
    words: ["VARITA", "POCION", "HECHIZO", "BRUJA", "LIBRO", "CALDERO", "ESCOBA", "MAGO", "CRISTAL", "LECHUZA", "CAPA", "RUNA"],
    intro:
      "En la escuela de magia de Villabruma, una ráfaga de viento ha desordenado el Gran Libro de Hechizos y sus páginas han volado por todas partes. La directora, la maga Ortiga, necesita aprendices capaces de recuperarlas. {heroe_frase}Cada página encontrada os acerca a la palabra mágica que lo devuelve todo a su sitio.",
    guardian: "la lechuza Ramona",
    chapters: [
      "Una página brilla con una luz violeta.",
      "El caldero burbujea y deja ver un mensaje.",
      "La lechuza Ramona trae un pergamino en el pico.",
      "Una escoba se mueve sola y señala un rincón.",
      "Los cristales mágicos muestran una inscripción.",
      "En la biblioteca prohibida hay un libro abierto.",
      "La poción cambia de color al acercarse una pista.",
      "El Gran Libro casi está completo.",
      "Falta la última página, la más difícil.",
    ],
    ending: "¡El Gran Libro de Hechizos vuelve a estar completo! La maga Ortiga nombra a todo el grupo aprendices de honor.",
    prize: "el cofre del Gran Libro",
    people: ["Ortiga", "Romero", "Salvia", "Tomillo"],
    colors: "Violeta y dorado",
  },
  selva: {
    id: "selva",
    name: "Selva",
    emoji: "🌿",
    title: "La expedición del templo escondido",
    words: ["LIANA", "MONO", "TUCAN", "TEMPLO", "RIO", "JAGUAR", "HOJA", "MAPA", "PUENTE", "LIBELULA", "BAMBU", "ROCA"],
    intro:
      "Una expedición de exploradores ha encontrado la entrada de un templo cubierto de lianas. En su puerta hay un mensaje: solo quien supere las pruebas de la selva podrá ver lo que guarda dentro. {heroe_frase}El tucán Pipo os acompañará, pero cuidado: le encanta hablar en acertijos.",
    guardian: "el tucán Pipo",
    chapters: [
      "Entre las hojas aparece una piedra tallada.",
      "El río arrastra un tronco con símbolos grabados.",
      "Un mono travieso os lanza un papel enrollado.",
      "Las lianas forman letras en la pared del templo.",
      "El jaguar duerme junto a la siguiente pista.",
      "Una libélula se posa sobre un mensaje secreto.",
      "El puente colgante esconde algo bajo sus tablas.",
      "La puerta del templo empieza a abrirse.",
      "Una última prueba protege la sala principal.",
    ],
    ending: "¡La sala del templo se ilumina! Dentro hay un regalo para la expedición más valiente de la selva.",
    prize: "la caja del templo",
    people: ["Selva", "Río", "Luna", "Bosco"],
    colors: "Verde selva y naranja",
  },
  museo: {
    id: "museo",
    name: "Misterio en el museo",
    emoji: "🏛️",
    title: "Una noche en el museo",
    words: ["CUADRO", "ESTATUA", "MOMIA", "FOSIL", "VITRINA", "GUARDIA", "LINTERNA", "MARCO", "ESCULTURA", "JARRON", "DIBUJO", "SALA"],
    intro:
      "Al cerrar el museo, el guardia nocturno descubre que las obras de arte han cambiado de sitio. Una nota firmada por 'El Artista Misterioso' propone un reto: resolver sus enigmas antes del amanecer para devolver cada pieza a su lugar. {heroe_frase}Linterna en mano, empieza la noche más curiosa del museo.",
    guardian: "el guardia Anselmo",
    chapters: [
      "El cuadro de la entrada está ligeramente torcido.",
      "Una estatua sostiene un papel que no estaba antes.",
      "En la sala de los dinosaurios se oye un crujido.",
      "La vitrina de las joyas refleja unas letras.",
      "El mapa del museo tiene una sala marcada en rojo.",
      "La momia lleva una etiqueta nueva atada al tobillo.",
      "La linterna ilumina un mensaje en la pared.",
      "Casi todas las obras están en su sitio.",
      "El Artista Misterioso deja su último enigma.",
    ],
    ending: "¡Amanece y cada obra está en su lugar! El Artista Misterioso deja una nota de felicitación para el equipo.",
    prize: "la caja del Artista Misterioso",
    people: ["Frida", "Diego", "Sofía", "Pablo"],
    colors: "Burdeos y dorado",
  },
  navidad: {
    id: "navidad",
    name: "Navidad",
    emoji: "🎄",
    title: "La noche de los regalos escondidos",
    words: ["REGALO", "ESTRELLA", "TRINEO", "RENO", "NIEVE", "ABETO", "CAMPANA", "TURRON", "BOLA", "LAZO", "GUIRNALDA", "CARTA"],
    intro:
      "Esta noche los regalos tenían que estar junto al árbol, pero el duende Cascabel, que es muy despistado, los guardó en un baúl para que nadie los viera antes de tiempo… y ha olvidado la palabra que lo abre. Por suerte, fue dejando pistas por toda la casa para acordarse. {heroe_frase}Si resolvéis sus acertijos antes de la cena, los regalos llegarán a tiempo.",
    guardian: "el duende Cascabel",
    chapters: [
      "Junto al árbol hay un sobre con olor a canela.",
      "Una bola del árbol tiene algo escrito por dentro.",
      "En la cocina, alguien ha dejado una nota bajo el plato del turrón.",
      "El calcetín de la chimenea esconde un papel doblado.",
      "Se oyen cascabeles: la siguiente pista está cerca de la ventana.",
      "Una carta sin terminar aparece encima de la mesa.",
      "Las luces del árbol parpadean y señalan un rincón.",
      "El baúl de los regalos ya está a la vista.",
      "Solo queda un reto antes de abrir el baúl.",
    ],
    ending: "¡El baúl se abre y los regalos vuelven a su sitio junto al árbol! El duende Cascabel promete apuntarse la palabra para el año que viene.",
    prize: "el baúl de los regalos",
    people: ["Noelia", "Gaspar", "Nieves", "Mateo"],
    colors: "Rojo, verde y dorado",
  },
};

/** Palabra final por número de acertijos: se forma con las letras de las tarjetas de recompensa. */
export const FINAL_WORDS: Record<ThemeId, Record<number, string>> = {
  piratas: { 4: "ISLA", 5: "PERLA", 6: "GALEON", 7: "TESOROS", 8: "CORSARIO", 9: "BUCANEROS" },
  espacio: { 4: "LUNA", 5: "ORION", 6: "COSMOS", 7: "GALAXIA", 8: "PLANETAS", 9: "ASTRONAVE" },
  detectives: { 4: "CASO", 5: "PISTA", 6: "ENIGMA", 7: "DETALLE", 8: "MISTERIO", 9: "DETECTIVE" },
  magia: { 4: "MAGO", 5: "HADAS", 6: "VARITA", 7: "HECHIZO", 8: "AMULETOS", 9: "ENCANTADO" },
  selva: { 4: "RANA", 5: "TUCAN", 6: "JAGUAR", 7: "PANTERA", 8: "AVENTURA", 9: "ANACONDAS" },
  museo: { 4: "ARTE", 5: "MUSAS", 6: "TESORO", 7: "PINTURA", 8: "RELIQUIA", 9: "ESCULTURA" },
  navidad: { 4: "RENO", 5: "BELEN", 6: "REGALO", 7: "CAMPANA", 8: "ESTRELLA", 9: "GUIRNALDA" },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
