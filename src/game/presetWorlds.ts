/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockId, VoxelWorldData, EnemyType, AnimalType, ChestRarity } from '../types/game';

// Helper to set block
function setB(blocks: Record<string, BlockId>, x: number, y: number, z: number, id: BlockId) {
  blocks[`${x},${y},${z}`] = id;
}

// Spawns definition for creatures & treasure chests on each world
export interface WorldCreatureSpawns {
  enemies: Array<{ type: EnemyType; x: number; y: number; z: number }>;
  animals: Array<{ type: AnimalType; x: number; y: number; z: number }>;
  chests: Array<{ rarity: ChestRarity; x: number; y: number; z: number; zoneLabel?: string }>;
}

export const WORLD_SPAWN_CREATURES: Record<string, WorldCreatureSpawns> = {
  isla_nexo: {
    enemies: [
      // Hostile NPCs & Monsters patrolling near the Central Citadel (Immediate action)
      { type: 'npc_raider', x: -14, y: 2, z: 24 },
      { type: 'npc_shadow_knight', x: 16, y: 2, z: 26 },
      { type: 'npc_corrupted_hacker', x: 0, y: 2, z: 34 },
      { type: 'npc_raider', x: -24, y: 2, z: -18 },
      { type: 'npc_shadow_knight', x: 26, y: 2, z: -20 },
      { type: 'glitch_corruptor', x: -18, y: 3, z: 38 },
      { type: 'cyber_spider', x: 20, y: 2, z: 36 },
      { type: 'void_golem', x: 0, y: 3, z: 52 },
      // Expanded Continent: Southeast & Southwest Combat Grounds (dist 55..140)
      { type: 'npc_raider', x: 45, y: 2, z: 45 },
      { type: 'npc_shadow_knight', x: 55, y: 2, z: 60 },
      { type: 'npc_corrupted_hacker', x: 75, y: 2, z: 50 },
      { type: 'void_golem', x: 65, y: 3, z: 80 },
      { type: 'glitch_corruptor', x: 90, y: 3, z: 70 },
      { type: 'cyber_spider', x: 50, y: 2, z: 95 },
      { type: 'npc_raider', x: -45, y: 2, z: 48 },
      { type: 'npc_shadow_knight', x: -62, y: 2, z: 65 },
      { type: 'npc_corrupted_hacker', x: -80, y: 2, z: 55 },
      { type: 'void_golem', x: -70, y: 3, z: 85 },
      { type: 'data_specter', x: -55, y: 6, z: 95 },
      { type: 'cyber_spider', x: -90, y: 2, z: 75 },
      // Outer Ring Patrols (East / West / North Outskirts, dist 65..135)
      { type: 'npc_raider', x: 85, y: 2, z: -30 },
      { type: 'npc_shadow_knight', x: 105, y: 2, z: 15 },
      { type: 'npc_corrupted_hacker', x: -95, y: 2, z: -25 },
      { type: 'glitch_corruptor', x: -110, y: 3, z: 20 },
      { type: 'cyber_spider', x: 40, y: 2, z: -85 },
      { type: 'npc_raider', x: -40, y: 2, z: -90 },
      // Corrupted South Sector (Ruinas Titánicas del Cataclismo, z ~ 270)
      { type: 'npc_shadow_knight', x: -12, y: 3, z: 240 },
      { type: 'npc_raider', x: 14, y: 3, z: 245 },
      { type: 'glitch_corruptor', x: 0, y: 3, z: 235 },
      { type: 'glitch_corruptor', x: -25, y: 3, z: 260 },
      { type: 'glitch_corruptor', x: 25, y: 3, z: 275 },
      { type: 'glitch_corruptor', x: -35, y: 3, z: 290 },
      { type: 'void_golem', x: 0, y: 3, z: 275 },
      { type: 'void_golem', x: 30, y: 3, z: 255 },
      { type: 'void_golem', x: -20, y: 3, z: 305 },
      { type: 'cyber_spider', x: -40, y: 2, z: 250 },
      { type: 'cyber_spider', x: 35, y: 2, z: 295 },
      { type: 'cyber_spider', x: 0, y: 2, z: 315 },
      { type: 'data_specter', x: -15, y: 8, z: 270 },
      { type: 'data_specter', x: 15, y: 8, z: 285 },
      // East Bastion Guard (x ~ 270)
      { type: 'npc_corrupted_hacker', x: 245, y: 6, z: 10 },
      { type: 'glitch_corruptor', x: 250, y: 6, z: 0 },
      { type: 'void_golem', x: 275, y: 6, z: 20 },
      { type: 'cyber_spider', x: 260, y: 6, z: -25 },
    ],
    animals: [
      // Central Citadel Pasture (Harvestable animals right near spawn)
      { type: 'quantum_sheep', x: -10, y: 2, z: 6 },
      { type: 'quantum_sheep', x: -16, y: 2, z: -8 },
      { type: 'neon_pig', x: 12, y: 2, z: 4 },
      { type: 'neon_pig', x: 18, y: 2, z: -10 },
      { type: 'cyber_dog', x: 8, y: 2, z: 12 },
      { type: 'quantum_sheep', x: 0, y: 2, z: -18 },
      { type: 'holo_bird', x: -8, y: 2, z: -14 },
      // Expanded Continent: Northwest & Northeast Pastures & Woods (dist 35..135)
      { type: 'quantum_sheep', x: -35, y: 2, z: -35 },
      { type: 'quantum_sheep', x: -55, y: 2, z: -45 },
      { type: 'neon_pig', x: -45, y: 2, z: -65 },
      { type: 'cyber_dog', x: -70, y: 2, z: -50 },
      { type: 'holo_bird', x: -60, y: 2, z: -80 },
      { type: 'quantum_sheep', x: 35, y: 2, z: -35 },
      { type: 'neon_pig', x: 52, y: 2, z: -48 },
      { type: 'quantum_sheep', x: 68, y: 2, z: -62 },
      { type: 'cyber_dog', x: 45, y: 2, z: -75 },
      { type: 'holo_bird', x: 75, y: 2, z: -40 },
      { type: 'neon_pig', x: 0, y: 2, z: -60 },
      { type: 'quantum_sheep', x: -20, y: 2, z: -95 },
      { type: 'neon_pig', x: 22, y: 2, z: -105 },
      { type: 'cyber_dog', x: -65, y: 2, z: 10 },
      { type: 'quantum_sheep', x: 65, y: 2, z: -10 },
      // Peaceful North Sector (Gran Bosque Cuántico Titánico, z ~ -270)
      { type: 'quantum_sheep', x: -20, y: 2, z: -250 },
      { type: 'quantum_sheep', x: 20, y: 2, z: -260 },
      { type: 'quantum_sheep', x: -35, y: 2, z: -280 },
      { type: 'quantum_sheep', x: 30, y: 2, z: -295 },
      { type: 'cyber_dog', x: 0, y: 2, z: -245 },
      { type: 'cyber_dog', x: 25, y: 2, z: -270 },
      { type: 'cyber_dog', x: -15, y: 2, z: -305 },
      { type: 'neon_pig', x: -25, y: 2, z: -255 },
      { type: 'neon_pig', x: 15, y: 2, z: -285 },
      { type: 'neon_pig', x: -10, y: 2, z: -315 },
      { type: 'neon_pig', x: 35, y: 2, z: -265 },
      // West Valley Animals (x ~ -270)
      { type: 'cyber_dog', x: -250, y: 2, z: 10 },
      { type: 'quantum_sheep', x: -275, y: 2, z: -15 },
      { type: 'neon_pig', x: -260, y: 2, z: 25 },
    ],
    chests: [
      // Plaza Central & Torre de Victoria (Visibles al iniciar)
      { rarity: 'comun', x: 7, y: 1, z: 14, zoneLabel: 'Plaza Central' },
      { rarity: 'raro', x: -10, y: 1, z: 5, zoneLabel: 'Nexo de Victoria' },
      { rarity: 'comun', x: 16, y: 1, z: -12, zoneLabel: 'Jardín Este' },
      { rarity: 'legendario', x: 0, y: 13, z: 6, zoneLabel: 'Terraza de la Ciudadela' },
      // Praderas y Bosques del Continente Central (Noroeste y Noreste)
      { rarity: 'comun', x: -36, y: 1, z: -30, zoneLabel: 'Arboleda Noroeste' },
      { rarity: 'comun', x: 36, y: 1, z: -30, zoneLabel: 'Arboleda Noreste' },
      { rarity: 'raro', x: -64, y: 1, z: -52, zoneLabel: 'Pradera Cuántica Oeste' },
      { rarity: 'raro', x: 64, y: 1, z: -52, zoneLabel: 'Pradera Cuántica Este' },
      { rarity: 'raro', x: 0, y: 1, z: -86, zoneLabel: 'Sendero del Norte' },
      { rarity: 'legendario', x: 0, y: 1, z: -132, zoneLabel: 'Mirador Boreal' },
      // Puestos de Avanzada y Zona de Combate Sur / Este / Oeste
      { rarity: 'raro', x: -48, y: 2, z: 53, zoneLabel: 'Fortín Suroeste' },
      { rarity: 'raro', x: 48, y: 2, z: 53, zoneLabel: 'Fortín Sureste' },
      { rarity: 'comun', x: -78, y: 1, z: 66, zoneLabel: ' Veta Volcánica Oeste' },
      { rarity: 'comun', x: 78, y: 1, z: 66, zoneLabel: 'Veta Volcánica Este' },
      { rarity: 'legendario', x: 0, y: 2, z: 93, zoneLabel: 'Altar de Batalla Sur' },
      { rarity: 'raro', x: 98, y: 1, z: 8, zoneLabel: 'Frontera Este' },
      { rarity: 'raro', x: -98, y: 1, z: 8, zoneLabel: 'Frontera Oeste' },
      // Gran Bosque Cuántico del Norte (z ~ -270)
      { rarity: 'comun', x: 0, y: 1, z: -236, zoneLabel: 'Entrada Bosque Norte' },
      { rarity: 'raro', x: -28, y: 1, z: -272, zoneLabel: 'Claro Holográfico' },
      { rarity: 'legendario', x: 26, y: 1, z: -292, zoneLabel: 'Santuario del Bosque' },
      // Ruinas Titánicas del Cataclismo al Sur (z ~ 270)
      { rarity: 'raro', x: -18, y: 2, z: 246, zoneLabel: 'Ruinas Exteriores' },
      { rarity: 'raro', x: 20, y: 2, z: 268, zoneLabel: 'Cráter Glitch' },
      { rarity: 'legendario', x: 0, y: 2, z: 292, zoneLabel: 'Núcleo del Cataclismo' },
      // Bastión Imperial del Este (x ~ 270)
      { rarity: 'raro', x: 242, y: 6, z: 14, zoneLabel: 'Muralla Imperial' },
      { rarity: 'legendario', x: 276, y: 6, z: 0, zoneLabel: 'Trono del Bastión Este' },
      // Valle del Mar de Cristales al Oeste (x ~ -270)
      { rarity: 'comun', x: -238, y: 1, z: 16, zoneLabel: 'Costa de Datos' },
      { rarity: 'raro', x: -296, y: 1, z: -26, zoneLabel: 'Agujas de Cristal' },
      { rarity: 'legendario', x: -270, y: 1, z: 42, zoneLabel: 'Tesoro del Mar Oeste' },
    ],
  },
  ciudad_neon: {
    enemies: [
      { type: 'npc_raider', x: 18, y: 2, z: 22 },
      { type: 'npc_shadow_knight', x: -20, y: 2, z: 24 },
      { type: 'npc_corrupted_hacker', x: 0, y: 2, z: -28 },
      { type: 'glitch_corruptor', x: 80, y: 2, z: 80 },
      { type: 'glitch_corruptor', x: -80, y: 2, z: -80 },
      { type: 'cyber_spider', x: 90, y: 2, z: -70 },
      { type: 'cyber_spider', x: -90, y: 2, z: 70 },
      { type: 'void_golem', x: 0, y: 2, z: 100 },
      { type: 'void_golem', x: -100, y: 2, z: 0 },
      { type: 'data_specter', x: -70, y: 24, z: 70 },
      { type: 'data_specter', x: 70, y: 24, z: -70 },
    ],
    animals: [
      { type: 'quantum_sheep', x: -12, y: 2, z: 10 },
      { type: 'neon_pig', x: 14, y: 2, z: 12 },
      { type: 'cyber_dog', x: -25, y: 2, z: 25 },
      { type: 'cyber_dog', x: 25, y: 2, z: -25 },
      { type: 'quantum_sheep', x: 0, y: 2, z: -50 },
      { type: 'neon_pig', x: 40, y: 2, z: 40 },
    ],
    chests: [
      { rarity: 'comun', x: 8, y: 1, z: 18, zoneLabel: 'Plaza Corporativa' },
      { rarity: 'raro', x: -10, y: 1, z: 22, zoneLabel: 'Avenida Cian' },
      { rarity: 'legendario', x: 0, y: 18, z: 4, zoneLabel: 'Azotea Corporativa' },
      { rarity: 'comun', x: 48, y: 1, z: 24, zoneLabel: 'Distrito Este' },
      { rarity: 'comun', x: -48, y: 1, z: -24, zoneLabel: 'Distrito Oeste' },
      { rarity: 'raro', x: 85, y: 1, z: 85, zoneLabel: 'Torre Magenta Sur' },
      { rarity: 'raro', x: -85, y: 1, z: -85, zoneLabel: 'Torre Magenta Norte' },
      { rarity: 'legendario', x: 0, y: 1, z: -92, zoneLabel: 'Bóveda Central Norte' },
      { rarity: 'legendario', x: 0, y: 1, z: 125, zoneLabel: 'Bóveda Sur' },
    ],
  },
  oasis_flotante: {
    enemies: [
      { type: 'npc_shadow_knight', x: 16, y: 2, z: 20 },
      { type: 'npc_raider', x: -18, y: 2, z: 22 },
      { type: 'glitch_corruptor', x: 95, y: 2, z: 0 },
      { type: 'data_specter', x: -85, y: 12, z: -80 },
      { type: 'cyber_spider', x: 75, y: 2, z: -85 },
      { type: 'void_golem', x: 0, y: 2, z: 105 },
    ],
    animals: [
      { type: 'quantum_sheep', x: -10, y: 2, z: 12 },
      { type: 'neon_pig', x: 12, y: 2, z: 10 },
      { type: 'quantum_sheep', x: -40, y: 2, z: 35 },
      { type: 'quantum_sheep', x: -60, y: 2, z: 45 },
      { type: 'neon_pig', x: 45, y: 2, z: 55 },
      { type: 'neon_pig', x: 65, y: 2, z: 40 },
      { type: 'cyber_dog', x: 0, y: 2, z: 65 },
      { type: 'cyber_dog', x: -30, y: 2, z: -55 },
    ],
    chests: [
      { rarity: 'comun', x: 8, y: 1, z: 48, zoneLabel: 'Orilla del Oasis' },
      { rarity: 'raro', x: -12, y: 1, z: 42, zoneLabel: 'Muelle de Datos' },
      { rarity: 'legendario', x: 0, y: 23, z: 6, zoneLabel: 'Santuario en las Nubes' },
      { rarity: 'comun', x: 52, y: 1, z: 0, zoneLabel: 'Atolón Este' },
      { rarity: 'comun', x: -52, y: 1, z: 0, zoneLabel: 'Atolón Oeste' },
      { rarity: 'raro', x: 68, y: 1, z: -68, zoneLabel: 'Laguna Noreste' },
      { rarity: 'raro', x: -68, y: 1, z: 68, zoneLabel: 'Laguna Suroeste' },
      { rarity: 'legendario', x: 0, y: 1, z: -95, zoneLabel: 'Reliquia del Arrecife' },
    ],
  },
  vacio_creativo: {
    enemies: [
      { type: 'npc_raider', x: -12, y: 2, z: 18 },
      { type: 'npc_shadow_knight', x: 12, y: 2, z: 18 },
    ],
    animals: [
      { type: 'cyber_dog', x: 6, y: 2, z: 6 },
      { type: 'quantum_sheep', x: -8, y: 2, z: 8 },
      { type: 'neon_pig', x: 8, y: 2, z: -8 },
    ],
    chests: [
      { rarity: 'comun', x: 6, y: 1, z: 10, zoneLabel: 'Taller Central' },
      { rarity: 'raro', x: -10, y: 1, z: -10, zoneLabel: 'Esquina Noroeste' },
      { rarity: 'raro', x: 25, y: 1, z: 25, zoneLabel: 'Plataforma Sur' },
      { rarity: 'legendario', x: 0, y: 1, z: -32, zoneLabel: 'Cofre del Arquitecto' },
    ],
  },
};

