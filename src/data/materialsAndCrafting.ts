/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BlockId,
  MaterialId,
  MaterialDefinition,
  MaterialInventory,
  CraftingRecipe,
  AnimalType,
  EnemyType,
  ChestRarity,
} from '../types/game';

export const MATERIAL_DEFINITIONS: Record<MaterialId, MaterialDefinition> = {
  wood: {
    id: 'wood',
    name: 'Madera Digital',
    category: 'bloque_natural',
    color: '#8b5a2b',
    emoji: '🪵',
    description: 'Tronco vóxel recolectado al talar árboles o estructuras de madera.',
    placeableBlockId: 'wood',
  },
  stone: {
    id: 'stone',
    name: 'Piedra Matrix',
    category: 'bloque_natural',
    color: '#6c757d',
    emoji: '🪨',
    description: 'Roca sólida estructural extraída al minar el terreno.',
    placeableBlockId: 'stone',
  },
  dirt: {
    id: 'dirt',
    name: 'Tierra Vóxel',
    category: 'bloque_natural',
    color: '#6f4e37',
    emoji: '🟫',
    description: 'Sustrato orgánico básico recolectado del suelo.',
    placeableBlockId: 'dirt',
  },
  grass: {
    id: 'grass',
    name: 'Césped Cuántico',
    category: 'bloque_natural',
    color: '#38b000',
    emoji: '🌿',
    description: 'Bloque vivo de superficie con bio-energía verde.',
    placeableBlockId: 'grass',
  },
  leaves: {
    id: 'leaves',
    name: 'Hojas Holográficas',
    category: 'bloque_natural',
    color: '#2d6a4f',
    emoji: '🍃',
    description: 'Follaje luminiscente extraído de las copas de los árboles.',
    placeableBlockId: 'leaves',
  },
  void_rock: {
    id: 'void_rock',
    name: 'Obsidiana del Vacío',
    category: 'bloque_natural',
    color: '#1b1b1e',
    emoji: '🖤',
    description: 'Roca volcánica ultra-densa del Cataclismo.',
    placeableBlockId: 'void_rock',
  },
  neon_cyan: {
    id: 'neon_cyan',
    name: 'Neón Cian de Victoria',
    category: 'bloque_avanzado',
    color: '#00f5d4',
    emoji: '💎',
    description: 'Cristal fotónico cian de alta conductividad.',
    placeableBlockId: 'neon_cyan',
  },
  neon_magenta: {
    id: 'neon_magenta',
    name: 'Magma Magenta',
    category: 'bloque_avanzado',
    color: '#f72585',
    emoji: '🔮',
    description: 'Bloque incandescente de energía plasma magenta.',
    placeableBlockId: 'neon_magenta',
  },
  crystal_gold: {
    id: 'crystal_gold',
    name: 'Cristal de Creación',
    category: 'bloque_avanzado',
    color: '#fee440',
    emoji: '✨',
    description: 'Gema dorada pura utilizada para forjar artefactos y mecanismos.',
    placeableBlockId: 'crystal_gold',
  },
  quantum_tech: {
    id: 'quantum_tech',
    name: 'Núcleo Cuántico',
    category: 'bloque_avanzado',
    color: '#4361ee',
    emoji: '⚙️',
    description: 'Procesador vóxel avanzado capaz de alterar la física.',
    placeableBlockId: 'quantum_tech',
  },
  jump_pad: {
    id: 'jump_pad',
    name: 'Plataforma de Salto',
    category: 'bloque_avanzado',
    color: '#ff5400',
    emoji: '🚀',
    description: 'Mecanismo gravitacional que impulsa al jugador por los aires.',
    placeableBlockId: 'jump_pad',
  },
  teleport_pad: {
    id: 'teleport_pad',
    name: 'Teletransportador',
    category: 'bloque_avanzado',
    color: '#ff0054',
    emoji: '🌀',
    description: 'Portal cuántico fabricado al unir núcleos y esencia glitch.',
    placeableBlockId: 'teleport_pad',
  },
  light_block: {
    id: 'light_block',
    name: 'Faro de Victoria',
    category: 'bloque_avanzado',
    color: '#ffffff',
    emoji: '💡',
    description: 'Emisor lumínico solar que disipa la oscuridad.',
    placeableBlockId: 'light_block',
  },
  quantum_wool: {
    id: 'quantum_wool',
    name: 'Lana Cuántica',
    category: 'recurso_animal',
    color: '#38bdf8',
    emoji: '🧶',
    description: 'Fibra suave y elástica obtenida de las Ovejas Cuánticas.',
  },
  cyber_leather: {
    id: 'cyber_leather',
    name: 'Cuero Cibernético',
    category: 'recurso_animal',
    color: '#b45309',
    emoji: '🛡️',
    description: 'Piel resistente con filamentos metálicos de Lobo Cibernético.',
  },
  neon_meat: {
    id: 'neon_meat',
    name: 'Chuleta Energética',
    category: 'recurso_animal',
    color: '#f472b6',
    emoji: '🥩',
    description: 'Alimento rico en bio-energía obtenido de Cerditos Neón. Restaura salud.',
  },
  photon_feather: {
    id: 'photon_feather',
    name: 'Pluma de Fotones',
    category: 'recurso_animal',
    color: '#fde047',
    emoji: '🪶',
    description: 'Pluma gravitacional ultraligera de Dron Ave.',
  },
  glitch_essence: {
    id: 'glitch_essence',
    name: 'Esencia Glitch',
    category: 'botin_enemigo',
    color: '#a855f7',
    emoji: '👾',
    description: 'Fragmento de código inestable soltado al eliminar NPCs y Corruptores.',
  },
  dark_alloy: {
    id: 'dark_alloy',
    name: 'Aleación Sombra',
    category: 'botin_enemigo',
    color: '#ef4444',
    emoji: '⚔️',
    description: 'Metal blindado de grado militar obtenido al derrotar Caballeros Sombra NPC y Gólems.',
  },
  plasma_cell: {
    id: 'plasma_cell',
    name: 'Célula de Plasma',
    category: 'botin_enemigo',
    color: '#06b6d4',
    emoji: '🔋',
    description: 'Batería sobrecargada recuperada de Saqueadores NPC e Invasores.',
  },
};

