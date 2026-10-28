/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import {
  BlockId,
  GameState,
  AvatarCustomization,
  MarketplaceItem,
  WeeklyEvent,
  VoxelWorldData,
  ScriptDefinition,
  WeaponId,
  MaterialId,
  MaterialInventory,
} from './types/game';
import { sound } from './audio/soundSystem';
import { VoxelEngine, RaycastHitResult } from './game/voxelEngine';
import { createVoxelCharacter, VICTORIA_TORO_CUSTOMIZATION } from './game/characterModel';
import { PlayerController, PlayerInputState } from './game/playerController';
import { MultiplayerManager } from './game/multiplayerManager';
import { CombatAndCreaturesManager } from './game/combatAndCreatures';
import { ParticleManager } from './game/particleManager';
import { createIslaNexo, PRESET_WORLDS, WORLD_SPAWN_CREATURES } from './game/presetWorlds';
import { INITIAL_MARKETPLACE_ITEMS, INITIAL_WEEKLY_EVENT } from './data/marketplaceData';
import { EmoteDefinition, GAME_EMOTES } from './data/emotesData';
import { DayNightCycle, DayNightState } from './game/dayNightCycle';
import {
  getBlockDrops,
  INITIAL_MATERIAL_INVENTORY,
  MATERIAL_DEFINITIONS,
} from './data/materialsAndCrafting';

import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { WorldEditorModal } from './components/WorldEditorModal';
import { VisualScriptEditorModal } from './components/VisualScriptEditorModal';
import { MarketplaceModal } from './components/MarketplaceModal';
import { WeeklyEventModal } from './components/WeeklyEventModal';
import { StoryLoreModal } from './components/StoryLoreModal';
import { PauseModal } from './components/PauseModal';
import { EmoteSelectorModal } from './components/EmoteSelectorModal';
import { CraftingModal } from './components/CraftingModal';
import { MinimapEnemy, MinimapPOI } from './components/MiniMap';
import { WeatherSystem, WeatherConfig } from './game/weatherSystem';
import { questSystem, StoryQuest } from './game/questSystem';
import { QuestLogModal } from './components/QuestLogModal';