// Generate 1000% Titantic Isla Nexo Archipelago
export function createIslaNexo(): VoxelWorldData {
  const blocks: Record<string, BlockId> = {};
  const scripts: VoxelWorldData['scripts'] = {};

  // ========================================================
  // 1. CENTRAL CONTINENT & CITADEL (Continente Central Expandido, Radius 148)
  // ========================================================
  const R_center = 148;
  for (let x = -R_center; x <= R_center; x += 2) {
    for (let z = -R_center; z <= R_center; z += 2) {
      const dist = Math.hypot(x, z);
      if (dist <= R_center) {
        // Island underside taper
        const depth = Math.floor((1 - dist / R_center) * 8) + 2;
        for (let y = -depth; y < 0; y += 2) {
          const underBlock: BlockId = dist > 110 ? 'void_rock' : 'dirt';
          setB(blocks, x, y, z, underBlock);
          setB(blocks, x + 1, y, z, underBlock);
          setB(blocks, x, y, z + 1, underBlock);
          setB(blocks, x + 1, y, z + 1, underBlock);
        }

        // Concentric geometric cyber patterns & outer biome zones
        let blockType: BlockId = 'grass';
        if (Math.abs(dist - 16) < 2.5) {
          blockType = 'neon_cyan';
        } else if (Math.abs(dist - 34) < 2.5) {
          blockType = 'quantum_tech';
        } else if (Math.abs(dist - 52) < 2.5) {
          blockType = 'neon_magenta';
        } else if (Math.abs(dist - 68) < 2.5) {
          blockType = 'crystal_gold';
        } else if (Math.abs(dist - 105) < 2.5) {
          blockType = 'neon_cyan';
        } else if (dist <= 8) {
          blockType = 'crystal_gold';
        } else if (dist > 72 && z > 20) {
          // Southern half of outer continent: Battleground & volcanic stone/glitch veins
          const isVein = Math.abs(Math.sin(x * 0.1) + Math.cos(z * 0.1)) < 0.22;
          blockType = isVein ? 'neon_magenta' : (x + z) % 8 === 0 ? 'void_rock' : 'stone';
        } else if (dist > 136) {
          blockType = 'stone';
        }

        setB(blocks, x, 0, z, blockType);
        setB(blocks, x + 1, 0, z, blockType);
        setB(blocks, x, 0, z + 1, blockType);
        setB(blocks, x + 1, 0, z + 1, blockType);
      }
    }
  }

  // Add Mineable Trees, Crystal Ore Boulders, and NPC Outposts across the Expanded Continent (dist 40..135)
  const mainlandTrees = [
    [-38, -32], [38, -32], [-58, -42], [58, -42], [-45, -72], [45, -72],
    [-82, -45], [82, -45], [-70, -80], [70, -80], [-25, -95], [25, -95],
    [-95, -15], [95, -15], [-60, 15], [60, 15],
  ];
  for (const [tx, tz] of mainlandTrees) {
    const th = 5 + (Math.abs(tx + tz) % 3);
    for (let ty = 1; ty <= th; ty++) {
      setB(blocks, tx, ty, tz, 'wood');
    }
    for (let ox = -2; ox <= 2; ox++) {
      for (let oz = -2; oz <= 2; oz++) {
        for (let oy = th - 1; oy <= th + 2; oy++) {
          if (Math.abs(ox) + Math.abs(oz) < 4) {
            setB(blocks, tx + ox, oy, tz + oz, 'leaves');
          }
        }
      }
    }
  }

  // Mineable Mineral Boulders & NPC Watchtowers in Southern/Eastern/Western Combat Zones
  const combatOutposts = [
    [-50, 55], [50, 55], [-75, 70], [75, 70], [0, 95], [-40, 105], [40, 105],
  ];
  for (const [ox, oz] of combatOutposts) {
    for (let bx = -2; bx <= 2; bx++) {
      for (let bz = -2; bz <= 2; bz++) {
        setB(blocks, ox + bx, 1, oz + bz, 'stone');
      }
    }
    for (let y = 1; y <= 6; y++) {
      setB(blocks, ox, y, oz, y % 2 === 0 ? 'void_rock' : 'stone');
    }
    setB(blocks, ox, 7, oz, 'crystal_gold');
    setB(blocks, ox + 1, 2, oz, 'crystal_gold');
    setB(blocks, ox - 1, 2, oz, 'neon_cyan');
  }

  // Victoria's Great Skyscraper Restoration Citadel (y=1 to y=40)
  for (let y = 1; y <= 36; y++) {
    // 4 Corner Pillars
    for (let cx = -3; cx <= 3; cx += 6) {
      for (let cz = -3; cz <= 3; cz += 6) {
        setB(blocks, cx, y, cz, y % 4 === 0 ? 'neon_cyan' : 'stone');
      }
    }
    // Central Quantum Core
    setB(blocks, 0, y, 0, 'quantum_tech');
    setB(blocks, 1, y, 0, 'quantum_tech');
    setB(blocks, -1, y, 0, 'quantum_tech');
    setB(blocks, 0, y, 1, 'quantum_tech');
    setB(blocks, 0, y, -1, 'quantum_tech');

    // Sky terraces at y=12, y=24
    if (y === 12 || y === 24) {
      for (let bx = -6; bx <= 6; bx++) {
        for (let bz = -6; bz <= 6; bz++) {
          if (Math.abs(bx) === 6 || Math.abs(bz) === 6) {
            setB(blocks, bx, y, bz, 'neon_magenta');
          }
        }
      }
    }
  }
  // Citadel Apex Beacon
  for (let y = 37; y <= 40; y++) {
    setB(blocks, 0, y, 0, 'crystal_gold');
  }
  setB(blocks, 0, 41, 0, 'neon_cyan');
  setB(blocks, 0, 42, 0, 'light_block');

  // Launch pads around the monument
  setB(blocks, 12, 1, 0, 'jump_pad');
  scripts['12,1,0'] = {
    blockCoord: '12,1,0',
    name: 'Trampolín Torre Titánica',
    trigger: 'on_step',
    action: 'bounce_player',
    paramNumber: 36,
    paramText: '¡Impulso hacia el Mirador de las Estrellas!',
  };

  setB(blocks, -12, 1, 0, 'jump_pad');
  scripts['-12,1,0'] = {
    blockCoord: '-12,1,0',
    name: 'Super Salto Central',
    trigger: 'on_step',
    action: 'bounce_player',
    paramNumber: 38,
    paramText: '¡Ascenso hacia la Terraza Superior!',
  };

  // High Celestial Dome
  for (let x = -8; x <= 8; x++) {
    for (let z = -25; z <= -15; z++) {
      setB(blocks, x, 32, z, 'neon_cyan');
      setB(blocks, x, 31, z, 'void_rock');
    }
  }
  setB(blocks, 0, 33, -20, 'crystal_gold');
  scripts['0,33,-20'] = {
    blockCoord: '0,33,-20',
    name: 'Fragmento Primordial Supremo',
    trigger: 'on_interact',
    action: 'give_points',
    paramNumber: 2500,
    paramText: '¡Has reclamado el Fragmento Cósmico de Victoria! +2500 Puntos Toro',
  };

  // 4 Grand Teleport Gates at the 4 Cardinal Exits of the Citadel
  // North Gate -> Transports directly to North Sector (0, 2, -240)
  setB(blocks, 0, 1, -72, 'teleport_pad');
  scripts['0,1,-72'] = {
    blockCoord: '0,1,-72',
    name: 'Portal Puerta Norte (Gran Bosque)',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Teletransportado al Gran Bosque Cuántico Titánico!',
  };

  // South Gate -> Transports directly to South Sector (0, 2, +240)
  setB(blocks, 0, 1, 72, 'teleport_pad');
  scripts['0,1,72'] = {
    blockCoord: '0,1,72',
    name: 'Portal Puerta Sur (Ruinas Corruptas)',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Teletransportado a las Ruinas del Cataclismo!',
  };

  // East Gate -> Transports directly to East Sector (+240, 4, 0)
  setB(blocks, 72, 1, 0, 'teleport_pad');
  scripts['72,1,0'] = {
    blockCoord: '72,1,0',
    name: 'Portal Puerta Este (Bastión Imperial)',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Teletransportado al Bastión Imperial del Creador!',
  };

  // West Gate -> Transports directly to West Sector (-240, 2, 0)
  setB(blocks, -72, 1, 0, 'teleport_pad');
  scripts['-72,1,0'] = {
    blockCoord: '-72,1,0',
    name: 'Portal Puerta Oeste (Mar de Cristales)',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Teletransportado al Mar de Cristales y Aguas de Datos!',
  };

  // ========================================================
  // 2. NORTH SECTOR: EL GRAN BOSQUE CUÁNTICO TITÁNICO
  // ========================================================
  // Solid 11-block wide Skyway Highway from z = -146 to z = -205
  for (let z = -146; z >= -205; z--) {
    for (let x = -5; x <= 5; x++) {
      setB(blocks, x, 0, z, 'wood');
      setB(blocks, x, -1, z, 'stone');
    }
    // High-speed boost jump pads every 30 blocks
    if (z % 30 === 0) {
      setB(blocks, 0, 1, z, 'jump_pad');
      scripts[`0,1,${z}`] = {
        blockCoord: `0,1,${z}`,
        name: 'Acelerador de Autopista Norte',
        trigger: 'on_step',
        action: 'bounce_player',
        paramNumber: 28,
        paramText: '¡Súper impulso hacia el Bosque Norte!',
      };
      setB(blocks, -5, 1, z, 'light_block');
      setB(blocks, 5, 1, z, 'light_block');
    }
  }

  // Giant North Island Continent: Center at (0, 0, -270), Radius 65 (Spans z = -205 to -335)
  const cNz = -270;
  const R_north = 65;
  for (let x = -R_north; x <= R_north; x += 2) {
    for (let dz = -R_north; dz <= R_north; dz += 2) {
      const z = cNz + dz;
      const dist = Math.hypot(x, dz);
      if (dist <= R_north) {
        const depth = Math.floor((1 - dist / R_north) * 7) + 2;
        for (let y = -depth; y < 0; y += 2) {
          setB(blocks, x, y, z, 'dirt');
          setB(blocks, x + 1, y, z, 'dirt');
          setB(blocks, x, y, z + 1, 'dirt');
          setB(blocks, x + 1, y, z + 1, 'dirt');
        }

        // Winding data river through forest
        const isRiver = Math.abs(x - Math.sin(dz * 0.1) * 12) < 3.5;
        const bType = isRiver ? 'data_water' : 'grass';

        setB(blocks, x, 0, z, bType);
        setB(blocks, x + 1, 0, z, bType);
        setB(blocks, x, 0, z + 1, bType);
        setB(blocks, x + 1, 0, z + 1, bType);
      }
    }
  }

  // 18 Grand Quantum Trees scattered across North Forest
  const northTrees = [
    [0, cNz - 35],
    [-25, cNz - 25],
    [25, cNz - 25],
    [-40, cNz],
    [40, cNz],
    [-20, cNz + 30],
    [20, cNz + 30],
    [-35, cNz - 45],
    [35, cNz - 45],
    [0, cNz + 45],
    [-15, cNz - 15],
    [15, cNz - 15],
    [-45, cNz + 20],
    [45, cNz + 20],
    [0, cNz],
    [-30, cNz + 40],
    [30, cNz + 40],
    [0, cNz - 50],
  ];
  for (const [tx, tz] of northTrees) {
    const treeHeight = 7 + (Math.abs(tx + tz) % 4);
    for (let ty = 1; ty <= treeHeight; ty++) {
      setB(blocks, tx, ty, tz, 'wood');
      setB(blocks, tx + 1, ty, tz, 'wood');
    }
    for (let ox = -3; ox <= 3; ox++) {
      for (let oz = -3; oz <= 3; oz++) {
        for (let oy = treeHeight - 1; oy <= treeHeight + 3; oy++) {
          if (Math.abs(ox) + Math.abs(oz) < 5) {
            setB(blocks, tx + ox, oy, tz + oz, 'leaves');
          }
        }
      }
    }
    setB(blocks, tx, treeHeight + 4, tz, 'crystal_gold');
  }

  // North Sector Return Teleport back to Citadel
  setB(blocks, 0, 1, cNz + 55, 'teleport_pad');
  scripts[`0,1,${cNz + 55}`] = {
    blockCoord: `0,1,${cNz + 55}`,
    name: 'Portal de Retorno a la Ciudadela',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Regreso instantáneo a la Plaza Central!',
  };

  // North Forest Treasure Shrine
  setB(blocks, 0, 1, cNz - 45, 'crystal_gold');
  scripts[`0,1,${cNz - 45}`] = {
    blockCoord: `0,1,${cNz - 45}`,
    name: 'Altar del Gran Bosque Cuántico',
    trigger: 'on_interact',
    action: 'give_points',
    paramNumber: 2000,
    paramText: '¡Has purificado el Corazón del Bosque Cuántico! +2000 Puntos Toro',
  };

  // ========================================================
  // 3. SOUTH SECTOR: LAS RUINAS TITÁNICAS DEL CATACLISMO
  // ========================================================
  // Solid 11-block wide void stone highway from z = +146 to z = +205
  for (let z = 146; z <= 205; z++) {
    for (let x = -5; x <= 5; x++) {
      setB(blocks, x, 0, z, 'void_rock');
      setB(blocks, x, -1, z, 'stone');
    }
    if (z % 30 === 0) {
      setB(blocks, 0, 1, z, 'jump_pad');
      scripts[`0,1,${z}`] = {
        blockCoord: `0,1,${z}`,
        name: 'Acelerador de Autopista Sur',
        trigger: 'on_step',
        action: 'bounce_player',
        paramNumber: 28,
        paramText: '¡Súper impulso hacia las Ruinas Corruptas!',
      };
      setB(blocks, -5, 1, z, 'neon_magenta');
      setB(blocks, 5, 1, z, 'neon_magenta');
    }
  }

  // Giant South Island Continent: Center at (0, 0, +270), Radius 65 (Spans z = +205 to +335)
  const cSz = 270;
  const R_south = 65;
  for (let x = -R_south; x <= R_south; x += 2) {
    for (let dz = -R_south; dz <= R_south; dz += 2) {
      const z = cSz + dz;
      const dist = Math.hypot(x, dz);
      if (dist <= R_south) {
        const depth = Math.floor((1 - dist / R_south) * 8) + 2;
        for (let y = -depth; y < 0; y += 2) {
          setB(blocks, x, y, z, 'void_rock');
          setB(blocks, x + 1, y, z, 'void_rock');
          setB(blocks, x, y, z + 1, 'void_rock');
          setB(blocks, x + 1, y, z + 1, 'void_rock');
        }

        const isGlitchVein = Math.abs(Math.sin(x * 0.12) + Math.cos(dz * 0.12)) < 0.25;
        const bType = isGlitchVein ? 'neon_magenta' : 'void_rock';

        setB(blocks, x, 0, z, bType);
        setB(blocks, x + 1, 0, z, bType);
        setB(blocks, x, 0, z + 1, bType);
        setB(blocks, x + 1, 0, z + 1, bType);
      }
    }
  }

  // 14 Massive Jagged Monoliths in South Sector
  const southMonoliths = [
    [0, cSz],
    [-25, cSz - 30],
    [25, cSz - 30],
    [-35, cSz + 15],
    [35, cSz + 15],
    [-15, cSz + 40],
    [15, cSz + 40],
    [0, cSz + 48],
    [-45, cSz - 10],
    [45, cSz - 10],
    [-10, cSz - 45],
    [10, cSz - 45],
    [-40, cSz + 35],
    [40, cSz + 35],
  ];
  southMonoliths.forEach(([mx, mz], idx) => {
    const h = 8 + (idx % 5) * 3;
    for (let y = 1; y <= h; y++) {
      setB(blocks, mx, y, mz, 'void_rock');
      setB(blocks, mx + 1, y, mz, 'void_rock');
      if (y % 3 === 0) setB(blocks, mx, y, mz + 1, 'neon_magenta');
    }
    setB(blocks, mx, h + 1, mz, 'neon_magenta');
  });

  // South Sector Vault Chest (High reward for defeating monsters)
  setB(blocks, 0, 1, cSz + 35, 'crystal_gold');
  scripts[`0,1,${cSz + 35}`] = {
    blockCoord: `0,1,${cSz + 35}`,
    name: 'Cofre Supremo del Cataclismo',
    trigger: 'on_interact',
    action: 'give_points',
    paramNumber: 3000,
    paramText: '¡Has conquistado el Abismo y purificado las Ruinas del Cataclismo! +3000 Puntos Toro',
  };

  // South Return Teleport
  setB(blocks, 0, 1, cSz - 55, 'teleport_pad');
  scripts[`0,1,${cSz - 55}`] = {
    blockCoord: `0,1,${cSz - 55}`,
    name: 'Portal Retorno Sur a la Ciudadela',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Regreso instantáneo a la Plaza Central!',
  };

  // ========================================================
  // 4. EAST SECTOR: EL BASTIÓN AÉREO IMPERIAL
  // ========================================================
  // Solid 11-block wide Skyway highway from x = +146 to x = +210
  for (let x = 146; x <= 210; x++) {
    for (let z = -5; z <= 5; z++) {
      setB(blocks, x, 2, z, 'neon_cyan');
      setB(blocks, x, 1, z, 'quantum_tech');
    }
    if (x % 30 === 0) {
      setB(blocks, x, 3, 0, 'jump_pad');
      scripts[`${x},3,0`] = {
        blockCoord: `${x},3,0`,
        name: 'Acelerador de Autopista Este',
        trigger: 'on_step',
        action: 'bounce_player',
        paramNumber: 28,
        paramText: '¡Súper impulso hacia el Bastión Este!',
      };
    }
  }

  // Giant East Island Citadel: Center at (+270, 4, 0), Radius 60
  const cEx = 270;
  const R_east = 60;
  for (let dx = -R_east; dx <= R_east; dx += 2) {
    for (let z = -R_east; z <= R_east; z += 2) {
      const x = cEx + dx;
      const dist = Math.hypot(dx, z);
      if (dist <= R_east) {
        for (let y = -4; y <= 3; y += 2) {
          setB(blocks, x, y, z, 'stone');
          setB(blocks, x + 1, y, z, 'stone');
          setB(blocks, x, y, z + 1, 'stone');
          setB(blocks, x + 1, y, z + 1, 'stone');
        }
        const bType = (dx + z) % 6 === 0 ? 'neon_cyan' : 'quantum_tech';
        setB(blocks, x, 4, z, bType);
        setB(blocks, x + 1, 4, z, bType);
        setB(blocks, x, 4, z + 1, bType);
        setB(blocks, x + 1, 4, z + 1, bType);
      }
    }
  }

  // 8 Imperial Watchtowers
  const eastTowers = [
    [cEx - 30, -30],
    [cEx + 30, -30],
    [cEx - 30, 30],
    [cEx + 30, 30],
    [cEx, -45],
    [cEx, 45],
    [cEx - 45, 0],
    [cEx + 45, 0],
  ];
  for (const [bx, bz] of eastTowers) {
    for (let y = 5; y <= 18; y++) {
      setB(blocks, bx, y, bz, 'stone');
      setB(blocks, bx + 1, y, bz, 'neon_cyan');
    }
    setB(blocks, bx, 19, bz, 'light_block');
  }

  // East Return Teleport
  setB(blocks, cEx - 50, 5, 0, 'teleport_pad');
  scripts[`${cEx - 50},5,0`] = {
    blockCoord: `${cEx - 50},5,0`,
    name: 'Portal Retorno Este a la Ciudadela',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Regreso instantáneo a la Plaza Central!',
  };

  // ========================================================
  // 5. WEST SECTOR: EL MAR INFINITO DE CRISTALES
  // ========================================================
  // Solid 11-block wide Bridge from x = -146 to x = -205
  for (let x = -146; x >= -205; x--) {
    for (let z = -5; z <= 5; z++) {
      setB(blocks, x, 0, z, 'wood');
      setB(blocks, x, -1, z, 'stone');
    }
    if (x % 30 === 0) {
      setB(blocks, x, 1, 0, 'jump_pad');
      scripts[`${x},1,0`] = {
        blockCoord: `${x},1,0`,
        name: 'Acelerador de Autopista Oeste',
        trigger: 'on_step',
        action: 'bounce_player',
        paramNumber: 28,
        paramText: '¡Súper impulso hacia el Mar de Cristales!',
      };
    }
  }

  // Giant West Island Continent: Center at (-270, 0, 0), Radius 65
  const cWx = -270;
  const R_west = 65;
  for (let dx = -R_west; dx <= R_west; dx += 2) {
    for (let z = -R_west; z <= R_west; z += 2) {
      const x = cWx + dx;
      const dist = Math.hypot(dx, z);
      if (dist <= R_west) {
        for (let y = -6; y < 0; y += 2) {
          setB(blocks, x, y, z, 'dirt');
          setB(blocks, x + 1, y, z, 'dirt');
          setB(blocks, x, y, z + 1, 'dirt');
          setB(blocks, x + 1, y, z + 1, 'dirt');
        }

        // Great Sea of Data Water in West Valley (Radius 25)
        const isWater = dist <= 25;
        const bType = isWater ? 'data_water' : 'grass';

        setB(blocks, x, 0, z, bType);
        setB(blocks, x + 1, 0, z, bType);
        setB(blocks, x, 0, z + 1, bType);
        setB(blocks, x + 1, 0, z + 1, bType);
      }
    }
  }

  // 12 Giant Crystal Spires in West Valley
  const westCrystals = [
    [cWx - 30, -30],
    [cWx + 30, -30],
    [cWx - 30, 30],
    [cWx + 30, 30],
    [cWx - 45, 0],
    [cWx + 45, 0],
    [cWx, -45],
    [cWx, 45],
    [cWx - 20, -10],
    [cWx + 20, 10],
    [cWx - 10, 20],
    [cWx + 10, -20],
  ];
  westCrystals.forEach(([cx, cz], idx) => {
    const h = 7 + (idx % 4) * 3;
    for (let y = 1; y <= h; y++) {
      setB(blocks, cx, y, cz, 'crystal_gold');
    }
    setB(blocks, cx, h + 1, cz, 'neon_cyan');
  });

  // West Return Teleport
  setB(blocks, cWx + 50, 1, 0, 'teleport_pad');
  scripts[`${cWx + 50},1,0`] = {
    blockCoord: `${cWx + 50},1,0`,
    name: 'Portal Retorno Oeste a la Ciudadela',
    trigger: 'on_step',
    action: 'teleport_player',
    paramNumber: 0,
    paramText: '¡Regreso instantáneo a la Plaza Central!',
  };

  return {
    id: 'isla_nexo',
    name: 'Mega Archipiélago Cósmico (1000% Extendido): Victoria Toro',
    author: 'Victoria Toro',
    description: 'El colosal universo digital de más de 800 bloques de envergadura: Ciudadela Central, Gran Bosque Cuántico, Ruinas Titánicas del Cataclismo, Bastión Imperial y Mar Infinito de Cristales.',
    theme: 'nexo',
    blocks,
    scripts,
    spawnPoint: [0, 2, 8],
    likes: 18450,
  };
}