export const MATERIAL_LIST: MaterialDefinition[] = Object.values(MATERIAL_DEFINITIONS);

export const INITIAL_MATERIAL_INVENTORY: MaterialInventory = {
  wood: 6,
  stone: 8,
  dirt: 6,
  grass: 4,
  neon_cyan: 4,
  quantum_wool: 2,
  neon_meat: 2,
  glitch_essence: 2,
};

// Map mined block to material drop(s)
export function getBlockDrops(blockId: BlockId): Array<{ materialId: MaterialId; count: number }> {
  switch (blockId) {
    case 'wood':
      return [{ materialId: 'wood', count: 2 }];
    case 'stone':
      return Math.random() > 0.7
        ? [
            { materialId: 'stone', count: 1 },
            { materialId: 'crystal_gold', count: 1 },
          ]
        : [{ materialId: 'stone', count: 2 }];
    case 'dirt':
      return [{ materialId: 'dirt', count: 1 }];
    case 'grass':
      return [
        { materialId: 'grass', count: 1 },
        { materialId: 'dirt', count: 1 },
      ];
    case 'leaves':
      return [{ materialId: 'leaves', count: 1 }];
    case 'void_rock':
      return [
        { materialId: 'void_rock', count: 1 },
        { materialId: 'dark_alloy', count: 1 },
      ];
    case 'neon_cyan':
      return [{ materialId: 'neon_cyan', count: 1 }];
    case 'neon_magenta':
      return [{ materialId: 'neon_magenta', count: 1 }];
    case 'crystal_gold':
      return [{ materialId: 'crystal_gold', count: 2 }];
    case 'quantum_tech':
      return [{ materialId: 'quantum_tech', count: 1 }];
    case 'jump_pad':
      return [{ materialId: 'jump_pad', count: 1 }];
    case 'teleport_pad':
      return [{ materialId: 'teleport_pad', count: 1 }];
    case 'light_block':
      return [{ materialId: 'light_block', count: 1 }];
    default:
      return [{ materialId: 'stone', count: 1 }];
  }
}

