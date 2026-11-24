export interface UpdateEntry {
  date: string;
  milestone?: boolean;
  title?: string;
  paragraphs: string[];
}

/** Changelog OzRo derivado del git log de rathena (17 ene 2026 – hoy). */
export const recentUpdates: UpdateEntry[] = [
  {
    date: '23 de noviembre de 2026',
    title: 'Storage a 800 items',
    paragraphs: [
      'Se aumentó la capacidad del storage a 800 items.',
    ],
  },
  {
    date: '22 de noviembre de 2026',
    title: 'Cartas de monstruos normales a 50x',
    paragraphs: [
      'Cartas de monstruos normales: 50x (antes 10x). Las de jefe y de MVP siguen en 100x.',
      'En Renewal la base no es 0.01% para todas. La mayoría de las cartas de campo sale de 0.01%, un grupo chico de 0.10% y las de inicio (Poring, Drops, Lunatic, Fabre, Picky, Chonchon, Hornet, Thief Bug) de 0.20%. Con 10x, la base mayoritaria quedaba en 0.10%. A 50x pasa a 0.50%; las bases de 0.10% y 0.20% quedan en 5% y 10%.',
    ],
  },
  {
    date: '21 de noviembre de 2026',
    title: 'Cliente: archivos faltantes reconstruidos',
    paragraphs: [
      'Se inventarió el cliente activo frente al servidor y se reconstruyeron en el parche recursos que faltaban: sprites y sonidos de monstruos, NPCs nuevos y referencias de identidad necesarias para mostrarlos.',
      'El objetivo es un cliente más estable al spawnear contenido reciente, sin errores de sprite o sonido por archivos ausentes.',
    ],
  },
  {
    date: '20 de noviembre de 2026',
    title: 'Battlegrounds y PvP desactivados',
    paragraphs: [
      'Se desactivaron Battlegrounds y el PvP abierto: con tan pocos jugadores no tienen sentido como contenido fijo.',
      'El combate entre jugadores volverá más adelante en forma de eventos automáticos, no como salas permanentes.',
    ],
  },
  {
    date: '20 de noviembre de 2026',
    title: 'Más estilos para Vesper',
    paragraphs: [
      'Vesper admite más colores de ropa según las paletas reales del cliente.',
      'Se retiraron recursos de stylist que no se usaban y eran incompatibles con el cliente.',
    ],
  },

  {
    date: '19 de noviembre de 2026',
    title: 'Simulador de mercado: experimento inicial',
    paragraphs: [
      'Se empieza a experimentar con un Simulador de mercado en la Enciclopedia para estimar precio, liquidez y tiempo de venta de los objetos.',
      'Por ahora se simula solo el item base: precio inmediato, precio justo, precio paciente, probabilidad de venta en 7/30/90 días y curva precio/tiempo.',
    ],
  },
  {
    date: '18 de noviembre de 2026',
    title: 'Enciclopedia: NPCs y tasas reales del servidor',
    paragraphs: [
      'Se regeneró el inventario de NPCs desde los scripts activos: 17.757 NPCs en 777 mapas, con 160 NPCs custom de OzRo marcados con la insignia OzRo.',
      'Cada NPC de tienda o barter ahora guarda su inventario: precios, stock y objetos requeridos para intercambios, visible desde NPCs por mapa.',
      'Las fichas de monstruos aplican las tasas reales del servidor: el doble de HP para mobs normales y MVPs, y los multiplicadores de drop por tipo de monstruo y de objeto que ya usaba la base de datos.',
      'Los jefes y MVPs que invocan criaturas muestran su lista de invocaciones tanto en la ficha del monstruo como en el radar de MVPs.',
    ],
  },
  {
    date: '18 de noviembre de 2026',
    title: 'Limpieza de NPCs obsoletos y fuera de alcance',
    paragraphs: [
      'Se desactivaron NPCs e instancias de contenido posterior al episodio 17.1: Hidden Garden, Lost Farm, Twilight Garden y Water Garden, más las instancias de la Ep18 (Maze of Oz, Thor Gunsu Base, Villa of Deception, Villa of High Priest y Wolves) y el encantador de la 17.2.',
      'También se retiraron los barter de la Ep18 y los cofres de logros, cuya función ya estaba desactivada.',
      'Se desactivaron los servicios de teleport obsoletos de Kafra, Zonda y el Representante del Airship, reemplazados por los warps personalizados.',
    ],
  },
  {
    date: '18 de noviembre de 2026',
    title: 'Limpieza del menú principal del cliente',
    paragraphs: [
      'Se quitaron del menú principal los iconos de Descripción de atajos (el teclado), Battlegrounds, Tip, Cash Shop, Asistencia, Logros y REC/Repetición.',
    ],
  },
  {
    date: '18 de noviembre de 2026',
    title: 'Corregido el bloqueo al cancelar diálogos de NPC',
    paragraphs: [
      'Cancelar un menú de NPC con Esc/X ya no deja al personaje bloqueado ni obliga a reloguear.',
      'Los diálogos de selección ahora cierran y liberan el estado del NPC de inmediato.',
    ],
  },
  {
    date: '18 de noviembre de 2026',
    title: 'Banco del menú retirado y Banquero en las ciudades',
    paragraphs: [
      'Se desactivó el acceso al banco desde el menú.',
      'El servicio ahora se abre hablando con el Banquero de Rune-Midgard en las principales ciudades.',
    ],
  },
  {
    date: '17 de noviembre de 2026',
    title: 'Retirados los iconos de las cabezas de los NPCs',
    paragraphs: [
      'Se quitaron los iconos que aparecían sobre las cabezas de los NPCs para dejar el mapa más limpio.',
    ],
  },
  {
    date: '17 de noviembre de 2026',
    title: 'RoDex deshabilitado en dungeons e instancias',
    paragraphs: [
      'RoDex ya no está disponible en dungeons ni instancias. El correo sigue funcionando en ciudades y campos.',
      'Al intentar abrirlo en una zona bloqueada, el cliente muestra un mensaje genérico y no permite operar el correo.',
    ],
  },
  {
    date: '17 de noviembre de 2026',
    title: 'Navegación desactivada',
    paragraphs: [
      'Se eliminó la navegación del cliente: el botón de la ventana básica, la ventana del world map y los iconos del minimapa ya no abren ni generan rutas.',
      'Las flechas de ruta desaparecieron; la exploración vuelve a ser manual.',
    ],
  },
  {
    date: '17 de noviembre de 2026',
    title: 'Login limpio y parches empaquetados',
    paragraphs: [
      'El login quedó solo con usuario, contraseña, Save ID y el botón Login. Se ocultaron el selector de tipo de cuenta y los botones inferiores de registro.',
      'El fondo del login se corrigió para quitar el desplegable vacío que quedaba en la imagen.',
      'Los parches del cliente ahora se empaquetan en tres GRFs: UI (fondo de login), mapas y fixes (clientinfo/etcinfo). gefenia.grf queda aparte. El exe actualizado incluye navegación y login.',
    ],
  },
  {
    date: '17 de noviembre de 2026',
    title: 'Warps personalizados por ciudad',
    paragraphs: [
      'El nuevo servicio de warp reemplaza la antigua votación: cada ciudad tiene un NPC con teleport y otro que informa qué corporación quedó a cargo.',
      'Cada viaje cuesta 4.000 zeny y 1 Blue Gemstone. Los destinos incluyen dungeons y entradas de las ciudades principales.',
    ],
  },
  {
    date: '17 de noviembre de 2026',
    title: 'Endless Tower diaria',
    paragraphs: [
      'El acceso a Endless Tower pasa de semanal a diario: el cooldown de la instancia ahora es de 20 horas.',
      'El reingreso a una torre ya generada mantiene su límite de 4 horas.',
    ],
  },
  {
    date: '16 de noviembre de 2026',
    title: 'Correcciones de scripts y balance',
    paragraphs: [
      'Se corrigió la cancelación de menús y selects en NPCs e instancias: al cancelar, el script se cierra correctamente.',
      'Se deshabilitaron mobs, drops y scripts no utilizados que podían romper el juego.',
      'Se ampliaron los diálogos de Garrett y del estilista.',
      'Se quitó la reducción de daño de los MVPs: ahora reciben daño completo.',
    ],
  },
  {
    date: '16 de noviembre de 2026',
    title: 'Almas, ecos y Sueños Tejidos',
    paragraphs: [
      'El Guardián de Almas reemplaza al Cronista de Cacerías: lee los fragmentos que dejan las grandes bestias en los cazadores y los cristaliza en Almas de MVP.',
      'La Tejedora de Ecos abre Sueños Tejidos. El líder paga Almas y catalizadores; cada miembro de la party habla con ella para entrar.',
      'Mientras el sueño siga abierto se puede reingresar. Al caer el eco o terminar el tiempo, todos despiertan junto a la Tejedora.',
      'Las cacerías dentro del sueño no suman fragmentos al Guardián. El sistema no muestra tiers: solo los costos en Almas y los objetos.',
    ],
  },
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
    title: 'Tablones de bounty reubicados',
    paragraphs: [
      'Se movieron y alinearon varios tablones de bounty para que no se superpongan con edificios, warps o caminos. Las recompensas y los rangos de nivel no cambian.',
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