// Safe localStorage utilities to prevent QuotaExceededError with massive 1000% worlds
function safeStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[Toroverse] Storage write skipped for "${key}":`, err);
  }
}

function safeStorageRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}

export default function App() {
  // Game state
  const [mode, setMode] = useState<'title' | 'playing' | 'paused'>('title');
  const [points, setPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('toroverse_points');
      return saved ? parseInt(saved, 10) : 1500;
    } catch (_) {
      return 1500;
    }
  });
  const [storyDialogueIndex, setStoryDialogueIndex] = useState(0);

  // Player Health & Upgrades State
  const [health, setHealth] = useState<number>(100);
  const [maxHealth, setMaxHealth] = useState<number>(100);
  const [weaponDamageMultiplier, setWeaponDamageMultiplier] = useState<number>(1.0);

  // Material Storage Inventory (Minecraft-style harvested blocks, animal resources & enemy loot)
  const [materialInventory, setMaterialInventory] = useState<MaterialInventory>(() => {
    try {
      const saved = localStorage.getItem('toroverse_materials_v1');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_MATERIAL_INVENTORY;
  });
  const [showCraftingModal, setShowCraftingModal] = useState(false);

  // Active custom world (1000% Colossal Archipelago created procedurally on demand)
  const [activeWorld, setActiveWorld] = useState<VoxelWorldData>(() => {
    // Purge bloated legacy giant keys to liberate browser's 5MB localStorage quota
    safeStorageRemove('toroverse_active_world');
    safeStorageRemove('toroverse_active_world_v2');
    safeStorageRemove('toroverse_active_world_v3');

    let savedWorldId = 'isla_nexo';
    try {
      savedWorldId = localStorage.getItem('toroverse_active_world_id') || 'isla_nexo';
    } catch (_) {}

    const generator = PRESET_WORLDS[savedWorldId] || createIslaNexo;
    return generator();
  });

  // Avatar Customization
  const [avatarCustom, setAvatarCustom] = useState<AvatarCustomization>(() => {
    const saved = localStorage.getItem('toroverse_avatar');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return VICTORIA_TORO_CUSTOMIZATION;
  });

  // Hotbar, Weapons & Tool selection
  const [activeBlock, setActiveBlock] = useState<BlockId>('neon_cyan');
  const [equippedWeapon, setEquippedWeapon] = useState<WeaponId>('sword');
  const [toolMode, setToolMode] = useState<'combat' | 'place' | 'mine' | 'script'>('combat');

  // Modals state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showEmoteModal, setShowEmoteModal] = useState(false);
  const [activeEmote, setActiveEmote] = useState<string | null>(null);
  const [selectedCoordForScript, setSelectedCoordForScript] = useState<string>('0,1,0');

  // Marketplace & Weekly Event data
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() => {
    const saved = localStorage.getItem('toroverse_market');
    return saved ? JSON.parse(saved) : INITIAL_MARKETPLACE_ITEMS;
  });
  const [weeklyEvent, setWeeklyEvent] = useState<WeeklyEvent>(() => {
    const saved = localStorage.getItem('toroverse_event');
    return saved ? JSON.parse(saved) : INITIAL_WEEKLY_EVENT;
  });

  // Notification and chat
  const [notification, setNotification] = useState<string | null>(null);
  const [recentChat, setRecentChat] = useState<{ sender: string; msg: string; platform: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [attackFeedback, setAttackFeedback] = useState<{
    id: number;
    weaponId: WeaponId;
    hit: boolean;
  } | null>(null);

  // Refs for 3D engine & combat
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  const playerCtrlRef = useRef<PlayerController | null>(null);
  const multiplayerRef = useRef<MultiplayerManager | null>(null);
  const combatRef = useRef<CombatAndCreaturesManager | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;
  const activeBlockRef = useRef(activeBlock);
  activeBlockRef.current = activeBlock;

  // Dynamic Day/Night Cycle ref & state
  const dayNightCycleRef = useRef<DayNightCycle | null>(null);
  const [dayNightState, setDayNightState] = useState<DayNightState | null>(null);

  const handleAdvanceDayNightTime = (hours: number) => {
    if (dayNightCycleRef.current) {
      dayNightCycleRef.current.advanceTime(hours);
      setDayNightState(dayNightCycleRef.current.getState());
    }
  };

  const handleToggleDayNightAuto = () => {
    if (dayNightCycleRef.current) {
      dayNightCycleRef.current.toggleAutoAdvance();
      setDayNightState(dayNightCycleRef.current.getState());
    }
  };

  const handleSetDayNightHour = (hour: number) => {
    if (dayNightCycleRef.current) {
      dayNightCycleRef.current.setTime(hour);
      setDayNightState(dayNightCycleRef.current.getState());
    }
  };

  // Radar Mini-map live data
  const [radarData, setRadarData] = useState<{
    playerX: number;
    playerY: number;
    playerZ: number;
    playerYaw: number;
    enemies: MinimapEnemy[];
  }>({
    playerX: 0,
    playerY: 0,
    playerZ: 0,
    playerYaw: 0,
    enemies: [],
  });

  // Calculate island POIs (Spawn point, Central Citadel, pads, faros, scripts)
  const minimapPois = useMemo(() => {
    const list: MinimapPOI[] = [
      {
        id: 'poi_spawn',
        name: 'Zona de Regeneración',
        type: 'spawn',
        x: activeWorld.spawnPoint[0],
        z: activeWorld.spawnPoint[2],
      },
      {
        id: 'poi_citadel',
        name: 'Nexo Central (0,0)',
        type: 'citadel',
        x: 0,
        z: 0,
      },
    ];

    // Landmark blocks from active world
    for (const [key, blockId] of Object.entries(activeWorld.blocks)) {
      if (blockId === 'teleport_pad') {
        const [bx, , bz] = key.split(',').map(Number);
        list.push({ id: `tp_${key}`, name: 'Teletransportador', type: 'teleport', x: bx, z: bz });
      } else if (blockId === 'jump_pad') {
        const [bx, , bz] = key.split(',').map(Number);
        list.push({ id: `jp_${key}`, name: 'Plataforma de Salto', type: 'jump', x: bx, z: bz });
      } else if (blockId === 'light_block') {
        const [bx, , bz] = key.split(',').map(Number);
        list.push({ id: `faro_${key}`, name: 'Faro de Victoria', type: 'beacon', x: bx, z: bz });
      }
    }

    // Scripts / terminals
    for (const [key, sc] of Object.entries(activeWorld.scripts)) {
      const [bx, , bz] = key.split(',').map(Number);
      list.push({ id: `sc_${key}`, name: sc.name || 'Terminal Cuántico', type: 'quest', x: bx, z: bz });
    }

    return list;
  }, [activeWorld]);

  // Touch & Input state
  const [isMobileTouch, setIsMobileTouch] = useState(false);
  const inputStateRef = useRef<PlayerInputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    mine: false,
    place: false,
    interact: false,
    virtualStickX: 0,
    virtualStickY: 0,
  });

  // Save points helper
  const addPoints = (amount: number, reason: string) => {
    setPoints((prev) => {
      const next = prev + amount;
      safeStorageSet('toroverse_points', next.toString());
      return next;
    });
    setNotification(`+${amount} PTS · ${reason}`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper to add materials to inventory & persist
  const addMaterialToStorage = (materialId: MaterialId, count: number) => {
    setMaterialInventory((prev) => {
      const next: MaterialInventory = {
        ...prev,
        [materialId]: (prev[materialId] ?? 0) + count,
      };
      safeStorageSet('toroverse_materials_v1', JSON.stringify(next));
      return next;
    });
  };

  // Perform Player Attack (Hits both NPCs/Enemies and harvestable Animals)
  const handlePlayerAttack = () => {
    if (!combatRef.current || !playerCtrlRef.current) return;
    const dir = new THREE.Vector3();
    playerCtrlRef.current.camera.getWorldDirection(dir);
    const result = combatRef.current.playerAttack(playerCtrlRef.current.position, dir);
    playerCtrlRef.current.triggerAttack(result.weaponId, dir);

    const feedbackId = Date.now();
    setAttackFeedback({
      id: feedbackId,
      weaponId: result.weaponId,
      hit: result.hitEnemiesCount > 0,
    });
    setTimeout(() => {
      setAttackFeedback((prev) => (prev?.id === feedbackId ? null : prev));
    }, 220);

    if (result.hitEnemiesCount > 0) {
      setNotification(`⚔️ ¡Impacto Cuántico! -${result.damageDealt} daño a ${result.hitEnemiesCount} objetivo(s)`);
      setTimeout(() => setNotification(null), 2000);
    }
  };

  // Perform Minecraft-style Mining Action (Collects materials from blocks, animals, or NPC enemies)
  const performMineAction = () => {
    if (!engineRef.current || !playerCtrlRef.current || !combatRef.current) return;
    const dir = new THREE.Vector3();
    playerCtrlRef.current.camera.getWorldDirection(dir);

    // Trigger pickaxe swing animation & visual feedback
    playerCtrlRef.current.triggerAttack('hammer', dir);
    const feedbackId = Date.now();
    setAttackFeedback({
      id: feedbackId,
      weaponId: 'hammer',
      hit: true,
    });
    setTimeout(() => {
      setAttackFeedback((prev) => (prev?.id === feedbackId ? null : prev));
    }, 200);

    // 1. Check if mining/harvesting an animal or enemy directly in front of player
    const hitCreature = combatRef.current.mineCreatureAt(playerCtrlRef.current.position, dir);
    if (hitCreature) {
      setNotification('⛏️ ¡Extrayendo recursos con el Pico Cuántico!');
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    // 2. Raycast voxel block to mine & spawn 3D floating Minecraft-style material drops
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), playerCtrlRef.current.camera);
    const hit = engineRef.current.raycastBlock(raycaster);
    if (hit && hit.blockId !== 'air') {
      const minedBlockId = hit.blockId;
      const drops = getBlockDrops(minedBlockId);

      // Remove block from world
      engineRef.current.setBlock(hit.hitCoord.x, hit.hitCoord.y, hit.hitCoord.z, 'air');
      sound.playPositionalBlockMine(hit.hitCoord.x + 0.5, hit.hitCoord.y + 0.5, hit.hitCoord.z + 0.5);

      // Spawn 3D floating item drops that pop out and magnetize into player's inventory
      for (const drop of drops) {
        combatRef.current.spawnDroppedMaterial(
          hit.hitCoord.x + 0.5,
          hit.hitCoord.y + 0.25,
          hit.hitCoord.z + 0.5,
          drop.materialId,
          drop.count
        );
      }

      const mainDropDef = MATERIAL_DEFINITIONS[drops[0].materialId];
      addPoints(15, `Minado: ${mainDropDef.emoji} ${mainDropDef.name}`);
    }
  };

  // Handle Emote Trigger
  const handleSelectEmote = (emote: EmoteDefinition) => {
    if (!playerCtrlRef.current) return;
    playerCtrlRef.current.triggerEmote(emote.id, emote.durationSeconds);
    setActiveEmote(emote.id);

    // Notify multiplayer peers
    if (multiplayerRef.current) {
      multiplayerRef.current.triggerPeersReact(emote.id);
    }

    setNotification(`Bailando: ${emote.name} ${emote.emoji}`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleStopEmote = () => {
    if (playerCtrlRef.current) {
      playerCtrlRef.current.stopEmote();
    }
    setActiveEmote(null);
  };

  // Detect Mobile device touch
  useEffect(() => {
    const checkTouch = () => {
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        setIsMobileTouch(true);
      }
    };
    checkTouch();
  }, []);

  // Save changes to localStorage with safeStorageSet
  useEffect(() => {
    safeStorageSet('toroverse_avatar', JSON.stringify(avatarCustom));
  }, [avatarCustom]);

  useEffect(() => {
    safeStorageSet('toroverse_market', JSON.stringify(marketplaceItems));
  }, [marketplaceItems]);

  useEffect(() => {
    safeStorageSet('toroverse_event', JSON.stringify(weeklyEvent));
  }, [weeklyEvent]);

  // Sync equipped weapon with combat manager
  useEffect(() => {
    if (combatRef.current) {
      combatRef.current.equipWeapon(equippedWeapon);
    }
  }, [equippedWeapon]);

  // Sync tool visual mode (shows 3D Cyber Pickaxe in Victoria's hand when toolMode === 'mine')
  useEffect(() => {
    if (combatRef.current) {
      combatRef.current.setToolVisualMode(toolMode);
    }
  }, [toolMode]);

  // Sync weapon damage multiplier
  useEffect(() => {
    if (combatRef.current) {
      combatRef.current.weaponDamageMultiplier = weaponDamageMultiplier;
    }
  }, [weaponDamageMultiplier]);

  // Main Three.js Scene Setup (Mounts once)
  useEffect(() => {
    if (!canvasMountRef.current) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);

    canvasMountRef.current.appendChild(renderer.domElement);

    // 3. Scene, Fog & Camera (Optimized for 1000% massive islands, 800+ blocks span)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.0018);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1600);

    // 4. Procedural Room Environment for PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting: Warm Key Light + Cool Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.25);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    dirLight.position.set(100, 140, 80);
    if (!isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 450;
      const d = 140;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    // Subtle atmospheric ambient floating particles (Expanded field over 800 blocks)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = Math.random() * 120 - 20;
      starPos[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x00f5d4,
      size: 0.28,
      transparent: true,
      opacity: 0.65,
    });
    const starParticles = new THREE.Points(starGeo, starMat);
    scene.add(starParticles);

    // Initialize Dynamic Day & Night Cycle
    const dayNightCycle = new DayNightCycle(8.5, 240);
    dayNightCycleRef.current = dayNightCycle;
    dayNightCycle.applyToScene(scene, dirLight, hemiLight, starParticles);
    setDayNightState(dayNightCycle.getState());

    // 6. Initialize Particle System, Voxel Engine, Character & Player Controller
    const particleManager = new ParticleManager(scene);

    const voxelEngine = new VoxelEngine(scene, activeWorld);
    voxelEngine.particleManager = particleManager;
    engineRef.current = voxelEngine;

    const charInstance = createVoxelCharacter(avatarCustom);
    const playerCtrl = new PlayerController(camera, charInstance, voxelEngine);
    playerCtrl.position.set(activeWorld.spawnPoint[0], activeWorld.spawnPoint[1] + 1, activeWorld.spawnPoint[2]);
    playerCtrlRef.current = playerCtrl;

    playerCtrl.onEarnPoints = (amt, reason) => {
      addPoints(amt, reason);
    };

    // 7. Initialize Multiplayer Manager
    const mpManager = new MultiplayerManager(scene, voxelEngine);
    multiplayerRef.current = mpManager;
    mpManager.onChatMessage = (sender, msg, platform) => {
      setRecentChat({ sender, msg, platform });
    };

    // 8. Initialize Combat & Creatures Manager (Enemies, Animals, Weapons)
    const combatManager = new CombatAndCreaturesManager(scene, voxelEngine, charInstance.rightArm);
    combatManager.particleManager = particleManager;
    combatRef.current = combatManager;
    combatManager.equipWeapon(equippedWeapon);

    // Callback when player takes damage from hostile creature
    combatManager.onPlayerDamaged = (damage, attackerName) => {
      playerCtrlRef.current?.triggerCameraShake(0.28, 0.25);
      setHealth((prev) => {
        const next = Math.max(0, prev - damage);
        if (next <= 0) {
          sound.playPlayerHurt();
          setNotification(`¡Victoria Toro fue derribada por ${attackerName}! Reapareciendo en el Nexo...`);
          setTimeout(() => {
            setHealth(100);
            if (playerCtrlRef.current) {
              playerCtrlRef.current.teleport(
                activeWorld.spawnPoint[0],
                activeWorld.spawnPoint[1] + 1,
                activeWorld.spawnPoint[2]
              );
            }
          }, 900);
        } else {
          setNotification(`¡Daño recibido de ${attackerName}! -${damage} HP`);
          setTimeout(() => setNotification(null), 2000);
        }
        return next;
      });
    };

    // Callback when player defeats an enemy or NPC
    combatManager.onEnemyDefeated = (enemy, rewardPoints) => {
      addPoints(rewardPoints, `¡${enemy.name} Eliminado! Recoge su botín`);
      // Weekly challenge progress for combat
      setWeeklyEvent((prev) => ({
        ...prev,
        challenges: prev.challenges.map((c) =>
          c.id === 'ch_2' ? { ...c, progress: Math.min(c.target, c.progress + 1) } : c
        ),
      }));
    };

    // Callback when player harvests an animal (Minecraft style)
    combatManager.onAnimalHarvested = (animal, rewardPoints) => {
      addPoints(rewardPoints, `Recursos de ${animal.name} obtenidos`);
    };

    // Callback when floating 3D dropped material is magnetized & collected into storage
    combatManager.onMaterialCollected = (materialId, count) => {
      addMaterialToStorage(materialId, count);
      const def = MATERIAL_DEFINITIONS[materialId];
      setNotification(`📦 Almacenado: +${count} ${def.emoji} ${def.name} (Pulsa [E] para Unir)`);
      setTimeout(() => setNotification(null), 2400);
    };

    // Spawn creatures for the active world
    const spawnWorldEntities = (worldId: string) => {
      const spawns = WORLD_SPAWN_CREATURES[worldId] || WORLD_SPAWN_CREATURES['isla_nexo'];
      if (!spawns) return;

      // Spawn hostile enemies
      spawns.enemies.forEach((en) => {
        combatManager.spawnEnemy(en.type, en.x, en.y, en.z);
      });

      // Spawn peaceful voxel animals
      spawns.animals.forEach((an) => {
        combatManager.spawnAnimal(an.type, an.x, an.y, an.z);
      });
    };

    spawnWorldEntities(activeWorld.id);

    // Raycaster for block placement preview
    const raycaster = new THREE.Raycaster();
    const centerScreen = new THREE.Vector2(0, 0);

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 9. Animation & Render Loop (60fps simulation, paced on Software WebGL)
    let frameId = 0;
    const clock = new THREE.Clock();
    let titlePanAngle = 0;
    let hudTimer = 0;
    let radarTimer = 0;
    const _listenerDir = new THREE.Vector3();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      // Synchronize 3D positional sound engine with camera position and direction
      camera.getWorldDirection(_listenerDir);
      sound.updateListener(camera.position, _listenerDir);

      // Star particles gentle float
      starParticles.rotation.y += dt * 0.02;

      // Dynamic Day/Night celestial cycle and organic emissive materials breathing
      dayNightCycle.update(dt);
      dayNightCycle.applyToScene(scene, dirLight, hemiLight, starParticles);
      voxelEngine.updateEmissiveMaterials(
        dayNightCycle.currentEmissiveBoost,
        dayNightCycle.currentNightFactor,
        clock.getElapsedTime()
      );

      // Throttled HUD update for 24h clock to preserve smooth 60 FPS
      hudTimer += dt;
      if (hudTimer >= 0.4) {
        hudTimer = 0;
        setDayNightState(dayNightCycle.getState());
      }

      // Throttled Radar Mini-map update (10Hz / 100ms) for detected enemies & player tracking
      radarTimer += dt;
      if (radarTimer >= 0.1) {
        radarTimer = 0;
        if (playerCtrlRef.current && combatRef.current) {
          const p = playerCtrlRef.current.position;
          const enemiesList: MinimapEnemy[] = [];
          combatRef.current.enemies.forEach(({ data }) => {
            if (!data.isDead) {
              enemiesList.push({
                id: data.id,
                name: data.name,
                type: data.type,
                x: data.x,
                z: data.z,
                hp: data.hp,
                maxHp: data.maxHp,
                isAggro: Math.hypot(data.x - p.x, data.z - p.z) < 16,
              });
            }
          });
          setRadarData({
            playerX: p.x,
            playerY: p.y,
            playerZ: p.z,
            playerYaw: playerCtrlRef.current.yaw,
            enemies: enemiesList,
          });
        }
      }

      if (modeRef.current === 'title') {
        // Live camera pan around Victoria Toro & 1000% Colossal Central Citadel
        titlePanAngle += dt * 0.22;
        const radius = 65;
        camera.position.set(Math.sin(titlePanAngle) * radius, 28, Math.cos(titlePanAngle) * radius);
        camera.lookAt(0, 12, 0);
        charInstance.root.position.set(0, 1.0, 0);
        charInstance.root.rotation.y = titlePanAngle + Math.PI;
        charInstance.updateAnimation(false, false, false, dt);
      } else if (modeRef.current === 'playing') {
        // Player simulation
        playerCtrl.update(dt, inputStateRef.current, false);

        // Raycasting for target wireframe box
        raycaster.setFromCamera(centerScreen, camera);
        const hit = voxelEngine.raycastBlock(raycaster);
        voxelEngine.updateTargetWireframes(hit);

        // Multiplayer peers simulation
        mpManager.update(dt);

        // Combat & Creatures AI update (Aggro, attacks, projectiles, wandering animals)
        combatManager.update(dt, playerCtrl.position);

        // Sync active emote state if canceled by movement
        if (!playerCtrl.currentEmote && activeEmote) {
          setActiveEmote(null);
        }
      }

      voxelEngine.updateParticles(dt);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 10. Resize listener
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Pointer lock & Mouse move for camera look
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (modeRef.current !== 'playing') return;
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (modeRef.current !== 'playing' || !isMouseDown) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (playerCtrlRef.current) {
        playerCtrlRef.current.yaw -= dx * 0.0035;
        playerCtrlRef.current.pitch = Math.max(
          -1.3,
          Math.min(0.6, playerCtrlRef.current.pitch - dy * 0.0035)
        );
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    // Touch swipe camera look for mobile / tablet
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (modeRef.current !== 'playing') return;
      const touch = e.touches[0];
      if (touch && touch.clientX > window.innerWidth * 0.3) {
        isTouchSwiping = true;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchSwiping || modeRef.current !== 'playing') return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      if (playerCtrlRef.current) {
        playerCtrlRef.current.yaw -= dx * 0.0055;
        playerCtrlRef.current.pitch = Math.max(
          -1.3,
          Math.min(0.6, playerCtrlRef.current.pitch - dy * 0.0055)
        );
      }
    };

    const handleTouchEnd = () => {
      isTouchSwiping = false;
    };

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const inp = inputStateRef.current;

      if (code === 'KeyW' || code === 'ArrowUp') inp.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') inp.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') inp.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') inp.right = true;
      if (code === 'Space') inp.jump = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') inp.sprint = true;

      // Combat attack shortcut
      if (code === 'KeyF') {
        handlePlayerAttack();
      }

      // Quick Mine / Harvest shortcut
      if (code === 'KeyM') {
        sound.playClick();
        setToolMode('mine');
        performMineAction();
      }

      // Storage & Material Fusion / Crafting Modal shortcut
      if (code === 'KeyE') {
        sound.playClick();
        setShowCraftingModal((prev) => !prev);
      }

      // Emotes shortcut
      if (code === 'KeyB') {
        sound.playClick();
        setShowEmoteModal((prev) => !prev);
      }

      // Toggle combat / build mode
      if (code === 'KeyC') {
        sound.playClick();
        setToolMode((prev) => (prev === 'combat' ? 'place' : 'combat'));
      }

      if (code === 'Escape') {
        if (modeRef.current === 'playing') setMode('paused');
        else if (modeRef.current === 'paused') setMode('playing');
      }

      // Hotbar block number keys 1-9
      if (code >= 'Digit1' && code <= 'Digit9') {
        const idx = parseInt(code.replace('Digit', ''), 10) - 1;
        const keys: BlockId[] = [
          'grass',
          'dirt',
          'stone',
          'wood',
          'neon_cyan',
          'neon_magenta',
          'crystal_gold',
          'quantum_tech',
          'jump_pad',
          'teleport_pad',
        ];
        if (keys[idx]) {
          sound.playClick();
          setActiveBlock(keys[idx]);
          setToolMode('place');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const inp = inputStateRef.current;
      if (code === 'KeyW' || code === 'ArrowUp') inp.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') inp.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') inp.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') inp.right = false;
      if (code === 'Space') inp.jump = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') inp.sprint = false;
    };

    // Mouse click for Attack / Mine / Place
    const handleCanvasClick = (e: MouseEvent) => {
      if (modeRef.current !== 'playing') return;
      if (!engineRef.current || !playerCtrlRef.current) return;

      // In combat mode, click triggers weapon attack
      if (toolModeRef.current === 'combat' && e.button === 0) {
        handlePlayerAttack();
        return;
      }

      // In mine mode, left click harvests animals/enemies or mines blocks with 3D item drops
      if (toolModeRef.current === 'mine' && e.button === 0) {
        performMineAction();
        return;
      }

      raycaster.setFromCamera(centerScreen, camera);
      const hit = engineRef.current.raycastBlock(raycaster);

      if (hit) {
        const coordKey = `${hit.hitCoord.x},${hit.hitCoord.y},${hit.hitCoord.z}`;

        // Right click OR place tool
        if (e.button === 2 || toolModeRef.current === 'place') {
          const blockToPlace = activeBlockRef.current;
          // Place block
          engineRef.current.setBlock(hit.placeCoord.x, hit.placeCoord.y, hit.placeCoord.z, blockToPlace);
          sound.playPositionalBlockPlace(
            hit.placeCoord.x + 0.5,
            hit.placeCoord.y + 0.5,
            hit.placeCoord.z + 0.5,
            blockToPlace
          );
          addPoints(25, 'Bloque Colocado');

          // Deduct 1 from stored inventory if available
          setMaterialInventory((prev) => {
            const matKey = blockToPlace as MaterialId;
            const currentCount = prev[matKey] ?? 0;
            if (currentCount <= 0) return prev;
            const next = { ...prev, [matKey]: currentCount - 1 };
            safeStorageSet('toroverse_materials_v1', JSON.stringify(next));
            return next;
          });

          // Progress weekly challenge
          setWeeklyEvent((prev) => {
            const nextCh = prev.challenges.map((ch) =>
              ch.id === 'ch_1' ? { ...ch, progress: Math.min(ch.target, ch.progress + 1) } : ch
            );
            return {
              ...prev,
              communityProgress: prev.communityProgress + 1,
              challenges: nextCh,
            };
          });
        } else if (toolModeRef.current === 'script') {
          setSelectedCoordForScript(coordKey);
          setShowScriptModal(true);
        }
      }
    };

    // Prevent context menu on right click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    dom.addEventListener('touchmove', handleTouchMove, { passive: true });
    dom.addEventListener('touchend', handleTouchEnd);
    dom.addEventListener('click', handleCanvasClick);
    dom.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('touchstart', handleTouchStart);
      dom.removeEventListener('touchmove', handleTouchMove);
      dom.removeEventListener('touchend', handleTouchEnd);
      dom.removeEventListener('click', handleCanvasClick);
      dom.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      particleManager.dispose();
      renderer.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, []);

  // Sync avatar customization to active character
  useEffect(() => {
    if (playerCtrlRef.current?.character) {
      playerCtrlRef.current.character.updateCustomization(avatarCustom);
    }
  }, [avatarCustom]);

  // Load new world into engine
  const handleSelectWorld = (world: VoxelWorldData) => {
    setActiveWorld(world);
    safeStorageSet('toroverse_active_world_id', world.id);
    if (engineRef.current && playerCtrlRef.current) {
      engineRef.current.loadWorld(world);
      playerCtrlRef.current.teleport(world.spawnPoint[0], world.spawnPoint[1] + 1, world.spawnPoint[2]);
    }

    // Respawn creatures for selected world
    if (combatRef.current) {
      combatRef.current.clearAllCreatures();
      const spawns = WORLD_SPAWN_CREATURES[world.id] || WORLD_SPAWN_CREATURES['isla_nexo'];
      if (spawns) {
        spawns.enemies.forEach((en) => {
          combatRef.current?.spawnEnemy(en.type, en.x, en.y, en.z);
        });
        spawns.animals.forEach((an) => {
          combatRef.current?.spawnAnimal(an.type, an.x, an.y, an.z);
        });
      }
    }
  };

  // Stamp blueprint
  const handleStampBlueprint = (blueprintId: string) => {
    if (!engineRef.current || !playerCtrlRef.current) return;
    const px = Math.floor(playerCtrlRef.current.position.x);
    const py = Math.floor(playerCtrlRef.current.position.y);
    const pz = Math.floor(playerCtrlRef.current.position.z);

    const placedCount = engineRef.current.stampBlueprint(px, py, pz, blueprintId);
    sound.playFanfare();
    addPoints(100, `Plano Estampado (+${placedCount} bloques)`);
  };

  // Save current world
  const handleSaveCurrentWorld = () => {
    if (!engineRef.current) return;
    safeStorageSet('toroverse_active_world_id', engineRef.current.worldData.id);
    setNotification('¡Mundo y construcciones sincronizados en memoria!');
    setTimeout(() => setNotification(null), 2500);
  };

  // Import world
  const handleImportWorldData = (jsonStr: string) => {
    const data: VoxelWorldData = JSON.parse(jsonStr);
    handleSelectWorld(data);
  };

  // Save script to block
  const handleSaveScript = (script: ScriptDefinition) => {
    if (!engineRef.current) return;
    engineRef.current.worldData.scripts[script.blockCoord] = script;
    engineRef.current.interactiveCoordSet.add(script.blockCoord);
    addPoints(150, 'Script Visual Conectado');
    // Progress challenge 4
    setWeeklyEvent((prev) => ({
      ...prev,
      challenges: prev.challenges.map((c) => (c.id === 'ch_4' ? { ...c, progress: 1, completed: true } : c)),
    }));
  };

  // Delete script
  const handleDeleteScript = (coord: string) => {
    if (!engineRef.current) return;
    delete engineRef.current.worldData.scripts[coord];
  };

  // Buy item in marketplace with in-game points
  const handleBuyMarketItem = (item: MarketplaceItem): boolean => {
    if (points < item.price) return false;
    setPoints((prev) => {
      const next = prev - item.price;
      safeStorageSet('toroverse_points', next.toString());
      return next;
    });

    // Mark as purchased
    setMarketplaceItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, purchased: true } : i))
    );

    // Apply cosmetic if applicable
    if (item.avatarConfig) {
      setAvatarCustom((prev) => ({
        ...prev,
        ...item.avatarConfig,
      }));
    }

    return true;
  };

  // Publish custom item in marketplace
  const handlePublishCustomItem = (
    title: string,
    category: MarketplaceItem['category'],
    price: number,
    desc: string
  ) => {
    const newItem: MarketplaceItem = {
      id: `custom_${Date.now()}`,
      title,
      category,
      price,
      rarity: 'épico',
      description: desc,
      author: 'Tú (Arquitecto)',
      icon: 'Sparkles',
      purchased: true,
    };
    setMarketplaceItems((prev) => [newItem, ...prev]);
    addPoints(300, 'Regalías por Creación Publicada');
  };

  // Claim weekly challenge
  const handleClaimChallenge = (challengeId: string) => {
    setWeeklyEvent((prev) => {
      const target = prev.challenges.find((c) => c.id === challengeId);
      if (target && !target.completed) {
        addPoints(target.rewardPoints, target.title);
        sound.playFanfare();
        return {
          ...prev,
          challenges: prev.challenges.map((c) =>
            c.id === challengeId ? { ...c, completed: true } : c
          ),
        };
      }
      return prev;
    });
  };

  // Mobile Touch actions
  const handleTouchStickMove = (x: number, y: number) => {
    inputStateRef.current.virtualStickX = x;
    inputStateRef.current.virtualStickY = y;
  };

  const handleTouchJump = () => {
    inputStateRef.current.jump = true;
    setTimeout(() => {
      inputStateRef.current.jump = false;
    }, 120);
  };

  // Spawn NPC Enemy Patrol near player for instant combat & loot
  const handleSpawnNpcWave = () => {
    if (!combatRef.current || !playerCtrlRef.current) return;
    const p = playerCtrlRef.current.position;
    combatRef.current.spawnEnemy('npc_raider', p.x + 8, p.y + 1, p.z + 6);
    combatRef.current.spawnEnemy('npc_shadow_knight', p.x - 8, p.y + 1, p.z + 7);
    combatRef.current.spawnEnemy('npc_corrupted_hacker', p.x + 6, p.y + 1, p.z - 8);
  };

  // Spawn Animal Herd near player for Minecraft-style resource harvesting
  const handleSpawnAnimalHerd = () => {
    if (!combatRef.current || !playerCtrlRef.current) return;
    const p = playerCtrlRef.current.position;
    combatRef.current.spawnAnimal('quantum_sheep', p.x + 5, p.y + 1, p.z + 4);
    combatRef.current.spawnAnimal('neon_pig', p.x - 5, p.y + 1, p.z + 4);
    combatRef.current.spawnAnimal('cyber_dog', p.x + 4, p.y + 1, p.z - 5);
    combatRef.current.spawnAnimal('holo_bird', p.x - 4, p.y + 1, p.z - 5);
  };

  const handleTouchAction = () => {
    if (toolMode === 'combat') {
      handlePlayerAttack();
      return;
    }

    if (toolMode === 'mine') {
      performMineAction();
      return;
    }

    if (!engineRef.current || !playerCtrlRef.current) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), playerCtrlRef.current.camera);
    const hit = engineRef.current.raycastBlock(raycaster);
    if (!hit) return;

    if (toolMode === 'place') {
      engineRef.current.setBlock(hit.placeCoord.x, hit.placeCoord.y, hit.placeCoord.z, activeBlock);
      sound.playPositionalBlockPlace(hit.placeCoord.x + 0.5, hit.placeCoord.y + 0.5, hit.placeCoord.z + 0.5, activeBlock);
      addPoints(25, 'Bloque Colocado');
    } else {
      setSelectedCoordForScript(`${hit.hitCoord.x},${hit.hitCoord.y},${hit.hitCoord.z}`);
      setShowScriptModal(true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas isolated container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 touch-none" />

      {/* Title Screen Overlay */}
      {mode === 'title' && (
        <TitleScreen
          onStartGame={() => setMode('playing')}
          onOpenAvatarCustomizer={() => setShowAvatarModal(true)}
          onOpenWorldEditor={() => setShowWorldModal(true)}
          onOpenStory={() => setShowStoryModal(true)}
          totalPoints={points}
        />
      )}

      {/* Screen-space Attack Slash / Hit-Marker Visual Feedback */}
      {mode === 'playing' && attackFeedback && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
          {/* Subtle edge pulse matching weapon energy */}
          <div
            className="absolute inset-0 transition-opacity duration-200"
            style={{
              background:
                attackFeedback.weaponId === 'sword'
                  ? 'radial-gradient(circle at center, rgba(0,245,212,0.18) 0%, transparent 65%)'
                  : attackFeedback.weaponId === 'hammer'
                  ? 'radial-gradient(circle at center, rgba(245,158,11,0.28) 0%, transparent 70%)'
                  : attackFeedback.weaponId === 'blaster'
                  ? 'radial-gradient(circle at center, rgba(56,189,248,0.2) 0%, transparent 65%)'
                  : 'radial-gradient(circle at center, rgba(244,63,94,0.2) 0%, transparent 65%)',
            }}
          />

          {/* Dynamic Slash / Shockwave Reticle Burst */}
          <div className="relative flex items-center justify-center">
            {attackFeedback.weaponId === 'sword' && (
              <div
                className="w-44 h-1.5 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_24px_#00f5d4] animate-ping"
                style={{ transform: `rotate(${attackFeedback.id % 2 === 0 ? '-32deg' : '32deg'})` }}
              />
            )}
            {attackFeedback.weaponId === 'hammer' && (
              <div className="w-36 h-36 rounded-full border-4 border-amber-400/90 shadow-[0_0_35px_#f59e0b] animate-ping" />
            )}
            {(attackFeedback.weaponId === 'blaster' || attackFeedback.weaponId === 'bow') && (
              <div
                className={`w-16 h-16 rounded-full border-2 animate-ping ${
                  attackFeedback.weaponId === 'blaster'
                    ? 'border-sky-400 shadow-[0_0_20px_#38bdf8]'
                    : 'border-rose-400 shadow-[0_0_20px_#f43f5e]'
                }`}
              />
            )}

            {/* Critical Hit X Marker when an enemy is hit */}
            {attackFeedback.hit && (
              <div className="absolute flex items-center justify-center">
                <div className="w-12 h-1 bg-amber-300 rotate-45 rounded-full shadow-[0_0_16px_#fee440]" />
                <div className="absolute w-12 h-1 bg-amber-300 -rotate-45 rounded-full shadow-[0_0_16px_#fee440]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-Game HUD Overlay */}
      {mode === 'playing' && (
        <GameHUD
          points={points}
          activeWorld={activeWorld}
          activeBlock={activeBlock}
          onSelectBlock={setActiveBlock}
          toolMode={toolMode}
          onSetToolMode={setToolMode}
          health={health}
          maxHealth={maxHealth}
          equippedWeapon={equippedWeapon}
          onSelectWeapon={(w) => setEquippedWeapon(w)}
          onAttack={handlePlayerAttack}
          onOpenAvatar={() => setShowAvatarModal(true)}
          onOpenWorldEditor={() => setShowWorldModal(true)}
          onOpenScriptEditor={() => {
            setSelectedCoordForScript('0,1,0');
            setShowScriptModal(true);
          }}
          onOpenMarketplace={() => setShowMarketModal(true)}
          onOpenWeeklyEvent={() => setShowWeeklyModal(true)}
          onOpenStory={() => setShowStoryModal(true)}
          onOpenEmotes={() => setShowEmoteModal(true)}
          activeEmote={activeEmote}
          onPause={() => setMode('paused')}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
          recentChat={recentChat}
          notificationMessage={notification}
          dayNightState={dayNightState}
          onAdvanceDayNightTime={handleAdvanceDayNightTime}
          onToggleDayNightAuto={handleToggleDayNightAuto}
          onSetDayNightHour={handleSetDayNightHour}
          minimapEnemies={radarData.enemies}
          minimapPois={minimapPois}
          playerX={radarData.playerX}
          playerY={radarData.playerY}
          playerZ={radarData.playerZ}
          playerYaw={radarData.playerYaw}
          isMobileTouch={isMobileTouch}
          onTouchStickMove={handleTouchStickMove}
          onTouchJump={handleTouchJump}
          onTouchAction={handleTouchAction}
          materialInventory={materialInventory}
          onOpenCrafting={() => setShowCraftingModal(true)}
        />
      )}

      {/* Storage & Material Fusion / Crafting Modal [Tecla E] */}
      <CraftingModal
        isOpen={showCraftingModal}
        onClose={() => setShowCraftingModal(false)}
        inventory={materialInventory}
        onUpdateInventory={(next) => {
          setMaterialInventory(next);
          safeStorageSet('toroverse_materials_v1', JSON.stringify(next));
        }}
        onEquipBlock={(bId) => {
          setActiveBlock(bId);
          setToolMode('place');
          setShowCraftingModal(false);
        }}
        onHealPlayer={(amt) => {
          setHealth((prev) => Math.min(maxHealth, prev + amt));
        }}
        onUpgradeMaxHp={(amt) => {
          setMaxHealth((prev) => prev + amt);
          setHealth((prev) => prev + amt);
        }}
        onUpgradeWeaponDamage={() => {
          setWeaponDamageMultiplier((prev) => prev + 0.25);
        }}
        weaponDamageMultiplier={weaponDamageMultiplier}
        onEarnPoints={addPoints}
        onSpawnNpcWave={handleSpawnNpcWave}
        onSpawnAnimalHerd={handleSpawnAnimalHerd}
      />

      {/* Pause Modal */}
      {mode === 'paused' && (
        <PauseModal
          isOpen={true}
          onResume={() => setMode('playing')}
          onExitToTitle={() => setMode('title')}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
          isFirstPerson={isFirstPerson}
          onToggleFirstPerson={() => {
            const next = !isFirstPerson;
            setIsFirstPerson(next);
            if (playerCtrlRef.current) {
              playerCtrlRef.current.isFirstPerson = next;
            }
          }}
        />
      )}

      {/* Avatar Customizer Modal (≥20 items per category) */}
      <AvatarCustomizerModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        customization={avatarCustom}
        onSaveCustomization={(cfg) => setAvatarCustom(cfg)}
      />

      {/* Emotes Selector Modal */}
      <EmoteSelectorModal
        isOpen={showEmoteModal}
        onClose={() => setShowEmoteModal(false)}
        activeEmote={activeEmote}
        onSelectEmote={handleSelectEmote}
        onStopEmote={handleStopEmote}
      />

      {/* World Editor & Vast Island Selector Modal */}
      <WorldEditorModal
        isOpen={showWorldModal}
        onClose={() => setShowWorldModal(false)}
        activeWorld={activeWorld}
        onSelectWorld={handleSelectWorld}
        onStampBlueprint={handleStampBlueprint}
        onSaveCurrentWorld={handleSaveCurrentWorld}
        onImportWorldData={handleImportWorldData}
      />

      {/* Visual Scripting Modal */}
      <VisualScriptEditorModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        selectedCoord={selectedCoordForScript}
        existingScript={activeWorld.scripts[selectedCoordForScript]}
        onSaveScript={handleSaveScript}
        onDeleteScript={handleDeleteScript}
      />

      {/* Creator Marketplace Modal */}
      <MarketplaceModal
        isOpen={showMarketModal}
        onClose={() => setShowMarketModal(false)}
        playerPoints={points}
        items={marketplaceItems}
        onBuyItem={handleBuyMarketItem}
        onPublishCustomItem={handlePublishCustomItem}
      />

      {/* Weekly Community Event Modal */}
      <WeeklyEventModal
        isOpen={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        event={weeklyEvent}
        onClaimChallenge={handleClaimChallenge}
      />

      {/* Victoria Toro Story Lore Modal */}
      <StoryLoreModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        dialogueIndex={storyDialogueIndex}
        onNextDialogue={() => setStoryDialogueIndex((prev) => prev + 1)}
        points={points}
      />
    </div>
  );
}