// Generate Colossal Ciudad Neón (1000% Scale -> 320x320 blocks area)
export function createCiudadNeon(): VoxelWorldData {
  const blocks: Record<string, BlockId> = {};
  const scripts: VoxelWorldData['scripts'] = {};

  const size = 150; // from -150 to +150 (300x300 blocks!)
  for (let x = -size; x <= size; x += 3) {
    for (let z = -size; z <= size; z += 3) {
      const isAvenue = x % 24 === 0 || z % 24 === 0;
      const bType: BlockId = isAvenue ? 'neon_cyan' : 'void_rock';

      for (let ox = 0; ox < 3; ox++) {
        for (let oz = 0; oz < 3; oz++) {
          setB(blocks, x + ox, 0, z + oz, bType);
        }
      }
    }
  }

  // 12 Skyscraper Complexes
  const skyscrapers = [
    { x: -100, z: -100, w: 20, h: 35, accent: 'neon_magenta' as BlockId },
    { x: 100, z: -100, w: 20, h: 32, accent: 'neon_cyan' as BlockId },
    { x: -100, z: 100, w: 20, h: 30, accent: 'crystal_gold' as BlockId },
    { x: 100, z: 100, w: 20, h: 36, accent: 'neon_magenta' as BlockId },
    { x: 0, z: -110, w: 25, h: 42, accent: 'quantum_tech' as BlockId },
    { x: 0, z: 110, w: 25, h: 28, accent: 'neon_cyan' as BlockId },
    { x: -110, z: 0, w: 22, h: 34, accent: 'neon_magenta' as BlockId },
    { x: 110, z: 0, w: 22, h: 38, accent: 'crystal_gold' as BlockId },
  ];

  skyscrapers.forEach(({ x, z, w, h, accent }) => {
    const hw = Math.floor(w / 2);
    for (let bx = x - hw; bx <= x + hw; bx++) {
      for (let bz = z - hw; bz <= z + hw; bz++) {
        for (let y = 1; y <= h; y++) {
          if (bx === x - hw || bx === x + hw || bz === z - hw || bz === z + hw) {
            setB(blocks, bx, y, bz, y % 4 === 0 ? accent : 'stone');
          }
        }
        setB(blocks, bx, h + 1, bz, 'quantum_tech');
      }
    }
  });

  // Central Grand Corporate Plaza
  for (let x = -15; x <= 15; x++) {
    for (let z = -15; z <= 15; z++) {
      for (let y = 1; y <= 16; y++) {
        if (Math.abs(x) === 15 || Math.abs(z) === 15) {
          setB(blocks, x, y, z, 'quantum_tech');
        }
      }
      setB(blocks, x, 17, z, 'neon_cyan');
    }
  }
  setB(blocks, 0, 18, 0, 'light_block');

  // Super Launch pad
  setB(blocks, 0, 1, 20, 'jump_pad');
  scripts['0,1,20'] = {
    blockCoord: '0,1,20',
    name: 'Mega Impulso Metrópolis 1000%',
    trigger: 'on_step',
    action: 'bounce_player',
    paramNumber: 42,
    paramText: '¡Lanzamiento estratosférico a las nubes de la Metrópolis!',
  };

  return {
    id: 'ciudad_neon',
    name: 'Megalópolis Neón Titánica (1000% Extendida)',
    author: 'Victoria Toro & Co.',
    description: 'Colosal urbe vóxel de más de 300x300 bloques con 12 rascacielos titánicos, autopistas cibernéticas y puentes en las nubes.',
    theme: 'neon_city',
    blocks,
    scripts,
    spawnPoint: [0, 2, 10],
    likes: 19800,
  };
}

