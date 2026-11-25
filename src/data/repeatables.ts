export interface RepeatableQuest {
  npc: string;
  /** ozro_npcs.npc_id for map deep-link focus */
  npcId: string;
  monster: string;
  map: string;
  minLevel: number;
  maxLevel: number;
  baseExp: number;
  jobExp: number;
}

export const repeatableQuests: RepeatableQuest[] = [
  { npc: 'Halgus', npcId: 'npc_3b2bc7adc73849c0', monster: 'Pupa', map: 'gef_fild04', minLevel: 2, maxLevel: 20, baseExp: 385, jobExp: 30 },
  { npc: 'Langry', npcId: 'npc_0cf50d356ae62c41', monster: 'Fabre', map: 'gef_fild07', minLevel: 2, maxLevel: 20, baseExp: 385, jobExp: 30 },
  { npc: 'Gregor', npcId: 'npc_b327a067fc8eb414', monster: 'Peco Peco', map: 'moc_fild02', minLevel: 10, maxLevel: 30, baseExp: 4000, jobExp: 2000 },
  { npc: 'Laertes', npcId: 'npc_2261ce797e08beeb', monster: 'Creamy', map: 'prt_fild04', minLevel: 15, maxLevel: 44, baseExp: 2950, jobExp: 1125 },
  { npc: 'Nutters', npcId: 'npc_cfbac80ec2bf22bf', monster: 'Coco', map: 'mjolnir_01', minLevel: 18, maxLevel: 59, baseExp: 3600, jobExp: 3905 },
  { npc: 'Yullo', npcId: 'npc_51312da616365195', monster: 'Caramel', map: 'mjolnir_01', minLevel: 24, maxLevel: 60, baseExp: 10425, jobExp: 6272 },
  { npc: 'Private Jeremy', npcId: 'npc_b6dfb7fea3a6fc9d', monster: 'Golem', map: 'moc_fild11', minLevel: 25, maxLevel: 60, baseExp: 14000, jobExp: 9000 },
  { npc: 'Shone', npcId: 'npc_f332e2aaba135a56', monster: 'Hode', map: 'moc_fild17', minLevel: 25, maxLevel: 60, baseExp: 15775, jobExp: 1125 },
  { npc: 'Lemly', npcId: 'npc_559c8b3ceb32fc0d', monster: 'Frilldora', map: 'moc_fild17', minLevel: 30, maxLevel: 65, baseExp: 30000, jobExp: 23000 },
  { npc: 'Li', npcId: 'npc_572ef7519afab110', monster: 'Dokebi', map: 'pay_fild10', minLevel: 35, maxLevel: 70, baseExp: 42000, jobExp: 36000 },
  { npc: 'Mantis Researcher', npcId: 'npc_7c802c8eaef509e2', monster: 'Mantis', map: 'lou_fild01', minLevel: 35, maxLevel: 70, baseExp: 18818, jobExp: 7527 },
  { npc: 'Lella', npcId: 'npc_7d74826c324400c3', monster: 'Leaf Cat', map: 'ayo_fild01', minLevel: 36, maxLevel: 65, baseExp: 25740, jobExp: 31512 },
  { npc: 'Cuir', npcId: 'npc_8176ba95d2f4699c', monster: 'Alligator', map: 'cmd_fild01', minLevel: 45, maxLevel: 80, baseExp: 68950, jobExp: 43300 },
  { npc: 'Dragon Hunter', npcId: 'npc_1b997cf9b27212f4', monster: 'Zhu Po Long', map: 'lou_dun02', minLevel: 50, maxLevel: 90, baseExp: 151300, jobExp: 60520 },
  { npc: 'Local Villager', npcId: 'npc_d61a47843c827fcb', monster: 'Demon Pungus', map: 'ein_fild01', minLevel: 60, maxLevel: 74, baseExp: 250266, jobExp: 144452 },
  { npc: 'Lilla', npcId: 'npc_45097c3b42406295', monster: 'Dryad', map: 'um_fild01', minLevel: 60, maxLevel: 85, baseExp: 262485, jobExp: 141835 },
  { npc: 'Deadman', npcId: 'npc_a95d69c18ef4b980', monster: 'Disguise', map: 'nif_fild01', minLevel: 60, maxLevel: 98, baseExp: 140600, jobExp: 95800 },
  { npc: 'Vegetable Farmer', npcId: 'npc_31f12d2899bbfdda', monster: 'Goat', map: 'ein_fild06', minLevel: 70, maxLevel: 84, baseExp: 258489, jobExp: 155155 },
];