// Map animal to Minecraft-style drops when harvested
export function getAnimalDrops(animalType: AnimalType): Array<{ materialId: MaterialId; count: number }> {
  switch (animalType) {
    case 'quantum_sheep':
      return [
        { materialId: 'quantum_wool', count: 2 },
        { materialId: 'neon_meat', count: 1 },
      ];
    case 'cyber_dog':
      return [
        { materialId: 'cyber_leather', count: 2 },
        { materialId: 'plasma_cell', count: 1 },
      ];
    case 'neon_pig':
      return [{ materialId: 'neon_meat', count: 3 }];
    case 'holo_bird':
    default:
      return [
        { materialId: 'photon_feather', count: 2 },
        { materialId: 'neon_meat', count: 1 },
      ];
  }
}

// Map enemy / hostile NPC to drops when defeated
export function getEnemyDrops(enemyType: EnemyType): Array<{ materialId: MaterialId; count: number }> {
  switch (enemyType) {
    case 'npc_raider':
      return [
        { materialId: 'plasma_cell', count: 2 },
        { materialId: 'glitch_essence', count: 1 },
        { materialId: 'wood', count: 2 },
      ];
    case 'npc_shadow_knight':
      return [
        { materialId: 'dark_alloy', count: 2 },
        { materialId: 'crystal_gold', count: 2 },
      ];
    case 'npc_corrupted_hacker':
      return [
        { materialId: 'glitch_essence', count: 2 },
        { materialId: 'quantum_tech', count: 1 },
        { materialId: 'plasma_cell', count: 1 },
      ];
    case 'void_golem':
      return [
        { materialId: 'dark_alloy', count: 3 },
        { materialId: 'void_rock', count: 3 },
        { materialId: 'quantum_tech', count: 2 },
      ];
    case 'glitch_corruptor':
      return [
        { materialId: 'glitch_essence', count: 2 },
        { materialId: 'neon_magenta', count: 2 },
      ];
    case 'data_specter':
      return [
        { materialId: 'plasma_cell', count: 2 },
        { materialId: 'neon_cyan', count: 2 },
      ];
    case 'cyber_spider':
    default:
      return [
        { materialId: 'glitch_essence', count: 1 },
        { materialId: 'quantum_wool', count: 2 },
      ];
  }
}