// Generate Colossal Oasis Flotante (1000% Scale -> 280+ blocks)
export function createOasisFlotante(): VoxelWorldData {
  const blocks: Record<string, BlockId> = {};
  const scripts: VoxelWorldData['scripts'] = {};

  const R = 120;
  for (let x = -R; x <= R; x += 2) {
    for (let z = -R; z <= R; z += 2) {
      const d = Math.hypot(x, z);
      if (d <= R) {
        const depth = Math.floor((1 - d / R) * 8) + 2;
        for (let y = -depth; y < 0; y += 2) {
          setB(blocks, x, y, z, 'dirt');
          setB(blocks, x + 1, y, z, 'dirt');
          setB(blocks, x, y, z + 1, 'dirt');
          setB(blocks, x + 1, y, z + 1, 'dirt');
        }

        // Great inner sea
        const isWater = d <= 35;
        const bType = isWater ? 'data_water' : 'grass';

        setB(blocks, x, 0, z, bType);
        setB(blocks, x + 1, 0, z, bType);
        setB(blocks, x, 0, z + 1, bType);
        setB(blocks, x + 1, 0, z + 1, bType);
      }
    }
  }

  // Sky Temple
  for (let x = -12; x <= 12; x++) {
    for (let z = -12; z <= 12; z++) {
      setB(blocks, x, 22, z, 'crystal_gold');
      if (Math.abs(x) === 12 || Math.abs(z) === 12) {
        setB(blocks, x, 23, z, 'quantum_tech');
      }
    }
  }
  setB(blocks, 0, 24, 0, 'light_block');
  scripts['0,24,0'] = {
    blockCoord: '0,24,0',
    name: 'Santuario Supremo del Paraíso',
    trigger: 'on_step',
    action: 'give_points',
    paramNumber: 3500,
    paramText: '¡Has alcanzado la Cima del Paraíso Celestial! +3500 Puntos Toro',
  };

  // Jump pad to sky temple
  setB(blocks, 0, 1, 38, 'jump_pad');
  scripts['0,1,38'] = {
    blockCoord: '0,1,38',
    name: 'Trampolín del Paraíso',
    trigger: 'on_step',
    action: 'bounce_player',
    paramNumber: 38,
    paramText: '¡Impulso hacia el Santuario en las Nubes!',
  };

  return {
    id: 'oasis_flotante',
    name: 'Paraíso Oasis Cósmico (1000% Extendido)',
    author: 'Comunidad Creativa',
    description: 'Archipiélago colosal de más de 250 bloques con inmensos mares de datos, atolones y santuario celestial.',
    theme: 'oasis',
    blocks,
    scripts,
    spawnPoint: [0, 2, 45],
    likes: 14500,
  };
}

// Generate Blank Sandbox / El Vacío (1000% Scale -> 80x80 platform)
export function createVacioCreativo(): VoxelWorldData {
  const blocks: Record<string, BlockId> = {};
  const scripts: VoxelWorldData['scripts'] = {};

  const size = 45; // 91x91 platform
  for (let x = -size; x <= size; x++) {
    for (let z = -size; z <= size; z++) {
      setB(blocks, x, 0, z, (x + z) % 2 === 0 ? 'neon_cyan' : 'void_rock');
    }
  }

  return {
    id: 'vacio_creativo',
    name: 'El Vacío Creativo: Tu Lienzo Infinito (1000% Extendido)',
    author: 'Tú (Arquitecto Digital)',
    description: 'Un espacio colosal de más de 90x90 bloques en blanco para construir libremente tu propia isla colaborativa.',
    theme: 'vacio',
    blocks,
    scripts,
    spawnPoint: [0, 2, 0],
    likes: 640,
  };
}

export const PRESET_WORLDS: Record<string, () => VoxelWorldData> = {
  isla_nexo: createIslaNexo,
  ciudad_neon: createCiudadNeon,
  oasis_flotante: createOasisFlotante,
  vacio_creativo: createVacioCreativo,
};
