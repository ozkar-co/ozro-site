export interface UpdateEntry {
  date: string;
  milestone?: boolean;
  title?: string;
  paragraphs: string[];
}

/** Changelog OzRo derivado del git log de rathena (17 ene 2026 – hoy). */
export const recentUpdates: UpdateEntry[] = [
  {
    date: '16 de noviembre de 2026',
    title: 'Garrett: ofertas diarias y contratos',
    paragraphs: [
      'Garrett ahora trabaja por cuenta: cinco ofertas diarias con precio unitario y un cap total de 500.000 zeny por cuenta y por día.',
      'Además de las ofertas, se puede aceptar una misión diaria de 6 horas entre tres contratos: común, poco común y raro. El pago de la misión queda fuera del cap diario.',
      'Mientras hay una misión activa, Garrett no compra chatarra: solo informa el tiempo restante y el progreso. La misión se puede cancelar; si se cancela o falla, no habrá otra hasta el día siguiente, pero las ofertas vuelven a quedar abiertas.',
      'Si ya tienes la cantidad pedida en el inventario, Garrett cierra el contrato y paga al instante. Los ítems muy raros quedan fuera del pool normal y se reservan para eventos o misiones especiales.',
    ],
  },
  {
    date: '16 de noviembre de 2026',
    title: 'Enciclopedia reorganizada',
    paragraphs: [
      'Información ahora reúne solo las especificaciones del servidor y los sistemas personalizados. Los NPCs y las quests custom se movieron a la Enciclopedia.',
      'La Enciclopedia tiene su propio sidebar: NPCs personalizados, Quests personalizadas, Episodios y NPCs por mapa.',
      'Los NPCs custom tienen ficha con sprite, descripción, servicios y ubicaciones. Garrett el Recolector tiene una página completa; los demás están agrupados por comercio, soporte y lore.',
      'Las Quests personalizadas incluyen los Bounty Boards y la tabla de las 18 quests repetibles con nivel, mapa, monstruo y recompensas.',
      'Bounty Boards: nuevo selector por rango de nivel que muestra todos los tableros de ese rango con su ciudad, además del selector por ciudad.',
    ],
  },
  {
    date: '16 de noviembre de 2026',
    title: 'Radar de MVPs',
    paragraphs: [
      'Nueva sección Radar de MVPs con los 74 MVPs del servidor: sprites, mapa, nivel, rango de respawn y estado de caza.',
      'Resumen de vivos, derrotados, probables y sin registro. Filtros por nombre, mapa, estado y nivel; orden por próximo respawn, nivel, nombre o respawn más corto.',
      'Cada MVP muestra ventana estimada y probabilidad de estar vivo cuando corresponde. El radar se actualiza automáticamente cada 30 segundos.',
      'El historial comienza con las nuevas muertes registradas en mvplog; los MVPs sin datos recientes siguen visibles con su respawn base.',
    ],
  },
  {
    date: '16 de noviembre de 2026',
    title: 'Ajuste de cartas y tasas reales de drop en la web',
    paragraphs: [
      'Cartas de monstruos normales: 10x (antes 100x). Las cartas de jefe y de MVP quedan en 100x. El resto de tasas (common 5x, healing 10x, usable 10x, equipment 15x) no cambia.',
      'La ficha de cada monstruo y de cada objeto ahora aplica los multiplicadores reales del servidor al porcentaje de drop, en lugar de mostrar la tasa base de la base de datos.',
      'Pendiente: selector de penalización de drop por diferencia de nivel en la web.',
    ],
  },
  {
    date: '15 de noviembre de 2026',
    title: 'Base de datos de spawns y mapas',
    paragraphs: [
      'Nueva base de datos de aparición de monstruos generada desde los scripts activos del servidor: 3.867 puntos de spawn en 410 mapas y 1.384 monstruos distintos.',
      'La ficha de cada monstruo muestra sus mapas de aparición, coordenadas, cantidad, tiempo de respawn y si el spawn es aleatorio, de jefe o de instancia.',
      'La ficha de cada objeto muestra qué monstruos lo dropean y el porcentaje de drop, con enlaces directos a los mapas donde aparecen esos monstruos.',
      'Nuevos filtros activos por defecto: se ocultan los monstruos sin spawn (salvo que se incluyan instancias) y los objetos sin drop natural. Se pueden desactivar desde las opciones de búsqueda.',
      'Nueva sección Mapas: selector por mapa, vista esquemática del terreno, puntos de spawn, leyenda de jefe/instancia y listado de monstruos con sus cantidades.',
      'Las vistas de mapa se generan desde el map_cache del servidor; el mapa mundial interactivo queda como siguiente fase.',
    ],
  },
  {
    date: '14 de noviembre de 2026',
    title: 'Cierre de jornada: Ep17.1 y bases para lo que viene',
    paragraphs: [
      'Cliente y protocolo: PACKETVER 20190605 (Ragexe 2019-06-05), Episodio 17.1 rev. 2019-06-05 y nivel máximo 175/60.',
      'Bounty Boards: nueva sección con selector de ciudad (13 ciudades, 32 tableros); FAKE_ANGEL y MINI_DEMON reactivados en Geffen con su EXP.',
      'Quests y mapas: Episode 17.2/18 deshabilitados; Novice Academy deshabilitada; Warlock, Mechanic y Sura desbloqueados con clones de sus mapas base (job3_war01, jupe_core, job_sword1).',
      'Enciclopedia: lista cronológica de episodios hasta 17.1 con enlaces a la wiki, base para documentar la línea principal.',
      'Encoding: NPCs normalizados a Latin-1 y limpieza de mensajes de sistema del cliente que no aplican al server.',
      'Próximo: documentar quests principales (scraping + IA + validación contra scripts), traducir NPCs al español, job master, completar assets de mapas faltantes (new_*), validar instancias y reemplazar enlaces de wiki por páginas propias.',
    ],
  },
  {
    date: '14 de noviembre de 2026',
    paragraphs: [
      'Nueva sección Enciclopedia: directorio de NPCs con mapa, coordenadas, función, quests y sprite.',
      'La página carga solo el mapa seleccionado y los sprites visibles, para mantener el sitio ligero.',
      'El sitio y la API ahora se sirven desde un único servidor en ro.ozkr.net.',
    ],
  },
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
