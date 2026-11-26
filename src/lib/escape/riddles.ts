import type { ThemeId } from "./themes";

/** Adivinanzas (tradición popular española o redacción propia) con respuestas inequívocas. */
export interface Riddle {
  text: string;
  answer: string;
  accept: string[];
  hint: string;
  ages: ("peques" | "ninos" | "jovenes" | "adultos")[];
  /** Si se indica, solo sale en esas temáticas (y tiene preferencia sobre las genéricas). */
  themes?: ThemeId[];
}

const K = ["peques", "ninos"] as const;
const N = ["ninos", "jovenes"] as const;
const A = ["jovenes", "adultos"] as const;

export const RIDDLES: Riddle[] = [
  { text: "Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.", answer: "pera", accept: ["pera"], hint: "Es una fruta, y la respuesta está escondida en la última palabra.", ages: [...K] },
  { text: "Tengo agujas pero no sé coser; tengo números pero no sé leer.", answer: "reloj", accept: ["reloj"], hint: "Sirve para saber la hora.", ages: [...K, "jovenes"] },
  { text: "Tiene dientes y no come; tiene barba y no es hombre.", answer: "ajo", accept: ["ajo", "ajos"], hint: "Se usa en la cocina y tiene un olor muy fuerte.", ages: [...N] },
  { text: "Vuela sin alas, silba sin boca y empuja sin manos.", answer: "viento", accept: ["viento", "aire"], hint: "Mueve las hojas de los árboles.", ages: [...K, "jovenes"] },
  { text: "Lleva su casa a cuestas y camina sin tener patas.", answer: "caracol", accept: ["caracol", "babosa"], hint: "Es lento y sale cuando llueve.", ages: [...K] },
  { text: "Mi madre es tartamuda, mi padre es cantador; tengo blanco mi vestido y amarillo el corazón.", answer: "huevo", accept: ["huevo", "huevos"], hint: "Lo pone una gallina.", ages: [...K, "jovenes"] },
  { text: "Cuatro patas tiene y no puede andar; tiene cabecera y no sabe hablar.", answer: "cama", accept: ["cama"], hint: "Duermes en ella cada noche.", ages: [...K] },
  { text: "Tengo hojas sin ser árbol y lomo sin ser animal.", answer: "libro", accept: ["libro", "cuaderno"], hint: "Lo abres para leer.", ages: [...N] },
  { text: "Sube llena y baja vacía; si no se da prisa, la sopa se enfría.", answer: "cuchara", accept: ["cuchara"], hint: "Es un cubierto.", ages: [...K] },
  { text: "Tiene corona y no es rey; tiene escamas y no es pez.", answer: "piña", accept: ["pina", "anana", "ananas"], hint: "Es una fruta tropical.", ages: [...N] },
  { text: "Redondo, redondo, sin tapa y sin fondo.", answer: "anillo", accept: ["anillo", "aro", "sortija"], hint: "Se lleva en un dedo.", ages: [...K, "jovenes"] },
  { text: "Tiene cuello y no tiene cabeza; tiene brazos y no tiene manos.", answer: "camisa", accept: ["camisa", "jersey", "camiseta"], hint: "Es una prenda de ropa.", ages: [...N] },
  { text: "Vuelo de noche, duermo de día, y nunca verás plumas en el ala mía.", answer: "murciélago", accept: ["murcielago"], hint: "Duerme boca abajo.", ages: [...N] },
  { text: "Soy alta y delgada, tengo un solo ojo y hago vestidos sin tijeras.", answer: "aguja", accept: ["aguja"], hint: "Se usa con hilo.", ages: [...N] },
  { text: "Tengo teclas blancas y negras y suena música si me tocas.", answer: "piano", accept: ["piano", "teclado"], hint: "Es un instrumento musical.", ages: [...K] },
  { text: "Brillo en la noche, cambio de forma y a veces desaparezco.", answer: "luna", accept: ["luna"], hint: "Está en el cielo y no es una estrella.", ages: [...K] },
  { text: "Vuelo alto sin ser pájaro, tengo cola sin ser perro y alguien me sujeta con un hilo.", answer: "cometa", accept: ["cometa"], hint: "Se hace volar en días de viento.", ages: [...K, "jovenes"] },
  { text: "Todos me pisan y yo no piso a nadie; todos preguntan por mí y yo no pregunto por nadie.", answer: "calle", accept: ["calle", "camino", "suelo"], hint: "Tiene nombre y número de portal.", ages: [...N] },
  { text: "¿Qué cosa, cuanto más se seca, más mojada está?", answer: "toalla", accept: ["toalla"], hint: "La usas al salir de la ducha.", ages: [...N, "adultos"] },
  { text: "Cuanto más le quitas, más grande se hace.", answer: "agujero", accept: ["agujero", "hoyo", "pozo"], hint: "Piensa en cavar.", ages: [...A] },
  { text: "Es tuyo, pero los demás lo usan mucho más que tú.", answer: "nombre", accept: ["nombre", "minombre"], hint: "Te lo pusieron al nacer.", ages: [...A] },
  { text: "Si me nombras, desaparezco.", answer: "silencio", accept: ["silencio"], hint: "En una biblioteca te lo piden.", ages: [...A] },
  { text: "Tengo ciudades sin casas, montañas sin árboles y ríos sin agua.", answer: "mapa", accept: ["mapa", "plano", "atlas"], hint: "Lo usan los exploradores para orientarse.", ages: [...A] },
  { text: "Siempre sube y nunca baja.", answer: "edad", accept: ["edad", "losanos", "anos"], hint: "Cambia en cada cumpleaños.", ages: [...A] },
  { text: "Cuanta más hay, menos ves.", answer: "oscuridad", accept: ["oscuridad", "niebla", "noche"], hint: "Desaparece al encender la luz.", ages: [...A] },
  { text: "Puedo llenar una habitación entera sin ocupar ningún espacio.", answer: "luz", accept: ["luz", "laluz"], hint: "Llega al pulsar un interruptor.", ages: [...A] },
  { text: "Tengo llaves pero no abro ninguna puerta; tengo espacio pero ninguna habitación.", answer: "teclado", accept: ["teclado"], hint: "Está junto al ordenador.", ages: [...A] },
  { text: "Siempre está delante de ti, pero nunca puedes verlo.", answer: "futuro", accept: ["futuro", "manana", "elfuturo"], hint: "Es lo que todavía no ha pasado.", ages: [...A] },

  /* ---- Adivinanzas de cada temática (redacción propia) ---- */
  { themes: ["navidad"], text: "Soy blanca y fría, caigo del cielo sin hacer ruido y con mis copos se hacen muñecos.", answer: "nieve", accept: ["nieve"], hint: "En invierno cubre las montañas.", ages: [...K] },
  { themes: ["navidad"], text: "Tengo nariz de zanahoria, botones de carbón y, si sale el sol, me derrito.", answer: "muñeco", accept: ["muneco", "munecodenieve", "munecosdenieve"], hint: "Se construye con nieve en el jardín.", ages: [...K] },
  { themes: ["navidad"], text: "Soy verde todo el año, pero en diciembre me visten de luces y me ponen una estrella en la cabeza.", answer: "árbol", accept: ["arbol", "abeto", "pino", "arboldenavidad"], hint: "Debajo de él se dejan los regalos.", ages: [...K, "jovenes"] },
  { themes: ["navidad"], text: "Puedo ser duro o blando; me hacen con almendra y miel, y en diciembre no falto en la mesa.", answer: "turrón", accept: ["turron", "turrones"], hint: "Es un dulce típico de Navidad.", ages: [...N] },
  { themes: ["navidad"], text: "Tengo lengua y no hablo, tengo boca y no como; si me mueves, canto con voz de metal.", answer: "campana", accept: ["campana", "campanas", "cascabel"], hint: "Suena en las torres de las iglesias.", ages: [...N, "adultos"] },
  { themes: ["navidad"], text: "Somos doce, pequeñas y redondas, y nos comen deprisa con cada campanada.", answer: "uvas", accept: ["uvas", "uva", "lasuvas"], hint: "Se toman la última noche del año.", ages: [...A] },
  { themes: ["navidad"], text: "Me escriben con deseos, me cierran con un sello y viajo hasta tres reyes que vienen de Oriente.", answer: "carta", accept: ["carta", "cartas", "cartaalosreyes"], hint: "Se envía antes del 6 de enero.", ages: [...A] },
  { themes: ["piratas"], text: "Tengo una aguja que no cose y siempre señalo hacia el norte.", answer: "brújula", accept: ["brujula"], hint: "Sirve para orientarse en el mar.", ages: [...K, "jovenes"] },
  { themes: ["piratas"], text: "Miro muy lejos sin tener ojos; cuanto más me estiras, mejor ves.", answer: "catalejo", accept: ["catalejo", "telescopio", "prismaticos"], hint: "La capitana se lo pone en un ojo para ver otros barcos.", ages: [...N, "adultos"] },
  { themes: ["piratas"], text: "Me tiran al agua con una cadena y, mientras esté en el fondo, el barco no se mueve.", answer: "ancla", accept: ["ancla", "ancora"], hint: "Es de hierro y muy pesada.", ages: [...N, "adultos"] },
  { themes: ["piratas"], text: "Tengo plumas de colores, vivo en el hombro del pirata y repito todo lo que oigo.", answer: "loro", accept: ["loro", "papagayo", "cotorra"], hint: "Es un pájaro que habla.", ages: [...K] },
  { themes: ["espacio"], text: "Voy al espacio con fuego en los pies y, cuando despego, todo tiembla.", answer: "cohete", accept: ["cohete", "nave", "naveespacial"], hint: "Se lanza con una cuenta atrás.", ages: [...K] },
  { themes: ["espacio"], text: "Llevo casco y traje blanco, y en mi trabajo floto sin nadar.", answer: "astronauta", accept: ["astronauta", "astronautas", "cosmonauta"], hint: "Es una profesión.", ages: [...K, "jovenes"] },
  { themes: ["espacio"], text: "De día me escondo y de noche brillo; parezco pequeña, pero soy un sol lejano.", answer: "estrella", accept: ["estrella", "estrellas"], hint: "Se dibuja con cinco puntas.", ages: [...N] },
  { themes: ["espacio"], text: "Doy vueltas al Sol y llevo anillos, pero ningún dedo.", answer: "Saturno", accept: ["saturno"], hint: "Es un planeta.", ages: [...A] },
  { themes: ["detectives"], text: "Me pones delante del ojo y lo pequeño se vuelve grande.", answer: "lupa", accept: ["lupa", "lente"], hint: "Es la herramienta favorita de los detectives.", ages: [...K, "jovenes"] },
  { themes: ["detectives"], text: "Las dejas al pisar y en los dedos también las tienes; el detective las sigue.", answer: "huellas", accept: ["huellas", "huella", "pisadas"], hint: "Se ven en el barro o en un cristal.", ages: [...N] },
  { themes: ["detectives"], text: "Es lo que dice el sospechoso para librarse: «a esa hora yo estaba en otro sitio».", answer: "coartada", accept: ["coartada"], hint: "Empieza por «coar».", ages: [...A] },
  { themes: ["magia"], text: "Soy un palito que no es lápiz: si me agitas y dices las palabras, aparecen cosas.", answer: "varita", accept: ["varita", "varitamagica", "vara"], hint: "La llevan los magos y las hadas.", ages: [...K, "jovenes"] },
  { themes: ["magia"], text: "Me llevan en la cabeza y de mí salen conejos y pañuelos.", answer: "sombrero", accept: ["sombrero", "chistera"], hint: "Es negro, alto y del mago.", ages: [...K] },
  { themes: ["magia"], text: "Soy redonda y de cristal, y quien me mira dice que ve el futuro.", answer: "bola", accept: ["bola", "boladecristal", "esfera"], hint: "La usan las adivinas.", ages: [...N] },
  { themes: ["magia"], text: "Se pronuncia en voz baja, se escribe en un libro viejo y, al decirlo, algo cambia.", answer: "hechizo", accept: ["hechizo", "conjuro", "encantamiento"], hint: "Lo lanzan las brujas.", ages: [...A] },
  { themes: ["selva"], text: "Me arrastro sin patas, cambio de piel y, cuando hablo, solo digo «sss».", answer: "serpiente", accept: ["serpiente", "culebra", "boa", "anaconda"], hint: "No tiene patas.", ages: [...K, "jovenes"] },
  { themes: ["selva"], text: "Salto de rama en rama, como plátanos y me parezco un poco a ti.", answer: "mono", accept: ["mono", "chimpance", "gorila"], hint: "Tiene una cola larga.", ages: [...K] },
  { themes: ["selva"], text: "Soy verde, tengo una boca enorme y en el río parezco un tronco que flota.", answer: "cocodrilo", accept: ["cocodrilo", "caiman", "aligator"], hint: "Tiene muchos dientes.", ages: [...N, "adultos"] },
  { themes: ["museo"], text: "Estoy envuelta en vendas y llevo miles de años dormida.", answer: "momia", accept: ["momia"], hint: "Viene de Egipto.", ages: [...K, "jovenes"] },
  { themes: ["museo"], text: "Tengo forma de persona, soy de piedra o de bronce y nunca me muevo.", answer: "estatua", accept: ["estatua", "escultura"], hint: "Las hay en las plazas.", ages: [...K] },
  { themes: ["museo"], text: "Soy un hueso que se volvió piedra; gracias a mí sabemos cómo eran los dinosaurios.", answer: "fósil", accept: ["fosil", "fosiles"], hint: "Se encuentra excavando.", ages: [...N, "adultos"] },
];
