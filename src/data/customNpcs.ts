export interface InvocationCostGroup {
  souls: number;
  mvps: { name: string; keys: string[] }[];
}

export interface CustomNpc {
  id: string;
  name: string;
  role: string;
  sprite: string;
  summary: string;
  description: string[];
  services: string[];
  locations: string[];
  invocationCosts?: InvocationCostGroup[];
  featured?: boolean;
}

export interface CustomNpcGroup {
  id: string;
  title: string;
  description: string;
  npcs: CustomNpc[];
}

const sprite = (file: string) => `/assets/npcs/sprites/${file}.gif`;

export const customNpcGroups: CustomNpcGroup[] = [
  {
    id: 'commerce',
    title: 'Comercio y colección',
    description:
      'NPCs que mueven la economía del servidor: compran chatarra, venden gemas, cambian puntos y administran el archivo de cartas.',
    npcs: [
      {
        id: 'garrett',
        name: 'Garrett el Recolector',
        role: 'Recolector de Geffen',
        sprite: sprite('1_M_SIGN1'),
        summary:
          'Compra lo que otros tiran y ofrece contratos a quienes saben encontrar valor en lo que nadie mira.',
        description: [
          'Garrett creció entre los desechos de Geffen. Antes de que los aventureros lo conocieran, ya sabía distinguir un montón de basura de una oportunidad: una pieza oxidada, una tela raída o un fragmento que nadie miraba dos veces.',
          'Con los años convirtió ese olfato en un negocio. Recorre la ciudad con su carreta y su libreta, convencido de que nada está realmente perdido mientras alguien sepa dónde buscar.',
          'Para los aventureros, Garrett es la primera parada de la economía de OzRo. Compra lo que sobra, paga por lo que otros descartan y ofrece contratos a quienes no temen ensuciarse las manos.',
          'No pregunta de dónde salió lo que le traes. Solo mira la cantidad, sonríe y hace su oferta. Su lista cambia cada día: lo que hoy le interesa, mañana puede no importarle.',
          'Detrás de su tono socarrón hay un hombre que conoce el valor de las cosas pequeñas. En un mundo obsesionado con héroes y dragones, Garrett sigue creyendo que la basura de un hombre es el tesoro de otro.',
        ],
        services: [
          'Compra chatarra del día',
          'Contratos de recolección con tiempo límite',
          'Paga en zeny y monedas OzRo',
          'Ofertas y contratos rotan a diario',
          'Trato por cuenta',
        ],
        locations: ['Geffen (143, 70)'],
        featured: true,
      },
      {
        id: 'sophie',
        name: 'Sophie',
        role: 'Cambista de puntos',
        sprite: sprite('4_F_KHELLY'),
        summary: 'Convierte zeny en cash points y cash points en zeny.',
        description: [
          'Sophie mantiene el puente entre el zeny del juego y los puntos de cash. La tasa es fija: 20.000 zeny por punto.',
          'Los puntos se guardan en la cuenta, así que el saldo está disponible para cualquier personaje.',
        ],
        services: [
          'Zeny → cash points',
          'Cash points → zeny',
          'Tasa fija de 20.000 zeny por punto',
        ],
        locations: ['Prontera (147, 159)', 'Geffen (97, 72)'],
      },
      {
        id: 'card-collector',
        name: 'Card Collector',
        role: 'Archivo de cartas',
        sprite: sprite('4_F_ALCHE'),
        summary:
          'Registra tus cartas por cuenta y muestra el progreso de la colección.',
        description: [
          'La Iniciativa de Archivo Arcano documenta las cartas que vas encontrando. Al registrarlas, el progreso queda guardado en la cuenta y no se pierde al cambiar de personaje.',
          'El archivo separa las cartas por categorías, muestra el porcentaje completado, permite explorar la colección y lista las cartas que todavía faltan.',
          'Es una de las metas de largo plazo del servidor. Sus datos existentes deben preservarse en cualquier cambio futuro.',
        ],
        services: [
          'Registrar cartas del inventario',
          'Progreso general y por categoría',
          'Explorar la colección',
          'Lista de cartas faltantes',
          'Datos persistentes por cuenta (#CARD_SEEN_*, #CARD_CT_*)',
        ],
        locations: ['Geffen (158, 40)', 'Prontera (123, 98)'],
      },
      {
        id: 'card-remover',
        name: 'Vieja Anciana',
        role: 'Removedora de cartas',
        sprite: sprite('78'),
        summary:
          'Separa las cartas de un equipo, con riesgo de destruir el objeto o las cartas.',
        description: [
          'La Vieja Anciana puede extraer las cartas de un equipo. Cobra 200.000 zeny de base más 25.000 zeny por carta, y además pide una Migaja de Estrella y una Piedra Preciosa Amarilla.',
          'El ritual puede fallar. Si falla, puede destruir el equipo, las cartas o ambos; no hay reembolsos.',
        ],
        services: [
          'Remover cartas de equipo',
          'Costo base de 200.000 zeny',
          '+25.000 zeny por cada carta',
          'Requiere Migaja de Estrella y Piedra Preciosa Amarilla',
          'Riesgo de destrucción total o parcial',
        ],
        locations: ['Prontera, interior (28, 73)'],
      },
      {
        id: 'birthstone-merchant',
        name: 'Mercader de birthstones',
        role: 'Venta de gemas de reset',
        sprite: sprite('1_M_MERCHANT'),
        summary:
          'Vende las birthstones que pide la Canalizadora Mística para cada ciclo de reset.',
        description: [
          'El mercader reúne las gemas que la Canalizadora Mística acepta como birthstones. La gema requerida cambia según la cantidad de resets del personaje.',
          'Su stock y su oferta se renuevan cada día, así que conviene revisar qué tiene disponible antes de planear un reset.',
        ],
        services: [
          'Venta de birthstones',
          'Gemas usadas por la Canalizadora Mística',
          'Stock diario',
          'Pago en zeny',
        ],
        locations: ['Morroc'],
      },
    ],
  },
  {
    id: 'support',
    title: 'Soporte y utilidades',
    description:
      'Servicios de curación, apariencia, reset, endow, soul link y warp para el día a día.',
    npcs: [
      {
        id: 'angela',
        name: 'Angela',
        role: 'Sacerdotisa viajera',
        sprite: sprite('4_M_BRZ_JACI'),
        summary:
          'Cura y buffs en más de 30 ciudades. Es gratis para personajes de nivel bajo.',
        description: [
          'Angela viaja por Rune-Midgard compartiendo bendiciones. Por debajo de nivel 40 cura gratis y sin costo alguno.',
          'A partir de nivel 40 ofrece dos servicios: curación por 5.000 zeny, o bendición completa por 10.000 zeny con curación, Blessing e Increase Agi de nivel 10 durante 10 minutos.',
        ],
        services: [
          'Curación gratis por debajo de nivel 40',
          'Curación por 5.000 zeny',
          'Curación + Blessing + Increase Agi por 10.000 zeny',
          'Buffs de 10 minutos',
        ],
        locations: [
          'Más de 30 ciudades, entre ellas Alberta, Prontera, Geffen, Izlude, Morocc, Payon, Yuno, Rachel, Veins y Malangdo',
        ],
      },
      {
        id: 'stylist',
        name: 'Estilista',
        role: 'Cambio de apariencia',
        sprite: sprite('2_M_DYEINGER'),
        summary: 'Cambia color de ropa, peinado y color de cabello sin costo.',
        description: [
          'La Estilista permite recorrer los estilos disponibles y quedarse con el que más te guste. No cobra zeny ni items.',
          'Se puede volver al estilo original en cualquier momento antes de confirmar.',
        ],
        services: [
          'Color de ropa',
          'Peinado',
          'Color de cabello',
          'Vista previa y vuelta al estilo original',
        ],
        locations: ['Prontera (170, 180)'],
      },
      {
        id: 'mystic',
        name: 'Canalizadora Mística',
        role: 'Reset de stats y skills',
        sprite: sprite('4_GEFFEN_09'),
        summary:
          'Reinicia stats y habilidades por 100.000 zeny y una birthstone.',
        description: [
          'La Canalizadora reescribe la build del personaje: limpia stats, skills y estados. El costo es 100.000 zeny más una birthstone.',
          'No tiene límite de usos. La birthstone requerida va rotando según la cantidad de resets del personaje.',
        ],
        services: [
          'Reset de stats',
          'Reset de skills',
          'Limpieza de buffs y estados',
          'Costo: 100.000 zeny + birthstone',
          'Usos ilimitados',
        ],
        locations: ['Prontera (150, 186)'],
      },
      {
        id: 'ethelygard',
        name: 'Ethelgard, Sabio de los Elementos',
        role: 'Endow elemental',
        sprite: sprite('2_M_SAGE_OLD'),
        summary:
          'Imbuye el arma con fuego, viento, agua o tierra durante 30 minutos.',
        description: [
          'Ethelgard canaliza un elemento sobre el arma a cambio de 15.000 zeny y la piedra elemental correspondiente. El efecto dura 30 minutos.',
          'Usa Boody Red para fuego, Wind of Verdure para viento, Crystal Blue para agua y Green Live para tierra.',
        ],
        services: [
          'Endow de Fuego, Viento, Agua o Tierra',
          'Costo: 15.000 zeny + piedra elemental',
          'Duración: 30 minutos',
        ],
        locations: [
          'Izlude (131, 142)',
          'Prontera (159, 186)',
          'Morocc (168, 106)',
          'Geffen (125, 68)',
        ],
      },
      {
        id: 'kessinger',
        name: 'Kessinger, Vinculador de Almas',
        role: 'Soul Link',
        sprite: sprite('4_M_ROTERT'),
        summary:
          'Entrega un Soul Link de 20 minutos por 20.000 zeny, según el job del personaje.',
        description: [
          'Kessinger invoca el espíritu ancestral que corresponde al job base del personaje. El vínculo dura 20 minutos y cuesta 20.000 zeny.',
          'Cubre jobs 2-1 y 2-2, y también algunos jobs extendidos. Si el job no tiene un espíritu asociado, no realiza el ritual.',
        ],
        services: [
          'Soul Link según BaseJob',
          'Duración: 20 minutos',
          'Costo: 20.000 zeny',
          'Compatible con jobs 2-1, 2-2 y algunos extendidos',
        ],
        locations: [
          'Yuno (145, 185)',
          'Prontera (161, 185)',
          'Morocc (148, 106)',
          'Comodo (182, 155)',
          'Geffen (125, 72)',
        ],
      },
      {
        id: 'dungeon-warper',
        name: 'Cool Event & Kafra Corp',
        role: 'Dungeon Warper',
        sprite: sprite('874'),
        summary:
          'Servicio de teleportación a dungeons operado por Cool Event Corp y Kafra Corp.',
        description: [
          'Tras largas votaciones, Cool Event Corp y Kafra Corp se repartieron la operación del servicio de warp: cada ciudad quedó a cargo de una de las dos corporaciones.',
        ],
        services: [
          'Prontera: Monk Village, Culvert, Labyrinth Forest',
          'Morroc: Pyramid, Pyramid Basement, Sphinx',
          'Geffen: Dead Pit, Glast Heim, Geffen Dungeon',
          'Payon: Payon Cave, Anthell, Niflheim Field',
          'Alberta: Byalan Dungeon, Turtle Cave, Shrine of Gonryun, Louyang Royal Tomb',
          'Aldebaran: Clock Tower, Clock Tower Basement, Mjolnir Field',
          'Yuno: Magma, Thanatos Tower',
          'Lighthalzen: Ice Cave, Thor Volcano',
        ],
        locations: ['8 ciudades principales'],
      },
    ],
  },
  {
    id: 'mvp',
    title: 'Almas y Ecos',
    description:
      'NPCs que tratan con las almas de las grandes bestias y tejen sus ecos en Sueños Tejidos.',
    npcs: [
      {
        id: 'journal',
        name: 'El Guardián de Almas',
        role: 'Guardián de Almas',
        sprite: sprite('4_M_SURA'),
        summary:
          'Recoge los fragmentos de alma que dejan las grandes bestias y los cristaliza en Almas de MVP.',
        description: [
          'Cuando una gran bestia muere, su alma se niega a abandonar el mundo. Sus fragmentos se adhieren a los cazadores que la enfrentaron: los golpes finales y las asistencias dejan marcas.',
          'El Guardián ve esas marcas. No las borra: las limpia y las cristaliza en Almas de MVP.',
          'Cada marca pesa distinto. El reclamo es repetible y no tiene tope; las Almas quedan en el inventario y se usan para invocar ecos.',
          'Si quieres volver a enfrentar a una bestia, busca a la Tejedora de Ecos. Ella sabe llamar a su eco.',
        ],
        services: [
          'Resumen de golpes finales y asistencias',
          'Lista de grandes bestias cazadas',
          'Fragmentos de alma pendientes',
          'Reclamo repetible de Almas',
          'Historial por bestia',
        ],
        locations: ['Prontera (150, 180)'],
      },
      {
        id: 'arena-summoner',
        name: 'Tejedora de Ecos',
        role: 'Tejedora de Ecos',
        sprite: sprite('840'),
        summary:
          'Teje ecos de grandes bestias en Sueños Tejidos usando Almas y objetos como catalizadores.',
        description: [
          'La Tejedora no invoca a la bestia: llama a su eco. Se sienta en trance, con su tapete ritual y su incensario, y teje un sueño con la memoria de la cacería.',
          'Las Almas son la fuente que sostiene el sueño; los objetos que pide cada bestia son los catalizadores que le dan forma.',
          'El líder paga las Almas y los objetos. Cada miembro de la party habla con la Tejedora para entrar. El sueño dura una hora y se puede reingresar mientras siga abierto.',
          'Si el eco cae o el tiempo termina, el telar se deshace y todos despiertan junto a la Tejedora. Las cacerías dentro del sueño no suman fragmentos al Guardián.',
        ],
        services: [
          'Invocación fija de ecos',
          'Costo en Almas + catalizadores',
          'Sueños Tejidos de 1 hora',
          'Reingreso sin costo mientras el sueño esté abierto',
        ],
        locations: ['Prontera (173, 152)'],
        invocationCosts: [
          {
            souls: 3,
            mvps: [
              { name: "Golden Thief Bug", keys: ["1 Gold"] },
              { name: "Phreeoni", keys: ["10 Tongue", "5 Ant Jaw"] },
              { name: "Moonlight Flower", keys: ["20 Nine Tails"] },
              { name: "Dracula", keys: ["1 3carat Diamond", "100 Wing of Red Bat"] },
              { name: "Lady Tanee", keys: ["1 Banana Hat"] },
              { name: "Orc Hero", keys: ["2 Orc Lord's Token"] },
              { name: "Mistress", keys: ["30 Royal Jelly"] },
              { name: "Maya", keys: ["30 Round Shell"] },
              { name: "Doppelganger", keys: ["5 Cursed Ruby"] },
              { name: "Orc Lord", keys: ["1 Orc Hero's Token"] },
            ],
          },
          {
            souls: 5,
            mvps: [
              { name: "Stormy Knight", keys: ["5 Old Blue Box"] },
              { name: "Baphomet", keys: ["2 Evil Horn"] },
              { name: "White Lady", keys: ["1 White Snake's Tear", "2 Black Hair"] },
              { name: "Drake", keys: ["1 Pirate Bandana", "10 Skel-Bone"] },
              { name: "Pharaoh", keys: ["2 Broken Pharaoh Emblem", "1 Mask of Tutankhamen"] },
              { name: "Eddga", keys: ["5 Tiger Skin", "2 Tiger's Footskin"] },
              { name: "RSX-0806", keys: ["2 Flashlight", "2 Cogwheel"] },
              { name: "Amon Ra", keys: ["3 Rosetta Stone Piece"] },
              { name: "Evil Snake Lord", keys: ["2 Taeguk Plate"] },
              { name: "Osiris", keys: ["10 Rotten Bandage", "1 Memento", "10 Scale Shell"] },
              { name: "Dark Lord", keys: ["10 Skull", "1 Coif"] },
              { name: "Tao Gunka", keys: ["1 Gemstone", "3 Stone Fragment"] },
              { name: "Hatii", keys: ["2 Fang of Hatii"] },
              { name: "Boitata", keys: ["1 Treasure Box", "10 Sharp Scale"] },
              { name: "Turtle General", keys: ["10 Broken Shell"] },
              { name: "Atroce", keys: ["5 Bloody Rune"] },
            ],
          },
          {
            souls: 10,
            mvps: [
              { name: "Scaraba Queen", keys: ["3 Piece of Queen's Wing"] },
              { name: "Kiel D-01", keys: ["100 Used Iron Plate"] },
              { name: "Kraken", keys: ["10 Tentacle", "1 Treasure Box"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lore',
    title: 'Lore y comunidad',
    description:
      'NPCs que registran la historia del reino, las estadísticas de los aventureros y los pequeños secretos del mundo.',
    npcs: [
      {
        id: 'kaz',
        name: 'Kaz el Cronista',
        role: 'Cronista Real',
        sprite: sprite('4_M_ZONDAOYAJI'),
        summary:
          'Guardián de la lore del reino y del registro de aventureros.',
        description: [
          'Kaz mantiene los registros del reino por decreto real. Además de contar la historia de Rune-Midgard, informa cuántos aventureros están explorando el mundo en ese momento.',
        ],
        services: [
          'Lore del reino',
          'Conteo de aventureros online',
          'Registro de aventureros',
        ],
        locations: ['Geffen (139, 72)'],
      },
      {
        id: 'ludovico',
        name: 'Ludovico el Sepulturero',
        role: 'Cronista de muertes',
        sprite: sprite('1_M_PASTOR'),
        summary:
          'Lleva la cuenta de tus muertes y de los ecos de muerte de todo el reino.',
        description: [
          'Ludovico escucha los ecos de quienes caen en Rune-Midgard. Puede decirte cuántas veces ha muerto tu personaje y cuántas muertes se han registrado en todo el servidor.',
        ],
        services: [
          'Muertes del personaje',
          'Muertes totales del reino',
        ],
        locations: ['Prontera (274, 352)'],
      },
      {
        id: 'macaco',
        name: 'Macaco',
        role: 'Trueque de frutas',
        sprite: sprite('YOYO'),
        summary:
          'Cambia bananas, manzanas o cacao por frutas aleatorias… si tiene ganas.',
        description: [
          'Macaco acepta Banana, Apple o Cacao. Elige una de las frutas que tengas y decide si la acepta o no. Tiene un 10% de probabilidad de rechazarte y arrojarte excremento.',
          'Si acepta, devuelve entre 2 y 30 Strawberry, Grape o Lemon, con una cantidad que varía alrededor de lo que le ofreciste.',
        ],
        services: [
          'Intercambio de Banana, Apple o Cacao',
          'Recompensa aleatoria de Strawberry, Grape o Lemon',
          '10% de probabilidad de rechazo',
        ],
        locations: ['prt_fild03 (203, 41)'],
      },
    ],
  },
];
