/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlockId =
  | 'air'
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'wood'
  | 'leaves'
  | 'neon_cyan'
  | 'neon_magenta'
  | 'crystal_gold'
  | 'quantum_tech'
  | 'data_water'
  | 'void_rock'
  | 'jump_pad'
  | 'teleport_pad'
  | 'light_block';

export interface BlockDefinition {
  id: BlockId;
  name: string;
  color: string;
  emissive?: string;
  roughness: number;
  metalness: number;
  transparent?: boolean;
  opacity?: number;
  isInteractive?: boolean;
  category: 'natural' | 'construccion' | 'cyber_neon' | 'mecanismo';
}

export interface VoxelPosition {
  x: number;
  y: number;
  z: number;
}

export interface VoxelWorldData {
  id: string;
  name: string;
  author: string;
  description: string;
  theme: 'nexo' | 'neon_city' | 'oasis' | 'vacio';
  blocks: Record<string, BlockId>; // key: `${x},${y},${z}`
  scripts: Record<string, ScriptDefinition>; // key: `${x},${y},${z}`
  spawnPoint: [number, number, number];
  isCommunity?: boolean;
  likes: number;
}

export type ScriptTrigger = 'on_step' | 'on_interact' | 'on_break' | 'timer_pulse';
export type ScriptAction =
  | 'bounce_player'
  | 'teleport_player'
  | 'give_points'
  | 'play_sound'
  | 'chat_message'
  | 'spawn_particles';

export type WeaponId = 'sword' | 'blaster' | 'hammer' | 'bow';

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  damage: number;
  range: number;
  cooldownSeconds: number;
  description: string;
  color: string;
  icon: string;
  type: 'melee' | 'ranged';
}

export type EnemyType =
  | 'glitch_corruptor'
  | 'void_golem'
  | 'data_specter'
  | 'cyber_spider'
  | 'npc_raider'
  | 'npc_shadow_knight'
  | 'npc_corrupted_hacker';

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  hp: number;
  maxHp: number;
  speed: number;
  attackDamage: number;
  attackRange: number;
  cooldownTimer: number;
  targetX?: number;
  targetZ?: number;
  wanderTimer?: number;
  isDead?: boolean;
}

export type AnimalType = 'quantum_sheep' | 'cyber_dog' | 'neon_pig' | 'holo_bird';

export type ChestRarity = 'comun' | 'raro' | 'legendario';

export interface ChestEntity {
  id: string;
  rarity: ChestRarity;
  name: string;
  zoneLabel?: string;
  x: number;
  y: number;
  z: number;
  isOpen: boolean;
  respawnTimer: number;
}

export interface AnimalEntity {
  id: string;
  type: AnimalType;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  speed: number;
  wanderTimer: number;
  targetX: number;
  targetZ: number;
  hp: number;
  maxHp: number;
}

export type MaterialId =
  | 'wood'
  | 'stone'
  | 'dirt'
  | 'grass'
  | 'leaves'
  | 'neon_cyan'
  | 'neon_magenta'
  | 'crystal_gold'
  | 'quantum_tech'
  | 'void_rock'
  | 'jump_pad'
  | 'teleport_pad'
  | 'light_block'
  | 'quantum_wool'
  | 'cyber_leather'
  | 'neon_meat'
  | 'photon_feather'
  | 'glitch_essence'
  | 'dark_alloy'
  | 'plasma_cell';

export interface MaterialDefinition {
  id: MaterialId;
  name: string;
  category: 'bloque_natural' | 'bloque_avanzado' | 'recurso_animal' | 'botin_enemigo';
  color: string;
  emoji: string;
  description: string;
  placeableBlockId?: BlockId;
}

export type MaterialInventory = Partial<Record<MaterialId, number>>;

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'bloques' | 'mecanismos' | 'supervivencia' | 'armas';
  ingredients: Array<{ materialId: MaterialId; count: number }>;
  resultType: 'material' | 'heal' | 'weapon_upgrade' | 'max_hp' | 'points_bundle';
  outputMaterialId?: MaterialId;
  outputCount: number;
  bonusPoints: number;
}

export interface ScriptNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  triggerType?: ScriptTrigger;
  actionType?: ScriptAction;
  params: Record<string, any>;
}

export interface ScriptWire {
  fromNodeId: string;
  toNodeId: string;
}

