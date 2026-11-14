export interface BountyMonster {
  name: string;
  mobId: number;
  questId: number;
  baseExp: number;
  jobExp: number;
}

export interface BountyBoard {
  minLevel: number;
  maxLevel: number;
  monsters: BountyMonster[];
}

export interface BountyCity {
  city: string;
  boards: BountyBoard[];
}

export const bountyBoards: BountyCity[] = [
  { city: "Aldebaran", boards: [
    { minLevel: 140, maxLevel: 0, monsters: [
      { name: "Ng Mimic", mobId: 2479, questId: 62890, baseExp: 622800, jobExp: 529650 },
      { name: "Ng Rideword", mobId: 2478, questId: 62891, baseExp: 1181250, jobExp: 1782000 },
      { name: "Big Bell", mobId: 2917, questId: 62892, baseExp: 1690425, jobExp: 1902825 },
      { name: "Big Ben", mobId: 2916, questId: 62893, baseExp: 1675575, jobExp: 1576125 },
    ] },
  ] },
  { city: "Brasilis", boards: [
    { minLevel: 70, maxLevel: 0, monsters: [
      { name: "Curupira", mobId: 2074, questId: 62603, baseExp: 93300, jobExp: 67500 },
      { name: "Headless Mule", mobId: 2071, questId: 62604, baseExp: 151650, jobExp: 168000 },
      { name: "Jaguar", mobId: 2072, questId: 62605, baseExp: 108000, jobExp: 76800 },
      { name: "Toucan", mobId: 2073, questId: 62606, baseExp: 98850, jobExp: 81600 },
      { name: "Piranha", mobId: 2070, questId: 62607, baseExp: 89850, jobExp: 153450 },
    ] },
  ] },
  { city: "Comodo", boards: [
    { minLevel: 40, maxLevel: 60, monsters: [
      { name: "Thara Frog", mobId: 1034, questId: 62617, baseExp: 52312, jobExp: 59062 },
      { name: "See Otter", mobId: 1323, questId: 62618, baseExp: 72225, jobExp: 81000 },
      { name: "Fur Seal", mobId: 1317, questId: 62619, baseExp: 60750, jobExp: 68287 },
      { name: "Raggler", mobId: 1254, questId: 62620, baseExp: 62212, jobExp: 69862 },
      { name: "Green Iguana", mobId: 1687, questId: 62621, baseExp: 164025, jobExp: 184950 },
      { name: "Alligator", mobId: 1271, questId: 62622, baseExp: 82012, jobExp: 92475 },
    ] },
    { minLevel: 60, maxLevel: 105, monsters: [
      { name: "Golem", mobId: 1040, questId: 62623, baseExp: 91125, jobExp: 102600 },
      { name: "Stalactic Golem", mobId: 1278, questId: 62624, baseExp: 113850, jobExp: 128025 },
    ] },
  ] },
  { city: "Dicastes", boards: [
    { minLevel: 101, maxLevel: 140, monsters: [
      { name: "Centipede", mobId: 1987, questId: 62613, baseExp: 360112, jobExp: 304987 },
      { name: "Centipede Larva", mobId: 1999, questId: 62614, baseExp: 329625, jobExp: 225225 },
      { name: "Tatacho", mobId: 1986, questId: 62615, baseExp: 423225, jobExp: 347850 },
    ] },
    { minLevel: 120, maxLevel: 0, monsters: [
      { name: "Antler Scaraba", mobId: 2085, questId: 62802, baseExp: 712125, jobExp: 591187 },
      { name: "Horn Scaraba2", mobId: 2084, questId: 62803, baseExp: 650250, jobExp: 511762 },
      { name: "Rake Scaraba", mobId: 2086, questId: 62804, baseExp: 786375, jobExp: 674437 },
    ] },
  ] },
  { city: "Geffen", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Chonchon", mobId: 1011, questId: 62660, baseExp: 4950, jobExp: 4050 },
      { name: "Roda Frog", mobId: 1012, questId: 62661, baseExp: 10125, jobExp: 7650 },
      { name: "Mandragora", mobId: 1020, questId: 62662, baseExp: 16200, jobExp: 12151 },
    ] },
    { minLevel: 21, maxLevel: 50, monsters: [
      { name: "Creamy", mobId: 1018, questId: 62664, baseExp: 16200, jobExp: 18225 },
      { name: "Caramel", mobId: 1103, questId: 62665, baseExp: 18225, jobExp: 20475 },
      { name: "Horn", mobId: 1128, questId: 62666, baseExp: 24300, jobExp: 27225 },
      { name: "Poison Spore", mobId: 1077, questId: 62667, baseExp: 18225, jobExp: 20475 },
      { name: "Coco", mobId: 1104, questId: 62810, baseExp: 30375, jobExp: 34200 },
      { name: "Smokie", mobId: 1056, questId: 62811, baseExp: 18225, jobExp: 20475 },
      { name: "Martin", mobId: 1145, questId: 62812, baseExp: 20250, jobExp: 22725 },
    ] },
    { minLevel: 41, maxLevel: 75, monsters: [
      { name: "Ork Warrior", mobId: 1023, questId: 62668, baseExp: 39375, jobExp: 60750 },
      { name: "Orc Lady", mobId: 1273, questId: 62669, baseExp: 42750, jobExp: 48825 },
      { name: "Goblin 1", mobId: 1122, questId: 62670, baseExp: 41400, jobExp: 46575 },
      { name: "Goblin Archer", mobId: 1258, questId: 62671, baseExp: 50625, jobExp: 56925 },
    ] },
    { minLevel: 61, maxLevel: 100, monsters: [
      { name: "Ghoul", mobId: 1036, questId: 62672, baseExp: 65475, jobExp: 73800 },
      { name: "Jakk", mobId: 1130, questId: 62673, baseExp: 71100, jobExp: 79875 },
    ] },
    { minLevel: 81, maxLevel: 120, monsters: [
      { name: "Deviruchi", mobId: 1109, questId: 62675, baseExp: 203175, jobExp: 243675 },
      { name: "Marionette", mobId: 1143, questId: 62676, baseExp: 162225, jobExp: 225900 },
      { name: "Wraith", mobId: 1192, questId: 62677, baseExp: 133875, jobExp: 133875 },
      { name: "Dark Priest", mobId: 1198, questId: 62678, baseExp: 273375, jobExp: 187425 },
      { name: "Gargoyle", mobId: 1253, questId: 62679, baseExp: 213750, jobExp: 160275 },
      { name: "Petit", mobId: 1156, questId: 62680, baseExp: 101250, jobExp: 113850 },
      { name: "Petit", mobId: 1155, questId: 62681, baseExp: 131625, jobExp: 148050 },
      { name: "Evil Druid", mobId: 1117, questId: 62682, baseExp: 150525, jobExp: 144000 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Carat", mobId: 1267, questId: 62684, baseExp: 218700, jobExp: 164025 },
      { name: "Wander Man", mobId: 1208, questId: 62685, baseExp: 381150, jobExp: 277425 },
      { name: "Sting", mobId: 1207, questId: 62686, baseExp: 244350, jobExp: 183150 },
      { name: "Arclouse", mobId: 1194, questId: 62687, baseExp: 207450, jobExp: 293175 },
      { name: "Raydric", mobId: 1163, questId: 62688, baseExp: 311625, jobExp: 233550 },
      { name: "Khalitzburg", mobId: 1132, questId: 62689, baseExp: 321975, jobExp: 241425 },
      { name: "Anolian", mobId: 1206, questId: 62690, baseExp: 329625, jobExp: 249975 },
      { name: "Fake Angel", mobId: 1371, questId: 62691, baseExp: 236250, jobExp: 176625 },
      { name: "Violy", mobId: 1390, questId: 62692, baseExp: 321975, jobExp: 241425 },
      { name: "Mini Demon", mobId: 1292, questId: 62693, baseExp: 303750, jobExp: 227700 },
    ] },
  ] },
  { city: "Hugel", boards: [
    { minLevel: 81, maxLevel: 100, monsters: [
      { name: "Novus", mobId: 1715, questId: 62789, baseExp: 146700, jobExp: 169200 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Ancient Mimic", mobId: 1699, questId: 62791, baseExp: 275400, jobExp: 232650 },
    ] },
    { minLevel: 121, maxLevel: 160, monsters: [
      { name: "Ferus", mobId: 1714, questId: 62793, baseExp: 448312, jobExp: 336262 },
      { name: "Ferus", mobId: 1717, questId: 62794, baseExp: 470812, jobExp: 336262 },
      { name: "Skogul", mobId: 1752, questId: 62795, baseExp: 481500, jobExp: 386775 },
      { name: "Frus", mobId: 1753, questId: 62796, baseExp: 513225, jobExp: 402412 },
      { name: "Acidus", mobId: 1716, questId: 62798, baseExp: 508500, jobExp: 381262 },
    ] },
  ] },
  { city: "Juno", boards: [
    { minLevel: 70, maxLevel: 110, monsters: [
      { name: "Goat", mobId: 1372, questId: 62556, baseExp: 119812, jobExp: 134662 },
      { name: "Harpy", mobId: 1376, questId: 62557, baseExp: 135112, jobExp: 151762 },
      { name: "Sleeper", mobId: 1386, questId: 62558, baseExp: 116325, jobExp: 130500 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Deleter", mobId: 1385, questId: 62710, baseExp: 236025, jobExp: 177075 },
      { name: "Deleter", mobId: 1384, questId: 62711, baseExp: 236025, jobExp: 177075 },
      { name: "Nightmare Terror", mobId: 1379, questId: 62712, baseExp: 274725, jobExp: 206100 },
      { name: "Venatu 1", mobId: 1676, questId: 62713, baseExp: 275400, jobExp: 206550 },
      { name: "Venatu 2", mobId: 1677, questId: 62714, baseExp: 296550, jobExp: 222750 },
      { name: "Venatu 3", mobId: 1678, questId: 62715, baseExp: 297225, jobExp: 222975 },
      { name: "Venatu 4", mobId: 1679, questId: 62716, baseExp: 297225, jobExp: 222975 },
    ] },
  ] },
  { city: "Lighthalzen", boards: [
    { minLevel: 81, maxLevel: 100, monsters: [
      { name: "Metaling", mobId: 1613, questId: 62745, baseExp: 107325, jobExp: 120825 },
      { name: "Rafflesia", mobId: 1162, questId: 62746, baseExp: 131625, jobExp: 148050 },
      { name: "Stem Worm", mobId: 1215, questId: 62747, baseExp: 121500, jobExp: 136575 },
      { name: "Breeze", mobId: 1692, questId: 62748, baseExp: 179775, jobExp: 202050 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Kobold 1", mobId: 1133, questId: 62750, baseExp: 255825, jobExp: 191925 },
      { name: "Kobold 2", mobId: 1134, questId: 62751, baseExp: 218700, jobExp: 164025 },
      { name: "Kobold 3", mobId: 1135, questId: 62752, baseExp: 205425, jobExp: 154125 },
    ] },
    { minLevel: 121, maxLevel: 0, monsters: [
      { name: "Removal", mobId: 1682, questId: 62754, baseExp: 424350, jobExp: 318150 },
      { name: "Rawrel", mobId: 1657, questId: 62755, baseExp: 506250, jobExp: 503550 },
      { name: "Erend", mobId: 1655, questId: 62756, baseExp: 546750, jobExp: 511200 },
      { name: "Armaia", mobId: 1654, questId: 62757, baseExp: 550575, jobExp: 552150 },
      { name: "Whikebain", mobId: 1653, questId: 62758, baseExp: 573075, jobExp: 531000 },
      { name: "Kavac", mobId: 1656, questId: 62759, baseExp: 573975, jobExp: 481050 },
    ] },
    { minLevel: 141, maxLevel: 0, monsters: [
      { name: "Katrinn", mobId: 1639, questId: 62761, baseExp: 1516950, jobExp: 1997550 },
      { name: "Magaleta", mobId: 1637, questId: 62762, baseExp: 1736100, jobExp: 1738912 },
      { name: "Shecil", mobId: 1638, questId: 62763, baseExp: 1863225, jobExp: 1861312 },
      { name: "Eremes", mobId: 1635, questId: 62764, baseExp: 1880325, jobExp: 1993162 },
      { name: "Seyren", mobId: 1634, questId: 62765, baseExp: 1996987, jobExp: 2010825 },
      { name: "Harword", mobId: 1636, questId: 62766, baseExp: 1918687, jobExp: 2022525 },
      { name: "Trentini", mobId: 2227, questId: 62767, baseExp: 1799325, jobExp: 1490400 },
      { name: "Celia", mobId: 2223, questId: 62768, baseExp: 2486925, jobExp: 2139300 },
      { name: "Alphoccio", mobId: 2226, questId: 62769, baseExp: 2496600, jobExp: 2286225 },
      { name: "Gertie", mobId: 2225, questId: 62770, baseExp: 2729925, jobExp: 2276100 },
      { name: "Chen", mobId: 2224, questId: 62771, baseExp: 2889450, jobExp: 2228625 },
      { name: "Flamel", mobId: 2222, questId: 62772, baseExp: 2969550, jobExp: 2596500 },
    ] },
  ] },
  { city: "Mid Camp", boards: [
    { minLevel: 100, maxLevel: 150, monsters: [
      { name: "Pinguicula", mobId: 1995, questId: 62806, baseExp: 249750, jobExp: 186975 },
      { name: "Pinguicula D", mobId: 2015, questId: 62807, baseExp: 236250, jobExp: 272100 },
      { name: "Nepenthes", mobId: 1988, questId: 62808, baseExp: 292275, jobExp: 201600 },
      { name: "Cornus", mobId: 1992, questId: 62599, baseExp: 702000, jobExp: 450450 },
      { name: "Naga", mobId: 1993, questId: 62600, baseExp: 331200, jobExp: 248850 },
    ] },
  ] },
  { city: "Mora", boards: [
    { minLevel: 141, maxLevel: 0, monsters: [
      { name: "Miming", mobId: 2137, questId: 62821, baseExp: 798750, jobExp: 708750 },
      { name: "Little Fatum", mobId: 2136, questId: 62822, baseExp: 843750, jobExp: 731250 },
      { name: "Cenere", mobId: 2365, questId: 62823, baseExp: 800662, jobExp: 848137 },
      { name: "Menblatt", mobId: 2363, questId: 62824, baseExp: 466875, jobExp: 461812 },
      { name: "Petal", mobId: 2364, questId: 62825, baseExp: 456525, jobExp: 378112 },
      { name: "Angra Mantis", mobId: 2133, questId: 62826, baseExp: 876375, jobExp: 789750 },
      { name: "Antique Book", mobId: 2366, questId: 62827, baseExp: 812812, jobExp: 871650 },
      { name: "Lichtern Y", mobId: 2368, questId: 62828, baseExp: 795487, jobExp: 862762 },
      { name: "Lichtern B", mobId: 2367, questId: 62829, baseExp: 808537, jobExp: 846562 },
      { name: "Lichtern R", mobId: 2369, questId: 62830, baseExp: 810112, jobExp: 892800 },
    ] },
  ] },
  { city: "Payon", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Wilow", mobId: 1010, questId: 62644, baseExp: 6975, jobExp: 5175 },
      { name: "Spore", mobId: 1014, questId: 62565, baseExp: 13050, jobExp: 9675 },
    ] },
    { minLevel: 21, maxLevel: 50, monsters: [
      { name: "Bigfoot", mobId: 1060, questId: 62567, baseExp: 20250, jobExp: 22725 },
      { name: "Horn", mobId: 1128, questId: 62797, baseExp: 24300, jobExp: 27225 },
      { name: "Skeleton", mobId: 1076, questId: 62560, baseExp: 18225, jobExp: 20475 },
    ] },
    { minLevel: 41, maxLevel: 75, monsters: [
      { name: "Greatest General", mobId: 1277, questId: 62569, baseExp: 54675, jobExp: 61650 },
      { name: "Wolf", mobId: 1013, questId: 62645, baseExp: 38475, jobExp: 43425 },
      { name: "Archer Skeleton", mobId: 1016, questId: 62562, baseExp: 45450, jobExp: 51075 },
      { name: "Munak", mobId: 1026, questId: 62646, baseExp: 55575, jobExp: 62550 },
    ] },
    { minLevel: 61, maxLevel: 100, monsters: [
      { name: "Sohee", mobId: 1170, questId: 62648, baseExp: 66750, jobExp: 75150 },
      { name: "Dokebi", mobId: 1110, questId: 62649, baseExp: 75900, jobExp: 85350 },
    ] },
  ] },
  { city: "Prontera", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Hornet", mobId: 1004, questId: 62722, baseExp: 9000, jobExp: 6750 },
      { name: "Roda Frog", mobId: 1012, questId: 62723, baseExp: 10125, jobExp: 7650 },
      { name: "Rocker", mobId: 1052, questId: 62724, baseExp: 11025, jobExp: 8325 },
      { name: "Savage Babe", mobId: 1167, questId: 62725, baseExp: 10125, jobExp: 7650 },
      { name: "Thief Bug Egg", mobId: 1048, questId: 62726, baseExp: 14175, jobExp: 15975 },
      { name: "Lunatic", mobId: 1063, questId: 62816, baseExp: 5400, jobExp: 3900 },
    ] },
    { minLevel: 21, maxLevel: 50, monsters: [
      { name: "Thief Bug", mobId: 1051, questId: 62727, baseExp: 14175, jobExp: 15975 },
      { name: "Tarou", mobId: 1175, questId: 62728, baseExp: 15075, jobExp: 17100 },
      { name: "Stainer", mobId: 1174, questId: 62729, baseExp: 14175, jobExp: 15975 },
      { name: "Pecopeco", mobId: 1019, questId: 62730, baseExp: 18225, jobExp: 20475 },
      { name: "Coco", mobId: 1104, questId: 62731, baseExp: 30375, jobExp: 34200 },
      { name: "Yoyo", mobId: 1057, questId: 62732, baseExp: 30375, jobExp: 34200 },
      { name: "Thief Bug", mobId: 1053, questId: 62733, baseExp: 20250, jobExp: 22725 },
      { name: "Thief Bug", mobId: 1054, questId: 62734, baseExp: 22275, jobExp: 25200 },
      { name: "Poporing", mobId: 1031, questId: 62735, baseExp: 22275, jobExp: 25200 },
      { name: "Elder Wilow", mobId: 1033, questId: 62736, baseExp: 26100, jobExp: 29475 },
    ] },
    { minLevel: 41, maxLevel: 70, monsters: [
      { name: "Argos", mobId: 1100, questId: 62737, baseExp: 40500, jobExp: 45450 },
      { name: "Kind Of Beetle", mobId: 1494, questId: 62738, baseExp: 50625, jobExp: 56925 },
      { name: "Savage", mobId: 1166, questId: 62739, baseExp: 64350, jobExp: 72450 },
    ] },
    { minLevel: 61, maxLevel: 100, monsters: [
      { name: "Driller", mobId: 1380, questId: 62740, baseExp: 66825, jobExp: 75150 },
      { name: "Hunter Fly", mobId: 1035, questId: 62741, baseExp: 67950, jobExp: 76500 },
      { name: "Mantis", mobId: 1139, questId: 62742, baseExp: 66825, jobExp: 75263 },
      { name: "Side Winder", mobId: 1037, questId: 62743, baseExp: 162000, jobExp: 182250 },
    ] },
  ] },
  { city: "Umbala", boards: [
    { minLevel: 40, maxLevel: 100, monsters: [
      { name: "Wild Rose", mobId: 1261, questId: 62609, baseExp: 81000, jobExp: 124875 },
      { name: "Dryad", mobId: 1493, questId: 62610, baseExp: 94050, jobExp: 105525 },
      { name: "Wootan Fighter", mobId: 1499, questId: 62611, baseExp: 79650, jobExp: 89775 },
    ] },
  ] },
];