// Generate randomized loot bundle when opening a 3D Treasure Chest
export function getChestLoot(rarity: ChestRarity): {
  drops: Array<{ materialId: MaterialId; count: number }>;
  rewardPoints: number;
  healHp: number;
} {
  const pickRandom = <T,>(pool: T[], count: number): T[] => {
    const copy = [...pool];
    const picked: T[] = [];
    while (picked.length < count && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
  };

  if (rarity === 'legendario') {
    const pool: Array<{ materialId: MaterialId; count: number }> = [
      { materialId: 'dark_alloy', count: 4 },
      { materialId: 'plasma_cell', count: 4 },
      { materialId: 'glitch_essence', count: 4 },
      { materialId: 'teleport_pad', count: 2 },
      { materialId: 'crystal_gold', count: 5 },
      { materialId: 'quantum_tech', count: 4 },
      { materialId: 'jump_pad', count: 2 },
    ];
    return {
      drops: pickRandom(pool, 4),
      rewardPoints: 650,
      healHp: 45,
    };
  }

  if (rarity === 'raro') {
    const pool: Array<{ materialId: MaterialId; count: number }> = [
      { materialId: 'crystal_gold', count: 3 },
      { materialId: 'quantum_tech', count: 3 },
      { materialId: 'cyber_leather', count: 3 },
      { materialId: 'glitch_essence', count: 2 },
      { materialId: 'plasma_cell', count: 2 },
      { materialId: 'jump_pad', count: 1 },
      { materialId: 'light_block', count: 2 },
      { materialId: 'neon_magenta', count: 3 },
    ];
    return {
      drops: pickRandom(pool, 3),
      rewardPoints: 320,
      healHp: 25,
    };
  }

  // 'comun'
  const pool: Array<{ materialId: MaterialId; count: number }> = [
    { materialId: 'wood', count: 5 },
    { materialId: 'stone', count: 5 },
    { materialId: 'neon_cyan', count: 3 },
    { materialId: 'quantum_wool', count: 3 },
    { materialId: 'neon_meat', count: 3 },
    { materialId: 'photon_feather', count: 2 },
    { materialId: 'leaves', count: 4 },
  ];
  return {
    drops: pickRandom(pool, 3),
    rewardPoints: 150,
    healHp: 15,
  };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_neon_cyan',
    name: 'Cristal Neón Cian (x4)',
    description: 'Une Madera Digital y Piedra Matrix para sintetizar bloques luminosos Neón Cian.',
    emoji: '💎',
    category: 'bloques',
    ingredients: [
      { materialId: 'wood', count: 2 },
      { materialId: 'stone', count: 2 },
    ],
    resultType: 'material',
    outputMaterialId: 'neon_cyan',
    outputCount: 4,
    bonusPoints: 45,
  },
  {
    id: 'craft_neon_magenta',
    name: 'Magma Magenta (x4)',
    description: 'Fusiona Piedra Matrix con Esencia Glitch para crear bloques de Magma Magenta.',
    emoji: '🔮',
    category: 'bloques',
    ingredients: [
      { materialId: 'stone', count: 2 },
      { materialId: 'glitch_essence', count: 1 },
    ],
    resultType: 'material',
    outputMaterialId: 'neon_magenta',
    outputCount: 4,
    bonusPoints: 60,
  },
  {
    id: 'craft_crystal_gold',
    name: 'Cristal de Creación Dorado (x3)',
    description: 'Refina Neón Cian y Células de Plasma en Cristales Dorados de alta pureza.',
    emoji: '✨',
    category: 'bloques',
    ingredients: [
      { materialId: 'neon_cyan', count: 2 },
      { materialId: 'plasma_cell', count: 1 },
    ],
    resultType: 'material',
    outputMaterialId: 'crystal_gold',
    outputCount: 3,
    bonusPoints: 80,
  },
  {
    id: 'craft_quantum_tech',
    name: 'Núcleo Cuántico (x2)',
    description: 'Une Aleación Sombra y Esencia Glitch para ensamblar procesadores vóxel.',
    emoji: '⚙️',
    category: 'bloques',
    ingredients: [
      { materialId: 'dark_alloy', count: 1 },
      { materialId: 'glitch_essence', count: 1 },
    ],
    resultType: 'material',
    outputMaterialId: 'quantum_tech',
    outputCount: 2,
    bonusPoints: 95,
  },
  {
    id: 'craft_jump_pad',
    name: 'Plataforma de Salto (x2)',
    description: 'Combina Lana Cuántica elástica y Neón Cian para construir trampolines gravitacionales.',
    emoji: '🚀',
    category: 'mecanismos',
    ingredients: [
      { materialId: 'quantum_wool', count: 2 },
      { materialId: 'neon_cyan', count: 2 },
    ],
    resultType: 'material',
    outputMaterialId: 'jump_pad',
    outputCount: 2,
    bonusPoints: 110,
  },
  {
    id: 'craft_teleport_pad',
    name: 'Teletransportador Cuántico (x1)',
    description: 'Une un Núcleo Cuántico con Esencia Glitch y Pluma de Fotones para abrir portales.',
    emoji: '🌀',
    category: 'mecanismos',
    ingredients: [
      { materialId: 'quantum_tech', count: 1 },
      { materialId: 'glitch_essence', count: 2 },
    ],
    resultType: 'material',
    outputMaterialId: 'teleport_pad',
    outputCount: 1,
    bonusPoints: 150,
  },
  {
    id: 'craft_light_block',
    name: 'Faro de Victoria (x3)',
    description: 'Une Cristal Dorado con Madera Digital para fabricar faros solares brillantes.',
    emoji: '💡',
    category: 'mecanismos',
    ingredients: [
      { materialId: 'crystal_gold', count: 1 },
      { materialId: 'wood', count: 2 },
    ],
    resultType: 'material',
    outputMaterialId: 'light_block',
    outputCount: 3,
    bonusPoints: 75,
  },
  {
    id: 'craft_heal_feast',
    name: 'Banquete Energético (+60 HP)',
    description: 'Cocina Chuletas Energéticas con Césped Cuántico para restaurar 60 HP de inmediato.',
    emoji: '🍖',
    category: 'supervivencia',
    ingredients: [
      { materialId: 'neon_meat', count: 2 },
      { materialId: 'grass', count: 1 },
    ],
    resultType: 'heal',
    outputCount: 60,
    bonusPoints: 50,
  },
  {
    id: 'craft_nano_armor',
    name: 'Blindaje Cibernético (+25 Salud Máx)',
    description: 'Une Cuero Cibernético y Lana Cuántica para reforzar tu exoesqueleto y curarte.',
    emoji: '🛡️',
    category: 'supervivencia',
    ingredients: [
      { materialId: 'cyber_leather', count: 2 },
      { materialId: 'quantum_wool', count: 2 },
    ],
    resultType: 'max_hp',
    outputCount: 25,
    bonusPoints: 140,
  },
  {
    id: 'craft_weapon_overcharge',
    name: 'Filo y Cañón Sobrecargado (+20% Daño)',
    description: 'Forja Aleación Sombra y Células de Plasma para aumentar permanentemente el daño de tus armas.',
    emoji: '⚡',
    category: 'armas',
    ingredients: [
      { materialId: 'dark_alloy', count: 2 },
      { materialId: 'plasma_cell', count: 2 },
    ],
    resultType: 'weapon_upgrade',
    outputCount: 20,
    bonusPoints: 200,
  },
];

