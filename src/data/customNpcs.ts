export interface CustomNpc {
  id: string;
  name: string;
  role: string;
  sprite: string;
  summary: string;
  description: string[];
  services: string[];
  locations: string[];
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
      'NPCs que mueven la economía del servidor: compran chatarra, cambian puntos y administran el archivo de cartas.',
    npcs: [
      {
        id: 'garrett',
        name: 'Garrett el Recolector',
        role: 'Comprador de chatarra',
        sprite: sprite('1_M_SIGN1'),
        summary:
          'Compra basura a precios elevados, con dos objetos distintos por día y un presupuesto limitado.',
        description: [
          'Garrett recorre Geffen con un ojo entrenado para lo que otros tiran. Cada día elige dos objetos de chatarra y los paga muy por encima de su valor de venta.',
          'El precio base es 10 veces el valor de venta del objeto, con un mínimo de 500 zeny y un máximo de 2.000 zeny por unidad. Su presupuesto diario es de 300.000 zeny: cuando se agota, cierra hasta el día siguiente.',
          'La constancia también paga: cada 10 tratos únicos entrega una Ozro Bronze Coin, la puerta de entrada a la economía custom del servidor.',
        ],
        services: [
          'Compra diaria de dos tipos de chatarra',
          'Precio x10 del valor de venta (mín. 500, máx. 2.000 zeny)',
          'Presupuesto diario de 300.000 zeny',
          '1 Ozro Bronze Coin cada 10 tratos únicos',
          'Lleva registro de tratos y zeny invertidos',
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
    ],
  },
  {
    id: 'support',
    title: 'Soporte y utilidades',
    description:
      'Servicios de curación, apariencia, reset, endow y soul link para el día a día.',
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
          'A partir de nivel 40 ofrece dos servicios: curación por 5.000 zeny, o bendición completa por 10.000 zeny con curación, Blessing e Increase Agi de nivel 10 durante 4 minutos.',
        ],
        services: [
          'Curación gratis por debajo de nivel 40',
          'Curación por 5.000 zeny',
          'Curación + Blessing + Increase Agi por 10.000 zeny',
          'Buffs de 4 minutos',
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
