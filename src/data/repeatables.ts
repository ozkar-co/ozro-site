export interface RepeatableQuest {
  npc: string;
  monster: string;
  map: string;
  minLevel: number;
  maxLevel: number;
  baseExp: number;
  jobExp: number;
}

export const repeatableQuests: RepeatableQuest[] = [
  { npc: 'Halgus', monster: 'Pupa', map: 'gef_fild04', minLevel: 2, maxLevel: 20, baseExp: 385, jobExp: 30 },
  { npc: 'Langry', monster: 'Fabre', map: 'gef_fild07', minLevel: 2, maxLevel: 20, baseExp: 385, jobExp: 30 },
  { npc: 'Gregor', monster: 'Peco Peco', map: 'moc_fild02', minLevel: 10, maxLevel: 30, baseExp: 4000, jobExp: 2000 },
  { npc: 'Laertes', monster: 'Creamy', map: 'prt_fild04', minLevel: 15, maxLevel: 44, baseExp: 2950, jobExp: 1125 },
  { npc: 'Nutters', monster: 'Coco', map: 'mjolnir_01', minLevel: 18, maxLevel: 59, baseExp: 3600, jobExp: 3905 },
  { npc: 'Yullo', monster: 'Caramel', map: 'mjolnir_01', minLevel: 24, maxLevel: 60, baseExp: 10425, jobExp: 6272 },
  { npc: 'Private Jeremy', monster: 'Golem', map: 'moc_fild11', minLevel: 25, maxLevel: 60, baseExp: 14000, jobExp: 9000 },
  { npc: 'Shone', monster: 'Hode', map: 'moc_fild17', minLevel: 25, maxLevel: 60, baseExp: 15775, jobExp: 1125 },
  { npc: 'Lemly', monster: 'Frilldora', map: 'moc_fild17', minLevel: 30, maxLevel: 65, baseExp: 30000, jobExp: 23000 },
  { npc: 'Li', monster: 'Dokebi', map: 'pay_fild10', minLevel: 35, maxLevel: 70, baseExp: 42000, jobExp: 36000 },
  { npc: 'Mantis Researcher', monster: 'Mantis', map: 'lou_fild01', minLevel: 35, maxLevel: 70, baseExp: 18818, jobExp: 7527 },
  { npc: 'Lella', monster: 'Leaf Cat', map: 'ayo_fild01', minLevel: 36, maxLevel: 65, baseExp: 25740, jobExp: 31512 },
  { npc: 'Cuir', monster: 'Alligator', map: 'cmd_fild01', minLevel: 45, maxLevel: 80, baseExp: 68950, jobExp: 43300 },
  { npc: 'Dragon Hunter', monster: 'Zhu Po Long', map: 'lou_dun02', minLevel: 50, maxLevel: 90, baseExp: 151300, jobExp: 60520 },
  { npc: 'Local Villager', monster: 'Demon Pungus', map: 'ein_fild01', minLevel: 60, maxLevel: 74, baseExp: 250266, jobExp: 144452 },
  { npc: 'Lilla', monster: 'Dryad', map: 'um_fild01', minLevel: 60, maxLevel: 85, baseExp: 262485, jobExp: 141835 },
  { npc: 'Deadman', monster: 'Disguise', map: 'nif_fild01', minLevel: 60, maxLevel: 98, baseExp: 140600, jobExp: 95800 },
  { npc: 'Vegetable Farmer', monster: 'Goat', map: 'ein_fild06', minLevel: 70, maxLevel: 84, baseExp: 258489, jobExp: 155155 },
];
