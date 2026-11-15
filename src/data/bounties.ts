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
  { city: "Alberta", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Wormtail", mobId: 1024, questId: 70305, baseExp: 17550, jobExp: 13050 },
    ] },
    { minLevel: 20, maxLevel: 40, monsters: [
      { name: "Hydra", mobId: 1068, questId: 70306, baseExp: 34950, jobExp: 39450 },
    ] },
    { minLevel: 40, maxLevel: 60, monsters: [
      { name: "Pirate Skeleton", mobId: 1071, questId: 70307, baseExp: 55350, jobExp: 62100 },
    ] },
    { minLevel: 80, maxLevel: 100, monsters: [
      { name: "Permeter", mobId: 1314, questId: 70308, baseExp: 195150, jobExp: 220050 },
      { name: "Solider", mobId: 1316, questId: 70309, baseExp: 267600, jobExp: 250650 },
      { name: "Freezer", mobId: 1319, questId: 70310, baseExp: 279900, jobExp: 262350 },
    ] },
  ] },
  { city: "Aldebaran", boards: [
    { minLevel: 140, maxLevel: 0, monsters: [
      { name: "Cursed Box", mobId: 2479, questId: 62890, baseExp: 622800, jobExp: 529650 },
      { name: "Cursed Book", mobId: 2478, questId: 62891, baseExp: 1181250, jobExp: 1782000 },
      { name: "Big Bell", mobId: 2917, questId: 62892, baseExp: 1690425, jobExp: 1902825 },
      { name: "Big Ben", mobId: 2916, questId: 62893, baseExp: 1675575, jobExp: 1576125 },
      { name: "Neo Punk", mobId: 2919, questId: 62894, baseExp: 1321650, jobExp: 1489050 },
    ] },
  ] },
  { city: "Brasilis", boards: [
    { minLevel: 70, maxLevel: 0, monsters: [
      { name: "Curupira", mobId: 2074, questId: 62603, baseExp: 93300, jobExp: 67500 },
      { name: "Headless Mule", mobId: 2071, questId: 62604, baseExp: 151650, jobExp: 168000 },
      { name: "Jaguar", mobId: 2072, questId: 62605, baseExp: 108000, jobExp: 76800 },
      { name: "Toucan", mobId: 2073, questId: 62606, baseExp: 98850, jobExp: 81600 },
      { name: "Piranha", mobId: 2070, questId: 62607, baseExp: 89850, jobExp: 153450 },
      { name: "Iara", mobId: 2069, questId: 62608, baseExp: 160500, jobExp: 133500 },
    ] },
  ] },
  { city: "Comodo", boards: [
    { minLevel: 40, maxLevel: 60, monsters: [
      { name: "Thara Frog", mobId: 1034, questId: 62617, baseExp: 52312, jobExp: 59062 },
      { name: "Sea Otter", mobId: 1323, questId: 62618, baseExp: 72225, jobExp: 81000 },
      { name: "Seal", mobId: 1317, questId: 62619, baseExp: 60750, jobExp: 68287 },
      { name: "Raggler", mobId: 1254, questId: 62620, baseExp: 62212, jobExp: 69862 },
      { name: "Grove", mobId: 1687, questId: 62621, baseExp: 164025, jobExp: 184950 },
      { name: "Alligator", mobId: 1271, questId: 62622, baseExp: 82012, jobExp: 92475 },
      { name: "Flora", mobId: 1118, questId: 62809, baseExp: 59140, jobExp: 66491 },
    ] },
    { minLevel: 60, maxLevel: 105, monsters: [
      { name: "Golem", mobId: 1040, questId: 62623, baseExp: 91125, jobExp: 102600 },
      { name: "Stalactic Golem", mobId: 1278, questId: 62624, baseExp: 113850, jobExp: 128025 },
      { name: "Medusa", mobId: 1148, questId: 62625, baseExp: 293062, jobExp: 219712 },
    ] },
  ] },
  { city: "Dicastes", boards: [
    { minLevel: 101, maxLevel: 140, monsters: [
      { name: "Centipede", mobId: 1987, questId: 62613, baseExp: 360112, jobExp: 304987 },
      { name: "Centipede Larva", mobId: 1999, questId: 62614, baseExp: 329625, jobExp: 225225 },
      { name: "Tatacho", mobId: 1986, questId: 62615, baseExp: 423225, jobExp: 347850 },
      { name: "Dolomedes", mobId: 2092, questId: 62616, baseExp: 579937, jobExp: 579937 },
    ] },
    { minLevel: 120, maxLevel: 0, monsters: [
      { name: "Antler Scaraba", mobId: 2085, questId: 62802, baseExp: 712125, jobExp: 591187 },
      { name: "Horn Scaraba", mobId: 2084, questId: 62803, baseExp: 650250, jobExp: 511762 },
      { name: "Rake Horn Scaraba", mobId: 2086, questId: 62804, baseExp: 786375, jobExp: 674437 },
      { name: "Uni-Horn Scaraba", mobId: 2083, questId: 62805, baseExp: 587250, jobExp: 451237 },
    ] },
  ] },
  { city: "Eclage", boards: [
    { minLevel: 145, maxLevel: 165, monsters: [
      { name: "Antique Book", mobId: 2366, questId: 70387, baseExp: 1083750, jobExp: 1056600 },
      { name: "Cenere", mobId: 2365, questId: 70388, baseExp: 1067550, jobExp: 1028100 },
      { name: "Lichtern Yellow", mobId: 2368, questId: 70389, baseExp: 1060650, jobExp: 1045800 },
      { name: "Lichtern Blue", mobId: 2367, questId: 70390, baseExp: 1078050, jobExp: 1026150 },
      { name: "Lichtern Red", mobId: 2369, questId: 70391, baseExp: 1080150, jobExp: 1082250 },
      { name: "Lichtern Green", mobId: 2370, questId: 70392, baseExp: 1082100, jobExp: 1027800 },
    ] },
  ] },
  { city: "Einbroch", boards: [
    { minLevel: 80, maxLevel: 100, monsters: [
      { name: "Holden", mobId: 1628, questId: 70344, baseExp: 198900, jobExp: 203700 },
      { name: "Metaling", mobId: 1613, questId: 70345, baseExp: 469800, jobExp: 297000 },
      { name: "Noxious", mobId: 1620, questId: 70346, baseExp: 146400, jobExp: 267750 },
      { name: "Porcellio", mobId: 1619, questId: 70347, baseExp: 213300, jobExp: 218250 },
      { name: "Teddy Bear", mobId: 1622, questId: 70348, baseExp: 243000, jobExp: 269850 },
      { name: "Venomous", mobId: 1621, questId: 70349, baseExp: 195900, jobExp: 200550 },
    ] },
  ] },
  { city: "Geffen", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Chonchon", mobId: 1011, questId: 62660, baseExp: 4950, jobExp: 4050 },
      { name: "Roda Frog", mobId: 1012, questId: 62661, baseExp: 10125, jobExp: 7650 },
      { name: "Mandragora", mobId: 1020, questId: 62662, baseExp: 16200, jobExp: 12151 },
      { name: "Ambernite", mobId: 1094, questId: 62663, baseExp: 13050, jobExp: 9675 },
    ] },
    { minLevel: 21, maxLevel: 50, monsters: [
      { name: "Creamy", mobId: 1018, questId: 62664, baseExp: 16200, jobExp: 18225 },
      { name: "Caramel", mobId: 1103, questId: 62665, baseExp: 18225, jobExp: 20475 },
      { name: "Horn", mobId: 1128, questId: 62666, baseExp: 24300, jobExp: 27225 },
      { name: "Poison Spore", mobId: 1077, questId: 62667, baseExp: 18225, jobExp: 20475 },
      { name: "Coco", mobId: 1104, questId: 62810, baseExp: 30375, jobExp: 34200 },
      { name: "Smokie", mobId: 1056, questId: 62811, baseExp: 18225, jobExp: 20475 },
      { name: "Martin", mobId: 1145, questId: 62812, baseExp: 20250, jobExp: 22725 },
      { name: "Elder Willow", mobId: 1033, questId: 62813, baseExp: 26100, jobExp: 29475 },
    ] },
    { minLevel: 41, maxLevel: 75, monsters: [
      { name: "Orc Warrior", mobId: 1023, questId: 62668, baseExp: 39375, jobExp: 60750 },
      { name: "Orc Lady", mobId: 1273, questId: 62669, baseExp: 42750, jobExp: 48825 },
      { name: "Knife Goblin", mobId: 1122, questId: 62670, baseExp: 41400, jobExp: 46575 },
      { name: "Goblin Archer", mobId: 1258, questId: 62671, baseExp: 50625, jobExp: 56925 },
      { name: "Skel Worker", mobId: 1169, questId: 62820, baseExp: 37350, jobExp: 42075 },
    ] },
    { minLevel: 61, maxLevel: 100, monsters: [
      { name: "Ghoul", mobId: 1036, questId: 62672, baseExp: 65475, jobExp: 73800 },
      { name: "Jakk", mobId: 1130, questId: 62673, baseExp: 71100, jobExp: 79875 },
      { name: "Nightmare", mobId: 1061, questId: 62674, baseExp: 56250, jobExp: 116100 },
    ] },
    { minLevel: 81, maxLevel: 120, monsters: [
      { name: "Deviruchi", mobId: 1109, questId: 62675, baseExp: 203175, jobExp: 243675 },
      { name: "Marionette", mobId: 1143, questId: 62676, baseExp: 162225, jobExp: 225900 },
      { name: "Wraith", mobId: 1192, questId: 62677, baseExp: 133875, jobExp: 133875 },
      { name: "Dark Priest", mobId: 1198, questId: 62678, baseExp: 273375, jobExp: 187425 },
      { name: "Gargoyle", mobId: 1253, questId: 62679, baseExp: 213750, jobExp: 160275 },
      { name: "Flying Petite", mobId: 1156, questId: 62680, baseExp: 101250, jobExp: 113850 },
      { name: "Ground Petite", mobId: 1155, questId: 62681, baseExp: 131625, jobExp: 148050 },
      { name: "Evil Druid", mobId: 1117, questId: 62682, baseExp: 150525, jobExp: 144000 },
      { name: "Wind Ghost", mobId: 1263, questId: 62683, baseExp: 103275, jobExp: 150075 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Carat", mobId: 1267, questId: 62684, baseExp: 218700, jobExp: 164025 },
      { name: "Wanderer", mobId: 1208, questId: 62685, baseExp: 381150, jobExp: 277425 },
      { name: "Sting", mobId: 1207, questId: 62686, baseExp: 244350, jobExp: 183150 },
      { name: "Arclouse", mobId: 1194, questId: 62687, baseExp: 207450, jobExp: 293175 },
      { name: "Raydric", mobId: 1163, questId: 62688, baseExp: 311625, jobExp: 233550 },
      { name: "Khalitzburg", mobId: 1132, questId: 62689, baseExp: 321975, jobExp: 241425 },
      { name: "Anolian", mobId: 1206, questId: 62690, baseExp: 329625, jobExp: 249975 },
      { name: "False Angel", mobId: 1371, questId: 62691, baseExp: 236250, jobExp: 176625 },
      { name: "Violy", mobId: 1390, questId: 62692, baseExp: 321975, jobExp: 241425 },
      { name: "Mini Demon", mobId: 1292, questId: 62693, baseExp: 303750, jobExp: 227700 },
      { name: "Majoruros", mobId: 1310, questId: 62815, baseExp: 347625, jobExp: 347625 },
    ] },
  ] },
  { city: "Hugel", boards: [
    { minLevel: 81, maxLevel: 100, monsters: [
      { name: "Red Novus", mobId: 1715, questId: 62789, baseExp: 146700, jobExp: 169200 },
      { name: "Yellow Novus", mobId: 1718, questId: 62790, baseExp: 121500, jobExp: 136575 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Ancient Mimic", mobId: 1699, questId: 62791, baseExp: 275400, jobExp: 232650 },
      { name: "Death Word", mobId: 1698, questId: 62792, baseExp: 288450, jobExp: 216225 },
    ] },
    { minLevel: 121, maxLevel: 160, monsters: [
      { name: "Ferus (Red)", mobId: 1714, questId: 62793, baseExp: 448312, jobExp: 336262 },
      { name: "Ferus (Green)", mobId: 1717, questId: 62794, baseExp: 470812, jobExp: 336262 },
      { name: "Skogul", mobId: 1752, questId: 62795, baseExp: 481500, jobExp: 386775 },
      { name: "Frus", mobId: 1753, questId: 62796, baseExp: 513225, jobExp: 402412 },
      { name: "Blue Acidus", mobId: 1716, questId: 62798, baseExp: 508500, jobExp: 381262 },
      { name: "Gold Acidus", mobId: 1713, questId: 62799, baseExp: 508500, jobExp: 381262 },
    ] },
  ] },
  { city: "Izlude", boards: [
    { minLevel: 40, maxLevel: 60, monsters: [
      { name: "Marina", mobId: 1141, questId: 70300, baseExp: 51000, jobExp: 57150 },
      { name: "Merman", mobId: 1264, questId: 70301, baseExp: 96900, jobExp: 103800 },
      { name: "Plankton", mobId: 1161, questId: 70302, baseExp: 50100, jobExp: 56250 },
      { name: "Strouf", mobId: 1065, questId: 70303, baseExp: 98400, jobExp: 105750 },
      { name: "Vadon", mobId: 1066, questId: 70304, baseExp: 51200, jobExp: 57900 },
    ] },
  ] },
  { city: "Juno", boards: [
    { minLevel: 70, maxLevel: 110, monsters: [
      { name: "Goat", mobId: 1372, questId: 62556, baseExp: 119812, jobExp: 134662 },
      { name: "Harpy", mobId: 1376, questId: 62557, baseExp: 135112, jobExp: 151762 },
      { name: "Sleeper", mobId: 1386, questId: 62558, baseExp: 116325, jobExp: 130500 },
      { name: "Grand Peco", mobId: 1369, questId: 62559, baseExp: 99787, jobExp: 112275 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Ground Deleter", mobId: 1385, questId: 62710, baseExp: 236025, jobExp: 177075 },
      { name: "Flying Deleter", mobId: 1384, questId: 62711, baseExp: 236025, jobExp: 177075 },
      { name: "Nightmare Terror", mobId: 1379, questId: 62712, baseExp: 274725, jobExp: 206100 },
      { name: "Purple Venatu", mobId: 1676, questId: 62713, baseExp: 275400, jobExp: 206550 },
      { name: "Green Venatu", mobId: 1677, questId: 62714, baseExp: 296550, jobExp: 222750 },
      { name: "Orange Venatu", mobId: 1678, questId: 62715, baseExp: 297225, jobExp: 222975 },
      { name: "Blue Venatu", mobId: 1679, questId: 62716, baseExp: 297225, jobExp: 222975 },
      { name: "Apocalypse", mobId: 1365, questId: 62717, baseExp: 342225, jobExp: 256725 },
    ] },
  ] },
  { city: "Lasagna", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Eggring", mobId: 3495, questId: 70393, baseExp: 10000, jobExp: 7500 },
      { name: "Leaf Lunatic", mobId: 3496, questId: 70394, baseExp: 10000, jobExp: 7500 },
      { name: "Grass Fabre", mobId: 3497, questId: 70395, baseExp: 10000, jobExp: 7500 },
      { name: "Wild Hornet", mobId: 3498, questId: 70396, baseExp: 10000, jobExp: 7500 },
      { name: "Sweet Roda Frog", mobId: 3499, questId: 70397, baseExp: 10000, jobExp: 7500 },
      { name: "Hunter Desert Wolf", mobId: 3500, questId: 70398, baseExp: 10000, jobExp: 7500 },
    ] },
    { minLevel: 140, maxLevel: 160, monsters: [
      { name: "Combat Basilisk", mobId: 3503, questId: 70399, baseExp: 200000, jobExp: 150000 },
      { name: "Combat Basilisk", mobId: 3504, questId: 70400, baseExp: 200000, jobExp: 150000 },
      { name: "Jungle Madragora", mobId: 3506, questId: 70401, baseExp: 200000, jobExp: 150000 },
    ] },
  ] },
  { city: "Lighthalzen", boards: [
    { minLevel: 81, maxLevel: 100, monsters: [
      { name: "Metaling", mobId: 1613, questId: 62745, baseExp: 107325, jobExp: 120825 },
      { name: "Rafflesia", mobId: 1162, questId: 62746, baseExp: 131625, jobExp: 148050 },
      { name: "Stem Worm", mobId: 1215, questId: 62747, baseExp: 121500, jobExp: 136575 },
      { name: "Breeze", mobId: 1692, questId: 62748, baseExp: 179775, jobExp: 202050 },
      { name: "Anopheles", mobId: 1627, questId: 62749, baseExp: 190125, jobExp: 213975 },
    ] },
    { minLevel: 101, maxLevel: 150, monsters: [
      { name: "Axe Kobold", mobId: 1133, questId: 62750, baseExp: 255825, jobExp: 191925 },
      { name: "Hammer Kobold", mobId: 1134, questId: 62751, baseExp: 218700, jobExp: 164025 },
      { name: "Mace Kobold", mobId: 1135, questId: 62752, baseExp: 205425, jobExp: 154125 },
      { name: "Kobold Archer", mobId: 1282, questId: 62753, baseExp: 243000, jobExp: 294750 },
    ] },
    { minLevel: 121, maxLevel: 0, monsters: [
      { name: "Remover", mobId: 1682, questId: 62754, baseExp: 424350, jobExp: 318150 },
      { name: "Laurell Weinder", mobId: 1657, questId: 62755, baseExp: 506250, jobExp: 503550 },
      { name: "Errende Ebecee", mobId: 1655, questId: 62756, baseExp: 546750, jobExp: 511200 },
      { name: "Armeyer Dinze", mobId: 1654, questId: 62757, baseExp: 550575, jobExp: 552150 },
      { name: "Wickbine Tres", mobId: 1653, questId: 62758, baseExp: 573075, jobExp: 531000 },
      { name: "Kavach Icarus", mobId: 1656, questId: 62759, baseExp: 573975, jobExp: 481050 },
      { name: "Egnigem Cenia", mobId: 1652, questId: 62760, baseExp: 588510, jobExp: 501750 },
    ] },
    { minLevel: 141, maxLevel: 0, monsters: [
      { name: "Kathryne Keyron", mobId: 1639, questId: 62761, baseExp: 1516950, jobExp: 1997550 },
      { name: "Margaretha Sorin", mobId: 1637, questId: 62762, baseExp: 1736100, jobExp: 1738912 },
      { name: "Cecil Damon", mobId: 1638, questId: 62763, baseExp: 1863225, jobExp: 1861312 },
      { name: "Eremes Guile", mobId: 1635, questId: 62764, baseExp: 1880325, jobExp: 1993162 },
      { name: "Seyren Windsor", mobId: 1634, questId: 62765, baseExp: 1996987, jobExp: 2010825 },
      { name: "Howard Alt-Eisen", mobId: 1636, questId: 62766, baseExp: 1918687, jobExp: 2022525 },
      { name: "Trentini", mobId: 2227, questId: 62767, baseExp: 1799325, jobExp: 1490400 },
      { name: "Celia Alde", mobId: 2223, questId: 62768, baseExp: 2486925, jobExp: 2139300 },
      { name: "Alphoccio", mobId: 2226, questId: 62769, baseExp: 2496600, jobExp: 2286225 },
      { name: "Gertie", mobId: 2225, questId: 62770, baseExp: 2729925, jobExp: 2276100 },
      { name: "Chen Lio", mobId: 2224, questId: 62771, baseExp: 2889450, jobExp: 2228625 },
      { name: "Flamel Emure", mobId: 2222, questId: 62772, baseExp: 2969550, jobExp: 2596500 },
      { name: "Randel Lawrence", mobId: 2221, questId: 62773, baseExp: 3641175, jobExp: 2706075 },
    ] },
  ] },
  { city: "Lutie", boards: [
    { minLevel: 20, maxLevel: 40, monsters: [
      { name: "Cookie", mobId: 1265, questId: 70335, baseExp: 35100, jobExp: 39600 },
      { name: "Christmas Cookie", mobId: 1246, questId: 70336, baseExp: 42300, jobExp: 47550 },
      { name: "Cruiser", mobId: 1248, questId: 70337, baseExp: 43200, jobExp: 48600 },
      { name: "Marin", mobId: 1243, questId: 70338, baseExp: 126300, jobExp: 129000 },
      { name: "Myst Case", mobId: 1249, questId: 70339, baseExp: 43200, jobExp: 48600 },
    ] },
  ] },
  { city: "Malangdo", boards: [
    { minLevel: 75, maxLevel: 95, monsters: [
      { name: "Red Eruma", mobId: 2197, questId: 70342, baseExp: 286200, jobExp: 286200 },
      { name: "Siorava", mobId: 2199, questId: 70343, baseExp: 180000, jobExp: 180000 },
    ] },
  ] },
  { city: "Manuk", boards: [
    { minLevel: 120, maxLevel: 140, monsters: [
      { name: "Bradium Golem", mobId: 2024, questId: 70374, baseExp: 1277700, jobExp: 539250 },
      { name: "Centipede Larva", mobId: 1999, questId: 70375, baseExp: 571200, jobExp: 300450 },
      { name: "Tatacho", mobId: 1986, questId: 70376, baseExp: 733500, jobExp: 463800 },
    ] },
    { minLevel: 140, maxLevel: 160, monsters: [
      { name: "Uni Horn Scaraba", mobId: 2083, questId: 70377, baseExp: 783000, jobExp: 601650 },
      { name: "Horn Scaraba", mobId: 2084, questId: 70378, baseExp: 867000, jobExp: 682350 },
      { name: "Antler Scaraba", mobId: 2085, questId: 70379, baseExp: 949500, jobExp: 788250 },
      { name: "Rake Scaraba", mobId: 2086, questId: 70380, baseExp: 1048500, jobExp: 899250 },
    ] },
  ] },
  { city: "Mid Camp", boards: [
    { minLevel: 100, maxLevel: 150, monsters: [
      { name: "Pinguicula", mobId: 1995, questId: 62806, baseExp: 249750, jobExp: 186975 },
      { name: "Dark Pinguicula", mobId: 2015, questId: 62807, baseExp: 236250, jobExp: 272100 },
      { name: "Nepenthes", mobId: 1988, questId: 62808, baseExp: 292275, jobExp: 201600 },
      { name: "Cornus", mobId: 1992, questId: 62599, baseExp: 702000, jobExp: 450450 },
      { name: "Naga", mobId: 1993, questId: 62600, baseExp: 331200, jobExp: 248850 },
      { name: "Luciola Vespa", mobId: 1994, questId: 62602, baseExp: 182475, jobExp: 203175 },
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
      { name: "Yellow Lichtern", mobId: 2368, questId: 62828, baseExp: 795487, jobExp: 862762 },
      { name: "Blue Lichtern", mobId: 2367, questId: 62829, baseExp: 808537, jobExp: 846562 },
      { name: "Red Lichtern", mobId: 2369, questId: 62830, baseExp: 810112, jobExp: 892800 },
      { name: "Green Lichtern", mobId: 2370, questId: 62831, baseExp: 811575, jobExp: 847912 },
    ] },
  ] },
  { city: "Morocc", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Baby Desert Wolf", mobId: 1107, questId: 70311, baseExp: 13500, jobExp: 10200 },
      { name: "Drops", mobId: 1113, questId: 70312, baseExp: 4050, jobExp: 3000 },
      { name: "Picky", mobId: 1049, questId: 70313, baseExp: 9450, jobExp: 7050 },
      { name: "Picky (Shell)", mobId: 1050, questId: 70314, baseExp: 10800, jobExp: 8100 },
      { name: "Scorpion", mobId: 1001, questId: 70315, baseExp: 16200, jobExp: 12150 },
    ] },
    { minLevel: 20, maxLevel: 40, monsters: [
      { name: "Ant Egg", mobId: 1097, questId: 70316, baseExp: 27000, jobExp: 30450 },
      { name: "Andre", mobId: 1095, questId: 70317, baseExp: 32400, jobExp: 36450 },
      { name: "Deniro", mobId: 1105, questId: 70318, baseExp: 31050, jobExp: 34950 },
      { name: "Familiar", mobId: 1005, questId: 70319, baseExp: 21600, jobExp: 24300 },
      { name: "Piere", mobId: 1160, questId: 70320, baseExp: 32400, jobExp: 36450 },
    ] },
    { minLevel: 40, maxLevel: 60, monsters: [
      { name: "Isis", mobId: 1029, questId: 70321, baseExp: 83700, jobExp: 88500 },
      { name: "Metaller", mobId: 1058, questId: 70322, baseExp: 70800, jobExp: 76050 },
      { name: "Minorous", mobId: 1149, questId: 70323, baseExp: 85500, jobExp: 84300 },
      { name: "Mummy", mobId: 1041, questId: 70324, baseExp: 76500, jobExp: 82200 },
      { name: "Verit", mobId: 1032, questId: 70325, baseExp: 65100, jobExp: 70050 },
    ] },
    { minLevel: 60, maxLevel: 80, monsters: [
      { name: "Golem", mobId: 1040, questId: 70326, baseExp: 84900, jobExp: 91200 },
      { name: "Hode", mobId: 1127, questId: 70327, baseExp: 99600, jobExp: 106500 },
      { name: "Marduk", mobId: 1140, questId: 70328, baseExp: 127500, jobExp: 130800 },
      { name: "Pasana", mobId: 1154, questId: 70329, baseExp: 160200, jobExp: 179100 },
      { name: "Sandman", mobId: 1165, questId: 70330, baseExp: 98400, jobExp: 105750 },
      { name: "Zerom", mobId: 1178, questId: 70331, baseExp: 113400, jobExp: 144000 },
    ] },
    { minLevel: 120, maxLevel: 140, monsters: [
      { name: "Minorus (Nightmare)", mobId: 2353, questId: 70332, baseExp: 660300, jobExp: 573000 },
      { name: "Mimic (Nightmare)", mobId: 2356, questId: 70333, baseExp: 480150, jobExp: 811200 },
      { name: "Verit (Nightmare)", mobId: 2355, questId: 70334, baseExp: 622200, jobExp: 471300 },
    ] },
  ] },
  { city: "Niflheim", boards: [
    { minLevel: 100, maxLevel: 120, monsters: [
      { name: "Disguise", mobId: 1506, questId: 70340, baseExp: 401700, jobExp: 251100 },
      { name: "Loli Ruri", mobId: 1505, questId: 70341, baseExp: 502200, jobExp: 313950 },
    ] },
  ] },
  { city: "Payon", boards: [
    { minLevel: 1, maxLevel: 20, monsters: [
      { name: "Willow", mobId: 1010, questId: 62644, baseExp: 6975, jobExp: 5175 },
      { name: "Spore", mobId: 1014, questId: 62565, baseExp: 13050, jobExp: 9675 },
      { name: "Snake", mobId: 1025, questId: 62566, baseExp: 13050, jobExp: 9675 },
    ] },
    { minLevel: 21, maxLevel: 50, monsters: [
      { name: "Bigfoot", mobId: 1060, questId: 62567, baseExp: 20250, jobExp: 22725 },
      { name: "Horn", mobId: 1128, questId: 62797, baseExp: 24300, jobExp: 27225 },
      { name: "Skeleton", mobId: 1076, questId: 62560, baseExp: 18225, jobExp: 20475 },
      { name: "Soldier Skeleton", mobId: 1028, questId: 62561, baseExp: 24300, jobExp: 27225 },
    ] },
    { minLevel: 41, maxLevel: 75, monsters: [
      { name: "Greatest General", mobId: 1277, questId: 62569, baseExp: 54675, jobExp: 61650 },
      { name: "Wolf", mobId: 1013, questId: 62645, baseExp: 38475, jobExp: 43425 },
      { name: "Archer Skeleton", mobId: 1016, questId: 62562, baseExp: 45450, jobExp: 51075 },
      { name: "Munak", mobId: 1026, questId: 62646, baseExp: 55575, jobExp: 62550 },
      { name: "Bongun", mobId: 1188, questId: 62647, baseExp: 59625, jobExp: 67050 },
    ] },
    { minLevel: 61, maxLevel: 100, monsters: [
      { name: "Sohee", mobId: 1170, questId: 62648, baseExp: 66750, jobExp: 75150 },
      { name: "Dokebi", mobId: 1110, questId: 62649, baseExp: 75900, jobExp: 85350 },
      { name: "Nine Tail", mobId: 1180, questId: 62650, baseExp: 99750, jobExp: 112200 },
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
      { name: "Ambernite", mobId: 1094, questId: 62817, baseExp: 13050, jobExp: 9675 },
    ] },
    { minLevel: 21, maxLevel: 50, monsters: [
      { name: "Thief Bug", mobId: 1051, questId: 62727, baseExp: 14175, jobExp: 15975 },
      { name: "Tarou", mobId: 1175, questId: 62728, baseExp: 15075, jobExp: 17100 },
      { name: "Stainer", mobId: 1174, questId: 62729, baseExp: 14175, jobExp: 15975 },
      { name: "Peco Peco", mobId: 1019, questId: 62730, baseExp: 18225, jobExp: 20475 },
      { name: "Coco", mobId: 1104, questId: 62731, baseExp: 30375, jobExp: 34200 },
      { name: "Yoyo", mobId: 1057, questId: 62732, baseExp: 30375, jobExp: 34200 },
      { name: "Female Thief Bug", mobId: 1053, questId: 62733, baseExp: 20250, jobExp: 22725 },
      { name: "Male Thief Bug", mobId: 1054, questId: 62734, baseExp: 22275, jobExp: 25200 },
      { name: "Poporing", mobId: 1031, questId: 62735, baseExp: 22275, jobExp: 25200 },
      { name: "Elder Willow", mobId: 1033, questId: 62736, baseExp: 26100, jobExp: 29475 },
      { name: "Muka", mobId: 1055, questId: 62818, baseExp: 12150, jobExp: 27337 },
    ] },
    { minLevel: 41, maxLevel: 70, monsters: [
      { name: "Argos", mobId: 1100, questId: 62737, baseExp: 40500, jobExp: 45450 },
      { name: "Beetle King", mobId: 1494, questId: 62738, baseExp: 50625, jobExp: 56925 },
      { name: "Savage", mobId: 1166, questId: 62739, baseExp: 64350, jobExp: 72450 },
      { name: "Magnolia", mobId: 1138, questId: 62819, baseExp: 49500, jobExp: 55575 },
    ] },
    { minLevel: 61, maxLevel: 100, monsters: [
      { name: "Driller", mobId: 1380, questId: 62740, baseExp: 66825, jobExp: 75150 },
      { name: "Hunter Fly", mobId: 1035, questId: 62741, baseExp: 67950, jobExp: 76500 },
      { name: "Mantis", mobId: 1139, questId: 62742, baseExp: 66825, jobExp: 75263 },
      { name: "Sidewinder", mobId: 1037, questId: 62743, baseExp: 162000, jobExp: 182250 },
      { name: "Argiope", mobId: 1099, questId: 62744, baseExp: 91125, jobExp: 102600 },
    ] },
  ] },
  { city: "Rachel", boards: [
    { minLevel: 80, maxLevel: 100, monsters: [
      { name: "Anacondaq", mobId: 1030, questId: 70350, baseExp: 288300, jobExp: 180300 },
      { name: "Roween", mobId: 1782, questId: 70351, baseExp: 304200, jobExp: 285300 },
      { name: "Siroma", mobId: 1776, questId: 70352, baseExp: 274050, jobExp: 205350 },
    ] },
    { minLevel: 100, maxLevel: 120, monsters: [
      { name: "Desert Wolf", mobId: 1220, questId: 70353, baseExp: 931800, jobExp: 631800 },
      { name: "Drosera", mobId: 1781, questId: 70354, baseExp: 243000, jobExp: 151950 },
      { name: "Hill Wind", mobId: 1680, questId: 70355, baseExp: 342000, jobExp: 213750 },
      { name: "Ice Titan", mobId: 1777, questId: 70356, baseExp: 490200, jobExp: 396600 },
      { name: "Snowier", mobId: 1775, questId: 70357, baseExp: 349800, jobExp: 218700 },
    ] },
    { minLevel: 120, maxLevel: 140, monsters: [
      { name: "Agav", mobId: 1769, questId: 70358, baseExp: 766800, jobExp: 442350 },
      { name: "Echio", mobId: 1787, questId: 70359, baseExp: 719400, jobExp: 415200 },
      { name: "Hodremlin", mobId: 1773, questId: 70360, baseExp: 732600, jobExp: 422850 },
      { name: "Isilla", mobId: 1772, questId: 70361, baseExp: 673800, jobExp: 388800 },
      { name: "Seeker", mobId: 1774, questId: 70362, baseExp: 781800, jobExp: 450900 },
      { name: "Vanberk", mobId: 1771, questId: 70363, baseExp: 631800, jobExp: 364500 },
    ] },
  ] },
  { city: "Splendide", boards: [
    { minLevel: 100, maxLevel: 120, monsters: [
      { name: "Pinguicula", mobId: 1995, questId: 70381, baseExp: 438000, jobExp: 399300 },
      { name: "Dark Pinguicula", mobId: 2015, questId: 70382, baseExp: 409500, jobExp: 362850 },
      { name: "Nepenthes", mobId: 1988, questId: 70383, baseExp: 506700, jobExp: 268950 },
      { name: "Cornus", mobId: 1992, questId: 70384, baseExp: 1216800, jobExp: 600600 },
      { name: "Naga", mobId: 1993, questId: 70385, baseExp: 573900, jobExp: 331800 },
      { name: "Luciola Vespa", mobId: 1994, questId: 70386, baseExp: 441900, jobExp: 270900 },
    ] },
  ] },
  { city: "Umbala", boards: [
    { minLevel: 40, maxLevel: 100, monsters: [
      { name: "Wild Rose", mobId: 1261, questId: 62609, baseExp: 81000, jobExp: 124875 },
      { name: "Dryad", mobId: 1493, questId: 62610, baseExp: 94050, jobExp: 105525 },
      { name: "Wootan Fighter", mobId: 1499, questId: 62611, baseExp: 79650, jobExp: 89775 },
      { name: "Parasite", mobId: 1500, questId: 62612, baseExp: 103725, jobExp: 150300 },
    ] },
  ] },
  { city: "Veins", boards: [
    { minLevel: 100, maxLevel: 120, monsters: [
      { name: "Drosera", mobId: 1781, questId: 70364, baseExp: 243000, jobExp: 151950 },
      { name: "Galion", mobId: 1783, questId: 70365, baseExp: 318300, jobExp: 199050 },
      { name: "Magmaring", mobId: 1836, questId: 70366, baseExp: 456300, jobExp: 285450 },
      { name: "Muscipular", mobId: 1780, questId: 70367, baseExp: 349800, jobExp: 218700 },
    ] },
    { minLevel: 120, maxLevel: 140, monsters: [
      { name: "Kasa", mobId: 1833, questId: 70368, baseExp: 1091700, jobExp: 1156350 },
      { name: "Knocker", mobId: 1838, questId: 70369, baseExp: 719400, jobExp: 565200 },
      { name: "Necromancer", mobId: 1870, questId: 70370, baseExp: 897000, jobExp: 897000 },
      { name: "Ragged Zombie", mobId: 1865, questId: 70371, baseExp: 572100, jobExp: 463050 },
      { name: "Salamander", mobId: 1831, questId: 70372, baseExp: 1154100, jobExp: 1070850 },
      { name: "Zombie Slaughter", mobId: 1864, questId: 70373, baseExp: 620700, jobExp: 405300 },
    ] },
  ] },
];