/**
 * Free-form 2-material fusion logic ("Unir Materiales"):
 * Allows combining any two materials from storage into a synthesized higher-tier resource.
 */
export function fuseTwoMaterials(
  matA: MaterialId,
  matB: MaterialId
): { outputMaterialId: MaterialId; outputCount: number; bonusPoints: number; message: string } {
  const pair = [matA, matB].sort().join('+');

  if (pair === 'stone+wood' || pair === 'dirt+wood') {
    return {
      outputMaterialId: 'neon_cyan',
      outputCount: 2,
      bonusPoints: 40,
      message: '¡Fusión Exitosa! Sintetizaste 2x Neón Cian de Victoria',
    };
  }
  if (pair.includes('glitch_essence') && (pair.includes('stone') || pair.includes('dirt'))) {
    return {
      outputMaterialId: 'neon_magenta',
      outputCount: 2,
      bonusPoints: 50,
      message: '¡Fusión Exitosa! Creaste 2x Magma Magenta',
    };
  }
  if (pair.includes('quantum_wool') && pair.includes('neon_cyan')) {
    return {
      outputMaterialId: 'jump_pad',
      outputCount: 1,
      bonusPoints: 75,
      message: '¡Fusión Exitosa! Ensamblaste 1x Plataforma de Salto',
    };
  }
  if (pair.includes('dark_alloy') || pair.includes('plasma_cell')) {
    return {
      outputMaterialId: 'quantum_tech',
      outputCount: 2,
      bonusPoints: 80,
      message: '¡Fusión Avanzada! Forjaste 2x Núcleo Cuántico',
    };
  }
  if (pair.includes('neon_cyan') || pair.includes('neon_magenta')) {
    return {
      outputMaterialId: 'crystal_gold',
      outputCount: 2,
      bonusPoints: 65,
      message: '¡Fusión Cristalina! Obtuviste 2x Cristal de Creación Dorado',
    };
  }
  if (pair.includes('quantum_wool') || pair.includes('cyber_leather') || pair.includes('photon_feather')) {
    return {
      outputMaterialId: 'light_block',
      outputCount: 2,
      bonusPoints: 55,
      message: '¡Fusión Bio-Lumínica! Creaste 2x Faro de Victoria',
    };
  }

  return {
    outputMaterialId: 'neon_cyan',
    outputCount: 2,
    bonusPoints: 35,
    message: '¡Transmutación Cuántica! Tus materiales se unieron en 2x Neón Cian',
  };
}
