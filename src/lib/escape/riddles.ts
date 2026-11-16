/** Adivinanzas (tradición popular española o redacción propia) con respuestas inequívocas. */
export interface Riddle {
  text: string;
  answer: string;
  accept: string[];
  hint: string;
  ages: ("peques" | "ninos" | "jovenes" | "adultos")[];
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
];