export interface ScriptDefinition {
  blockCoord: string;
  name: string;
  trigger: ScriptTrigger;
  action: ScriptAction;
  paramNumber: number;
  paramText: string;
}

export type HairStyleId =
  | 'victoria_ponytail'
  | 'cyber_spiky'
  | 'sleek_bob'
  | 'afro_cube'
  | 'neon_horns'
  | 'cyber_braids'
  | 'punk_mohawk'
  | 'twin_pigtails'
  | 'cyber_waves'
  | 'egirl_bangs'
  | 'retro_pompadour'
  | 'holo_dreads'
  | 'side_fade'
  | 'samurai_topknot'
  | 'short_wavy'
  | 'high_ponytail'
  | 'anime_spikes'
  | 'asym_cyber'
  | 'energy_locks'
  | 'buzz_cut'
  | 'quantum_curls';

export type HeadwearId =
  | 'none'
  | 'victoria_visor'
  | 'creator_crown'
  | 'cat_ears'
  | 'builder_helmet'
  | 'cyber_goggles'
  | 'steampunk_tophat'
  | 'gamer_headset'
  | 'cyber_gasmask'
  | 'artist_beret'
  | 'ninja_headband'
  | 'halo_angel'
  | 'urban_cap'
  | 'astro_helmet'
  | 'demon_horns'
  | 'robot_antennas'
  | 'pixel_shades'
  | 'ronin_hat'
  | 'holo_flower_crown'
  | 'valkyrie_wings_helm'
  | 'wizard_hat';

export type BackAccessoryId =
  | 'none'
  | 'quantum_wings'
  | 'crystal_angel_wings'
  | 'demon_neon_wings'
  | 'steampunk_wings'
  | 'cyber_katana'
  | 'twin_swords'
  | 'jetpack'
  | 'explorer_backpack'
  | 'holo_cape'
  | 'cyber_tail'
  | 'energy_shield'
  | 'plasma_tank'
  | 'drone_companion'
  | 'light_quiver'
  | 'electric_guitar'
  | 'solar_battery'
  | 'orbital_ring'
  | 'kawaii_cat_backpack'
  | 'war_hammer'
  | 'rocket_booster';

export type FaceExpressionId =
  | 'victoria_smile'
  | 'happy_kawaii'
  | 'confident_wink'
  | 'cyber_hud'
  | 'determined'
  | 'surprised_open'
  | 'mischief_smirk'
  | 'star_eyes'
  | 'heart_eyes'
  | 'code_glitch'
  | 'angry_battle'
  | 'zen_calm'
  | 'xd_laugh'
  | 'cool_shades'
  | 'chibi_blush'
  | 'pixel_robot'
  | 'derp_silly'
  | 'lightning_eyes'
  | 'anon_mask'
  | 'galaxy_cosmic'
  | 'vampire_fangs';

export interface AvatarCustomization {
  skinColor: string;
  hairStyle: HairStyleId;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  headwear: HeadwearId;
  backAccessory: BackAccessoryId;
  faceExpression: FaceExpressionId;
  scale: number;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  category: 'cosmetico' | 'bloque' | 'plano' | 'script';
  price: number;
  rarity: 'común' | 'raro' | 'épico' | 'legendario';
  description: string;
  author: string;
  icon: string;
  avatarConfig?: Partial<AvatarCustomization>;
  blockId?: BlockId;
  blueprintType?: string;
  purchased?: boolean;
}

export interface WeeklyEvent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  timeLeftHours: number;
  communityProgress: number; // e.g. 38400
  communityGoal: number; // e.g. 50000
  milestones: {
    target: number;
    reward: string;
    unlocked: boolean;
  }[];
  challenges: {
    id: string;
    title: string;
    rewardPoints: number;
    progress: number;
    target: number;
    completed: boolean;
  }[];
}

export interface MultiplayerPeer {
  id: string;
  name: string;
  platform: 'PC' | 'Mobile' | 'Console';
  color: string;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotationY: number;
  currentAction: 'idle' | 'walking' | 'jumping' | 'building' | 'dancing';
  lastChatMessage?: string;
  chatTimer?: number;
  customization: AvatarCustomization;
}

export interface GameState {
  points: number;
  creativeFragments: number;
  activeIslandId: string;
  mode: 'title' | 'playing' | 'paused';
  storyDialogueIndex: number;
  unlockedIslands: string[];
}
