export interface UpdateEntry {
  date: string;
  milestone?: boolean;
  title?: string;
  paragraphs: string[];
}

/** Changelog OzRo derivado del git log de rathena (17 ene 2026 – hoy). */
export const recentUpdates: UpdateEntry[] = [
  {
    date: '9 de julio de 2026',
    paragraphs: [
      'Soporte de acentos en español para los diálogos de NPCs: el servidor y los scripts custom usan codificación Western (ISO-8859-1), de modo que tildes, eñes y signos de puntuación se muestran correctamente en el cliente.',
      'Inicio del proyecto de traducción del juego al español, con la colaboración del jugador Kioto25mr. La primera fase cubre los NPCs custom activos de OzRo.',
      'Port y activacion de cuatro NPCs OzRo de la fase 1: Sabio de los Elementos, Ludovico el Sepulturero, Kessinger (Vinculador de Almas) y Garrett el Recolector.',
      'Sabio de los Elementos: imbuicion elemental al arma (Fuego, Viento, Hielo, Tierra) por 15.000 zeny y piedra; duracion aproximada de 30 minutos. Ubicaciones en Izlude, Prontera, Morocc y Geffen.',
      'Kessinger: Soul Link de pago (20.000 zeny, ~20 minutos) para jobs compatibles, incluyendo clases renewal (Genetic, Creator, etc.). Varias ciudades.',
      'Ludovico el Sepulturero (Prontera): muertes del personaje y contador global de caidas en el reino.',
      'Garrett el Recolector (Geffen): sustituye al Trasher de la era Hercules; compra dos tipos de chatarra al dia a buen precio, con limite de gasto diario. Sistema de reputacion por personaje.',
      'Correcciones: Kaz el Cronista (dialogos y ventanas de texto), endow elemental (ya no aplica Stone Curse), soul link con espiritus renewal y status correcto en rAthena.',
      'Web: pagina de informacion alineada con la configuracion del servidor (rates, drops, mecanicas); seccion de descargas con patch OzRo, Vodoo y DLLs opcionales.',
    ],
  },
  {
    date: '6 de julio de 2026',
    paragraphs: [
      'Se añadieron los documentos de diseño OzRo (visión, configuración del servidor e inventario de NPCs) como referencia interna del proyecto.',
      'La web y la API se alinearon con la configuración real del servidor en rAthena: rates, restricciones y listado de NPCs activos.',
    ],
  },
  {
    date: '20 de enero de 2026',
    paragraphs: [
      'Se activó Kaz el Cronista, con lore básico y conteo de jugadores en línea.',
      'Nuevas quests repetibles de EXP para 17 monstruos distintos.',
      'Port de Card Collector y Card Remover: archivo de cartas por cuenta y extracción de cartas de equipamiento.',
      'Skill personalizada AM_CALLHOMUN para invocar al homúnculo con requisitos de ítems.',
    ],
  },
  {
    date: '19 de enero de 2026',
    paragraphs: [
      'Sophie (Canje Puntos ↔ Zeny) y la Canalizadora Mística (reset de stats/skills con gema y zeny) quedaron operativas, con diálogos en español.',
      'Tablones de caza (Bounty Boards) en 14 ciudades y barter extendido habilitado.',
      'Macaco refinado: intercambio de bananas y cacao por frutas aleatorias, con diálogos y lógica mejorados.',
      'Stylist con menú ampliado y confirmaciones; ajustes de batalla (HP de monstruos al 200%, penalización por diferencia de nivel en EXP y drops).',
      'Comandos informativos @info y @commands para el grupo Player; autoloot de mercenario y homúnculo; sugerencias de atcommands activadas.',
      'Entrada custom de Drainliar en mob_db, plantillas de import y ajustes menores en drops y quest_db.',
    ],
  },
  {
    date: '18 de enero de 2026',
    milestone: true,
    title: 'Migración de motor: Hercules → rAthena',
    paragraphs: [
      'El servidor migra de Hercules a rAthena (Renewal ep. 14.3). Se reorganizaron los scripts custom en scripts_custom.conf y las personalizaciones en conf/import/.',
      'NPCs portados en esta fase: Healer (Blessing Priestess Angela), Stylist y Macaco, adaptados a la sintaxis y APIs de rAthena.',
      'Varios NPCs custom de la era Hercules aún no están portados y no están disponibles en el servidor: Ox Hunter (Ushi), Ox Merchant (Kuma), MVP Tracker, Crimson Weapons Enchanter, Card Trader y otros listados en el inventario de NPCs. Se irán recuperando o reformulando sobre rAthena.',
    ],
  },
];

/** Historial anterior al cambio de motor (Hercules). */
export const legacyUpdates: UpdateEntry[] = [
  {
    date: '25 de enero de 2025',
    paragraphs: [
      'Mejoras en la quest de armas Crimson: costos, diálogos y ubicación de NPCs. Corrección del bug del Trasher que cambiaba ítems tras reconectar. Balance del Macaco.',
    ],
  },
  {
    date: '22 de enero de 2025',
    paragraphs: [
      'Canalizadora Mística: reinicio de mapas y mobs de Star Gladiator. Corrección de IDs de minerales enriquecidos en Cash Shop.',
    ],
  },
  {
    date: '21 de enero de 2025',
    paragraphs: [
      'Actualización del Gambler, eliminación de tickets +11 del Refine Master y correcciones en comandos GM y Cash Shop.',
    ],
  },
  {
    date: '19 de enero de 2025',
    paragraphs: [
      'Quest de armas Crimson, mejoras en varios NPCs y límite de gasto diario de 1M zeny en el Trasher.',
    ],
  },
  {
    date: '18 de enero de 2025',
    paragraphs: [
      'NPC Trasher (compra ítems misceláneos hasta 10× su valor) y ajustes de rates de EXP y drops.',
    ],
  },
  {
    date: '13 de enero de 2025',
    paragraphs: [
      'Autoloot para todos los jugadores, ajustes en NPCs custom y configuración IP del servidor.',
    ],
  },
  {
    date: 'de 2021 a 2025',
    paragraphs: [
      'Período de inactividad del proyecto. Retomado en 2025 con nuevas mecánicas y balance sobre Hercules.',
    ],
  },
  {
    date: '22 de junio de 2021',
    paragraphs: [
      'Ajustes al sistema de apuestas y nuevo NPC Monke (apostador de consumibles).',
    ],
  },
  {
    date: '19 de junio de 2021',
    paragraphs: [
      'Mejoras en misiones de caza, nuevos sombreros, buffs de Soul Linker y +10% daño a MVP con aura verde.',
    ],
  },
  {
    date: '16 de junio de 2021',
    paragraphs: [
      'Primeros NPCs personalizados, misiones repetibles de EXP y comandos de jugador.',
    ],
  },
  {
    date: '21 de junio de 2021 — Inicio del servidor',
    paragraphs: [
      'Servidor privado offline para un grupo reducido: balance justo, sin economía inflada, cada NPC pensado para juego en familia o LAN.',
    ],
  },
];
