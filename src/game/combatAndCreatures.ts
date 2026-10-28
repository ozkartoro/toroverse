/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  WeaponId,
  WeaponDefinition,
  EnemyEntity,
  EnemyType,
  AnimalEntity,
  AnimalType,
  MaterialId,
} from '../types/game';
import { VoxelEngine } from './voxelEngine';
import { sound } from '../audio/soundSystem';
import { ParticleManager } from './particleManager';
import {
  MATERIAL_DEFINITIONS,
  getAnimalDrops,
  getEnemyDrops,
} from '../data/materialsAndCrafting';

export const WEAPON_DEFINITIONS: Record<WeaponId, WeaponDefinition> = {
  sword: {
    id: 'sword',
    name: 'Espada Láser de Victoria',
    damage: 38,
    range: 4.2,
    cooldownSeconds: 0.35,
    description: 'Filo de energía cuántica de rápido balanceo',
    color: '#00f5d4',
    icon: 'Sword',
    type: 'melee',
  },
  blaster: {
    id: 'blaster',
    name: 'Blaster Cuántico',
    damage: 30,
    range: 34,
    cooldownSeconds: 0.4,
    description: 'Dispara proyectiles de plasma luminiscente de largo alcance',
    color: '#38bdf8',
    icon: 'Crosshair',
    type: 'ranged',
  },
  hammer: {
    id: 'hammer',
    name: 'Martillo Titánico Vóxel',
    damage: 68,
    range: 5.5,
    cooldownSeconds: 0.8,
    description: 'Ataque pesado de gran impacto que golpea a múltiples enemigos',
    color: '#f59e0b',
    icon: 'Hammer',
    type: 'melee',
  },
  bow: {
    id: 'bow',
    name: 'Arco de Fotones',
    damage: 45,
    range: 38,
    cooldownSeconds: 0.55,
    description: 'Lanza flechas de luz de alta velocidad y precisión',
    color: '#f43f5e',
    icon: 'Navigation',
    type: 'ranged',
  },
};

export interface Projectile {
  mesh: THREE.Group;
  vel: THREE.Vector3;
  damage: number;
  life: number;
  maxLife: number;
  weaponId: WeaponId;
  trailTimer: number;
}

export interface FloatingText {
  sprite: THREE.Sprite;
  velY: number;
  life: number;
  maxLife: number;
  baseScaleX: number;
  baseScaleY: number;
}

export interface DroppedItem {
  id: string;
  materialId: MaterialId;
  count: number;
  group: THREE.Group;
  vel: THREE.Vector3;
  baseY: number;
  age: number;
}

export class CombatAndCreaturesManager {
  public scene: THREE.Scene;
  public voxelEngine: VoxelEngine;

  public enemies: Map<string, { data: EnemyEntity; group: THREE.Group; hpBar: THREE.Sprite }> = new Map();
  public animals: Map<string, { data: AnimalEntity; group: THREE.Group; hpBar: THREE.Sprite }> = new Map();
  public projectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];
  public droppedItems: DroppedItem[] = [];
  public particleManager?: ParticleManager;

  // Weapon mesh attached to player's right arm
  public playerWeaponGroup: THREE.Group;
  private isAttachedToArm = false;
  private currentWeaponId: WeaponId = 'sword';
  private activeToolVisual: 'weapon' | 'pickaxe' = 'weapon';
  private slashComboDir = 1;
  private creatureAudioTimers = new Map<string, { growlTimer: number; stepTimer: number }>();
  public weatherSpeedMultiplier: number = 1.0;
  public weaponDamageMultiplier: number = 1.0;

  // Callbacks
  public onPlayerDamaged?: (damage: number, attackerName: string) => void;
  public onEnemyDefeated?: (enemy: EnemyEntity, rewardPoints: number) => void;
  public onAnimalHarvested?: (animal: AnimalEntity, rewardPoints: number) => void;
  public onMaterialCollected?: (materialId: MaterialId, count: number) => void;

  constructor(scene: THREE.Scene, voxelEngine: VoxelEngine, rightArm?: THREE.Group) {
    this.scene = scene;
    this.voxelEngine = voxelEngine;

    this.playerWeaponGroup = new THREE.Group();
    if (rightArm) {
      this.attachWeaponToCharacter(rightArm);
    } else {
      this.scene.add(this.playerWeaponGroup);
    }
    this.buildWeaponMesh('sword');
  }

  public attachWeaponToCharacter(rightArm: THREE.Group) {
    this.isAttachedToArm = true;
    rightArm.add(this.playerWeaponGroup);
    this.playerWeaponGroup.position.set(0, -0.72, 0.14);
    this.playerWeaponGroup.rotation.set(Math.PI / 2.2, 0, 0);
  }

  public setToolVisualMode(mode: 'combat' | 'mine' | 'place' | 'script') {
    const targetVisual = mode === 'mine' ? 'pickaxe' : 'weapon';
    if (this.activeToolVisual !== targetVisual) {
      this.activeToolVisual = targetVisual;
      if (targetVisual === 'pickaxe') {
        this.buildPickaxeMesh();
      } else {
        this.buildWeaponMesh(this.currentWeaponId);
      }
    }
  }

  public setWeapon(weaponId: WeaponId) {
    this.currentWeaponId = weaponId;
    if (this.activeToolVisual === 'weapon') {
      this.buildWeaponMesh(weaponId);
    }
  }

  public equipWeapon(weaponId: WeaponId) {
    this.setWeapon(weaponId);
  }

  public clearAllCreatures() {
    this.enemies.forEach((enemyObj) => {
      this.scene.remove(enemyObj.group);
    });
    this.enemies.clear();

    this.animals.forEach((animalObj) => {
      this.scene.remove(animalObj.group);
    });
    this.animals.clear();

    this.projectiles.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.projectiles = [];

    this.droppedItems.forEach((item) => {
      this.scene.remove(item.group);
    });
    this.droppedItems = [];
  }

  public getActiveWeapon(): WeaponDefinition {
    return WEAPON_DEFINITIONS[this.currentWeaponId];
  }

  private buildPickaxeMesh() {
    while (this.playerWeaponGroup.children.length > 0) {
      this.playerWeaponGroup.remove(this.playerWeaponGroup.children[0]);
    }

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    handle.position.set(0, 0.45, 0);

    const pickMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00bbf9,
      emissiveIntensity: 1.3,
      metalness: 0.8,
      roughness: 0.15,
    });
    const headCenter = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.78), pickMat);
    headCenter.position.set(0, 1.02, 0);

    const tipFront = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), pickMat);
    tipFront.position.set(0, 0.92, 0.42);
    tipFront.rotation.x = 0.45;

    const tipBack = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), pickMat);
    tipBack.position.set(0, 0.92, -0.42);
    tipBack.rotation.x = -0.45;

    this.playerWeaponGroup.add(handle, headCenter, tipFront, tipBack);
  }

  private buildWeaponMesh(weaponId: WeaponId) {
    while (this.playerWeaponGroup.children.length > 0) {
      this.playerWeaponGroup.remove(this.playerWeaponGroup.children[0]);
    }

    const def = WEAPON_DEFINITIONS[weaponId];
    const mat = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.color,
      emissiveIntensity: 1.4,
      metalness: 0.7,
      roughness: 0.15,
    });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const auraMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    if (weaponId === 'sword') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 0.14), mat);
      blade.position.set(0, 0.7, 0);
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.32, 0.06), coreMat);
      core.position.set(0, 0.7, 0);
      const aura = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.45, 0.24), auraMat);
      aura.position.set(0, 0.72, 0);
      const hilt = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.1, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xfee440, metalness: 0.9, roughness: 0.2 })
      );
      hilt.position.set(0, 0.02, 0);
      this.playerWeaponGroup.add(blade, core, aura, hilt);
    } else if (weaponId === 'blaster') {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.18), mat);
      barrel.position.set(0, 0.25, 0);
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), coreMat);
      muzzle.position.set(0, 0.6, 0);
      const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.28, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      grip.position.set(0, -0.05, -0.12);
      this.playerWeaponGroup.add(barrel, muzzle, grip);
    } else if (weaponId === 'hammer') {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.35, 8),
        new THREE.MeshStandardMaterial({ color: 0x451a03 })
      );
      handle.position.set(0, 0.5, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.48, 0.65), mat);
      head.position.set(0, 1.15, 0);
      const headAura = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.58, 0.75), auraMat);
      headAura.position.set(0, 1.15, 0);
      this.playerWeaponGroup.add(handle, head, headAura);
    } else {
      // Bow
      const bowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.055, 8, 16, Math.PI), mat);
      bowMesh.rotation.z = -Math.PI / 2;
      bowMesh.position.set(0, 0.2, 0);
      const stringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.04, 6), coreMat);
      stringMesh.rotation.z = Math.PI / 2;
      stringMesh.position.set(0, 0.2, 0);
      this.playerWeaponGroup.add(bowMesh, stringMesh);
    }
  }

  /**
   * Spawns a Minecraft-style 3D floating & rotating dropped item in the world
   */
  public spawnDroppedMaterial(x: number, y: number, z: number, materialId: MaterialId, count: number = 1) {
    const def = MATERIAL_DEFINITIONS[materialId] || MATERIAL_DEFINITIONS.stone;
    const id = `drop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const group = new THREE.Group();

    const colHex = parseInt(def.color.replace('#', '0x'), 16) || 0x00f5d4;
    const cubeMat = new THREE.MeshStandardMaterial({
      color: colHex,
      emissive: colHex,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.5,
    });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), cubeMat);
    cube.name = 'dropCube';
    group.add(cube);

    // Outer glowing wireframe / halo
    const haloMat = new THREE.MeshBasicMaterial({
      color: colHex,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), haloMat);
    halo.name = 'dropHalo';
    group.add(halo);

    // Floating label sprite above the dropped cube
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.roundRect(8, 6, 176, 36, 10);
      ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${def.emoji} +${count} ${def.name.split(' ')[0]}`, 96, 31);
    }
    const labelTex = new THREE.CanvasTexture(canvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, depthTest: false }));
    labelSprite.position.set(0, 0.52, 0);
    labelSprite.scale.set(1.35, 0.34, 1);
    group.add(labelSprite);

    const scatterAngle = Math.random() * Math.PI * 2;
    const scatterRad = 0.25 + Math.random() * 0.35;
    group.position.set(
      x + Math.cos(scatterAngle) * scatterRad,
      y + 0.55,
      z + Math.sin(scatterAngle) * scatterRad
    );
    this.scene.add(group);

    this.droppedItems.push({
      id,
      materialId,
      count,
      group,
      vel: new THREE.Vector3(
        Math.cos(scatterAngle) * 1.8,
        3.5 + Math.random() * 1.5,
        Math.sin(scatterAngle) * 1.8
      ),
      baseY: y + 0.45,
      age: 0,
    });
  }

  // Spawn Enemy or Hostile Voxel NPC
  public spawnEnemy(type: EnemyType, x: number, y: number, z: number): EnemyEntity {
    const id = `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isBoss = type === 'void_golem';

    const nameMap: Record<EnemyType, string> = {
      glitch_corruptor: 'Glitch Corruptor',
      void_golem: 'Gólem del Vacío',
      data_specter: 'Espectro de Datos',
      cyber_spider: 'Araña Vóxel',
      npc_raider: 'Saqueador Glitch [NPC]',
      npc_shadow_knight: 'Caballero Sombra [NPC]',
      npc_corrupted_hacker: 'Invasor Corrupto [NPC]',
    };

    const hpMap: Record<EnemyType, number> = {
      void_golem: 220,
      npc_shadow_knight: 135,
      npc_raider: 95,
      npc_corrupted_hacker: 85,
      data_specter: 90,
      cyber_spider: 80,
      glitch_corruptor: 75,
    };

    const maxHp = hpMap[type] || 90;

    const data: EnemyEntity = {
      id,
      type,
      name: nameMap[type] || 'Enemigo Vóxel',
      x,
      y,
      z,
      rotationY: 0,
      hp: maxHp,
      maxHp,
      speed: type === 'cyber_spider' ? 4.2 : type === 'void_golem' ? 2.0 : 3.4,
      attackDamage: isBoss ? 26 : type === 'npc_shadow_knight' ? 20 : 14,
      attackRange: type === 'glitch_corruptor' || type === 'npc_corrupted_hacker' ? 4.5 : 2.3,
      cooldownTimer: 0,
    };

    const group = this.buildEnemyMesh(type);
    group.position.set(x, y, z);
    this.scene.add(group);

    // Floating HP Bar + Name sprite
    const hpBar = this.createFloatingHealthBar(data.hp, data.maxHp, data.name);
    hpBar.position.set(0, isBoss ? 3.4 : 2.55, 0);
    group.add(hpBar);

    this.enemies.set(id, { data, group, hpBar });
    return data;
  }

  private buildEnemyMesh(type: EnemyType): THREE.Group {
    const g = new THREE.Group();

    if (type === 'npc_raider' || type === 'npc_shadow_knight' || type === 'npc_corrupted_hacker') {
      // Humanoid Voxel Enemy NPC (Minecraft / Roblox style hostile NPC warrior)
      const isKnight = type === 'npc_shadow_knight';
      const isHacker = type === 'npc_corrupted_hacker';

      const armorColor = isKnight ? 0x18181b : isHacker ? 0x3b0764 : 0x7f1d1d;
      const accentColor = isKnight ? 0xef4444 : isHacker ? 0x00f5d4 : 0xf59e0b;
      const skinColor = isKnight ? 0x27272a : 0x64748b;

      const armorMat = new THREE.MeshStandardMaterial({
        color: armorColor,
        roughness: 0.4,
        metalness: 0.7,
      });
      const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
      const glowMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 1.4,
      });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.92, 0.42), armorMat);
      torso.position.y = 1.35;
      torso.castShadow = true;
      g.add(torso);

      // Glowing chest core
      const chestCore = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.06), glowMat);
      chestCore.position.set(0, 0.12, 0.22);
      torso.add(chestCore);

      // Head & Angry Cyber Visor
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.64, 0.64), skinMat);
      head.position.set(0, 0.8, 0);
      torso.add(head);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.18), glowMat);
      visor.position.set(0, 0.05, 0.28);
      head.add(visor);

      // Helmet / Horns
      if (isKnight) {
        const helm = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.72), armorMat);
        helm.position.set(0, 0.32, 0);
        const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 4), glowMat);
        hornL.position.set(-0.28, 0.5, 0);
        hornL.rotation.z = 0.35;
        const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 4), glowMat);
        hornR.position.set(0.28, 0.5, 0);
        hornR.rotation.z = -0.35;
        head.add(helm, hornL, hornR);
      } else {
        const hood = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), armorMat);
        hood.position.set(0, 0.3, 0);
        head.add(hood);
      }

      // Arms (Named for walking & attack animations)
      const armGeo = new THREE.BoxGeometry(0.3, 0.85, 0.3);
      armGeo.translate(0, -0.35, 0);

      const leftArm = new THREE.Group();
      leftArm.name = 'npcLeftArm';
      leftArm.position.set(-0.52, 0.35, 0);
      leftArm.add(new THREE.Mesh(armGeo, armorMat));
      torso.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.name = 'npcRightArm';
      rightArm.position.set(0.52, 0.35, 0);
      rightArm.add(new THREE.Mesh(armGeo, armorMat));
      torso.add(rightArm);

      // Weapon in NPC right hand
      const weaponMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, isHacker ? 0.55 : 1.15, 0.14),
        glowMat
      );
      weaponMesh.position.set(0, -0.7, 0.35);
      weaponMesh.rotation.x = Math.PI / 2.2;
      rightArm.add(weaponMesh);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.32, 0.9, 0.34);
      legGeo.translate(0, -0.45, 0);

      const leftLeg = new THREE.Group();
      leftLeg.name = 'npcLeftLeg';
      leftLeg.position.set(-0.2, -0.45, 0);
      leftLeg.add(new THREE.Mesh(legGeo, armorMat));
      torso.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.name = 'npcRightLeg';
      rightLeg.position.set(0.2, -0.45, 0);
      rightLeg.add(new THREE.Mesh(legGeo, armorMat));
      torso.add(rightLeg);

      return g;
    }

    if (type === 'void_golem') {
      // Giant stone colossus with magma
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9, metalness: 0.2 });
      const magmaMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xef4444,
        emissiveIntensity: 0.9,
      });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.0), stoneMat);
      body.position.y = 1.6;
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), magmaMat);
      core.position.set(0, 1.6, 0.51);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), stoneMat);
      head.position.set(0, 2.8, 0);
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), magmaMat);
      eye.position.set(0, 2.8, 0.46);

      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.6, 0.55), stoneMat);
      armL.position.set(-1.15, 1.6, 0);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.6, 0.55), stoneMat);
      armR.position.set(1.15, 1.6, 0);

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), stoneMat);
      legL.position.set(-0.5, 0.6, 0);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), stoneMat);
      legR.position.set(0.5, 0.6, 0);

      g.add(body, core, head, eye, armL, armR, legL, legR);
    } else if (type === 'glitch_corruptor') {
      // Floating purple glitch cube with red eye
      const glitchMat = new THREE.MeshStandardMaterial({
        color: 0x7e22ce,
        emissive: 0x581c87,
        roughness: 0.3,
        metalness: 0.6,
      });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), glitchMat);
      cube.position.y = 1.3;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), eyeMat);
      eye.position.set(0, 1.3, 0.56);

      // Spike ring
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 6, 16), ringMat);
      ring.position.y = 1.3;
      ring.name = 'spikeRing';

      g.add(cube, eye, ring);
    } else {
      // Data Specter / Cyber Spider
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8, roughness: 0.2 });
      const neonMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 1.2), darkMat);
      body.position.y = 0.5;

      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j++) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), neonMat);
          leg.position.set(i * 0.65, 0.35, j * 0.4);
          leg.rotation.z = i * 0.4;
          g.add(leg);
        }
      }
      g.add(body);
    }

    return g;
  }

  // Spawn Peaceful Animal (Harvestable like Minecraft)
  public spawnAnimal(type: AnimalType, x: number, y: number, z: number): AnimalEntity {
    const id = `animal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const maxHp = type === 'cyber_dog' ? 60 : 45;
    const data: AnimalEntity = {
      id,
      type,
      name:
        type === 'quantum_sheep'
          ? 'Oveja Cuántica'
          : type === 'cyber_dog'
          ? 'Lobo Cibernético'
          : type === 'neon_pig'
          ? 'Cerdito Neón'
          : 'Dron Ave',
      x,
      y,
      z,
      rotationY: Math.random() * Math.PI * 2,
      speed: 1.8,
      wanderTimer: 2.0,
      targetX: x,
      targetZ: z,
      hp: maxHp,
      maxHp,
    };

    const group = this.buildAnimalMesh(type);
    group.position.set(x, y, z);
    this.scene.add(group);

    const hpBar = this.createFloatingHealthBar(data.hp, data.maxHp, data.name);
    hpBar.position.set(0, 1.75, 0);
    group.add(hpBar);

    this.animals.set(id, { data, group, hpBar });
    return data;
  }

  private buildAnimalMesh(type: AnimalType): THREE.Group {
    const g = new THREE.Group();

    if (type === 'quantum_sheep') {
      const woolMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.9 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.1), woolMat);
      body.position.y = 0.8;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.5), skinMat);
      head.position.set(0, 1.0, 0.65);

      for (let x = -0.3; x <= 0.3; x += 0.6) {
        for (let z = -0.35; z <= 0.35; z += 0.7) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), skinMat);
          leg.position.set(x, 0.25, z);
          g.add(leg);
        }
      }
      g.add(body, head);
    } else if (type === 'cyber_dog') {
      const coatMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
      const collarMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.9), coatMat);
      body.position.y = 0.65;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), coatMat);
      head.position.set(0, 0.85, 0.5);
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.42), collarMat);
      collar.position.set(0, 0.75, 0.38);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), coatMat);
      tail.position.set(0, 0.8, -0.5);
      tail.rotation.x = -0.5;

      for (let x = -0.22; x <= 0.22; x += 0.44) {
        for (let z = -0.3; z <= 0.3; z += 0.6) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), coatMat);
          leg.position.set(x, 0.22, z);
          g.add(leg);
        }
      }
      g.add(body, head, collar, tail);
    } else {
      // Neon pig
      const pigMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 });
      const snoutMat = new THREE.MeshStandardMaterial({ color: 0xdb2777 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.95), pigMat);
      body.position.y = 0.6;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.45), pigMat);
      head.position.set(0, 0.75, 0.55);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.1), snoutMat);
      snout.position.set(0, 0.68, 0.8);

      for (let x = -0.25; x <= 0.25; x += 0.5) {
        for (let z = -0.3; z <= 0.3; z += 0.6) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), pigMat);
          leg.position.set(x, 0.18, z);
          g.add(leg);
        }
      }
      g.add(body, head, snout);
    }

    return g;
  }

  // Create floating health bar + name label over enemy or animal
  private createFloatingHealthBar(hp: number, maxHp: number, labelName?: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 44;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.Sprite();
    }

    this.drawHealthBarCanvas(ctx, hp, maxHp, labelName);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.85, 0.42, 1);
    sprite.userData = { labelName: labelName || '' };
    return sprite;
  }

  private drawHealthBarCanvas(
    ctx: CanvasRenderingContext2D,
    hp: number,
    maxHp: number,
    labelName?: string
  ) {
    ctx.clearRect(0, 0, 192, 44);
    if (labelName) {
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.strokeText(labelName, 96, 14);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(labelName, 96, 14);
    }

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.roundRect(16, 20, 160, 18, 6);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // HP Bar Fill
    const pct = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.roundRect(18, 22, 156 * pct, 14, 4);
    ctx.fill();
  }

  private updateEnemyHealthBar(sprite: THREE.Sprite, hp: number, maxHp: number) {
    const canvas = (sprite.material as THREE.SpriteMaterial).map?.image as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.drawHealthBarCanvas(ctx, hp, maxHp, sprite.userData?.labelName);
        (sprite.material as THREE.SpriteMaterial).map!.needsUpdate = true;
      }
    }
  }

  // Trigger enemy or animal hit flash & squash-stretch jolt
  private triggerEnemyHitVisual(group: THREE.Group) {
    group.scale.set(1.28, 0.8, 1.28);
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && !Array.isArray(mesh.material)) {
          const origMat = mesh.userData.origMat || mesh.material;
          mesh.userData.origMat = origMat;
          mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
          setTimeout(() => {
            if (mesh.userData.origMat) {
              mesh.material = mesh.userData.origMat;
            }
          }, 120);
        }
      }
    });
  }

  private buildProjectileMesh(weaponId: WeaponId, colorStr: string): THREE.Group {
    const group = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const auraMat = new THREE.MeshBasicMaterial({
      color: colorStr,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    if (weaponId === 'blaster') {
      // Elongated plasma bolt + glowing halo
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8), coreMat);
      core.rotation.x = Math.PI / 2;
      const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.35, 8), auraMat);
      aura.rotation.x = Math.PI / 2;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), auraMat);
      head.position.z = 0.5;
      group.add(core, aura, head);
    } else {
      // Photon Arrow (Rose-Gold light shaft + arrowhead + energy fins)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), coreMat);
      shaft.rotation.x = Math.PI / 2;
      const auraShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.5, 6), auraMat);
      auraShaft.rotation.x = Math.PI / 2;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 6), auraMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.z = 0.75;
      group.add(shaft, auraShaft, tip);
    }

    return group;
  }

  /**
   * When the player uses the Pickaxe in 'mine' mode, checks if an enemy or animal is within melee reach first.
   */
  public mineCreatureAt(playerPos: THREE.Vector3, cameraDir: THREE.Vector3): boolean {
    let hitSomething = false;
    const range = 4.2;

    if (this.particleManager) {
      this.particleManager.spawnSlashArc(
        playerPos.x,
        playerPos.y + 1.25,
        playerPos.z,
        cameraDir,
        0x00f5d4,
        1.1,
        0.55
      );
    }

    // Check enemies
    this.enemies.forEach((enemyObj) => {
      const { data, group, hpBar } = enemyObj;
      if (data.isDead) return;
      const dist = Math.hypot(data.x - playerPos.x, data.z - playerPos.z);
      if (dist <= range && Math.abs(data.y - playerPos.y) < 3.0) {
        hitSomething = true;
        const dmg = Math.round(28 * this.weaponDamageMultiplier);
        data.hp -= dmg;
        sound.playPositionalEnemyHit(data.x, data.y + 1.2, data.z);
        this.triggerEnemyHitVisual(group);
        this.spawnDamageNumber(data.x, data.y + 2.0, data.z, dmg, false, false);
        this.particleManager?.spawnWeaponHit(data.x, data.y + 1.2, data.z, 'sword', false);
        const angle = Math.atan2(data.x - playerPos.x, data.z - playerPos.z);
        data.x += Math.sin(angle) * 1.2;
        data.z += Math.cos(angle) * 1.2;
        this.updateEnemyHealthBar(hpBar, data.hp, data.maxHp);
        if (data.hp <= 0) {
          this.defeatEnemy(data.id);
        }
      }
    });

    // Check animals
    this.animals.forEach((animalObj) => {
      const { data, group, hpBar } = animalObj;
      const dist = Math.hypot(data.x - playerPos.x, data.z - playerPos.z);
      if (dist <= range && Math.abs(data.y - playerPos.y) < 3.0) {
        hitSomething = true;
        const dmg = Math.round(25 * this.weaponDamageMultiplier);
        this.damageAnimal(data, group, hpBar, dmg, playerPos);
      }
    });

    return hitSomething;
  }

  private damageAnimal(
    data: AnimalEntity,
    group: THREE.Group,
    hpBar: THREE.Sprite,
    dmg: number,
    attackerPos: THREE.Vector3
  ) {
    data.hp -= dmg;
    sound.playPositionalEnemyHit(data.x, data.y + 0.8, data.z);
    this.triggerEnemyHitVisual(group);
    this.spawnDamageNumber(data.x, data.y + 1.6, data.z, dmg, false, false);
    this.particleManager?.spawnSparks(data.x, data.y + 0.8, data.z, 0xfee440, 16, 6.0);

    // Panic flee away from player (Minecraft style)
    const angle = Math.atan2(data.x - attackerPos.x, data.z - attackerPos.z);
    data.x += Math.sin(angle) * 1.2;
    data.z += Math.cos(angle) * 1.2;
    data.targetX = data.x + Math.sin(angle) * 10;
    data.targetZ = data.z + Math.cos(angle) * 10;
    data.speed = 3.8;
    data.wanderTimer = 3.0;

    this.updateEnemyHealthBar(hpBar, data.hp, data.maxHp);

    if (data.hp <= 0) {
      this.harvestAnimal(data.id);
    }
  }

  private harvestAnimal(animalId: string) {
    const animalObj = this.animals.get(animalId);
    if (!animalObj) return;
    const { data, group } = animalObj;

    sound.playPointCollect();
    this.creatureAudioTimers.delete(animalId);
    if (this.particleManager) {
      this.particleManager.spawnMagic(data.x, data.y + 0.8, data.z, 0x38bdf8, 18, 4.0);
      this.particleManager.spawnRing(data.x, data.y + 0.5, data.z, 0xfee440, 2.2);
    }

    // Spawn Minecraft-style 3D item drops for the harvested animal
    const drops = getAnimalDrops(data.type);
    drops.forEach((drop) => {
      this.spawnDroppedMaterial(data.x, data.y, data.z, drop.materialId, drop.count);
    });

    this.scene.remove(group);
    this.animals.delete(animalId);

    if (this.onAnimalHarvested) {
      this.onAnimalHarvested(data, 60);
    }

    // Respawn a new animal nearby after 12 seconds so the ecosystem stays populated
    const respawnType = data.type;
    const rx = data.x + (Math.random() - 0.5) * 14;
    const rz = data.z + (Math.random() - 0.5) * 14;
    setTimeout(() => {
      if (this.animals.size < 35) {
        this.spawnAnimal(respawnType, rx, 2, rz);
      }
    }, 12000);
  }

  // Player performs an attack with current weapon
  public playerAttack(
    playerPos: THREE.Vector3,
    cameraDir: THREE.Vector3
  ): { hitEnemiesCount: number; damageDealt: number; weaponId: WeaponId } {
    const weapon = WEAPON_DEFINITIONS[this.currentWeaponId];
    let hitCount = 0;
    let totalDmg = 0;

    // Swing weapon visual pulse
    this.playerWeaponGroup.scale.set(1.35, 1.35, 1.35);
    setTimeout(() => {
      this.playerWeaponGroup.scale.set(1.0, 1.0, 1.0);
    }, 180);

    if (weapon.type === 'melee') {
      if (weapon.id === 'sword') {
        sound.playSwordSlash();
        this.slashComboDir = -this.slashComboDir;
        if (this.particleManager) {
          this.particleManager.spawnSlashArc(
            playerPos.x,
            playerPos.y + 1.25,
            playerPos.z,
            cameraDir,
            0x00f5d4,
            1.35,
            this.slashComboDir * 0.42
          );
        }
      } else {
        sound.playHammerSmash();
        if (this.particleManager) {
          // Overhead vertical energy arc + colossal ground slam shockwave
          this.particleManager.spawnSlashArc(
            playerPos.x,
            playerPos.y + 1.4,
            playerPos.z,
            cameraDir,
            0xf59e0b,
            1.55,
            Math.PI * 0.48
          );
          this.particleManager.spawnHammerSlam(
            playerPos.x + cameraDir.x * 2.2,
            playerPos.y,
            playerPos.z + cameraDir.z * 2.2
          );
        }
      }

      // Check all enemies within melee range & arc
      this.enemies.forEach((enemyObj) => {
        const { data, group, hpBar } = enemyObj;
        if (data.isDead) return;

        const dist = Math.hypot(data.x - playerPos.x, data.z - playerPos.z);
        if (dist <= weapon.range && Math.abs(data.y - playerPos.y) < 3.0) {
          // Hit enemy!
          const isCrit = Math.random() > 0.6;
          const baseDmg = (weapon.damage + Math.floor(Math.random() * 8)) * this.weaponDamageMultiplier;
          const dmg = Math.round(isCrit ? baseDmg * 1.35 : baseDmg);
          data.hp -= dmg;
          hitCount++;
          totalDmg += dmg;

          sound.playPositionalEnemyHit(data.x, data.y + 1.2, data.z);
          this.triggerEnemyHitVisual(group);
          this.spawnDamageNumber(data.x, data.y + 2.0, data.z, dmg, false, isCrit);

          if (this.particleManager) {
            this.particleManager.spawnWeaponHit(data.x, data.y + 1.2, data.z, weapon.id, isCrit);
            this.particleManager.spawnEnemyDamaged(data.x, data.y + 1.2, data.z, data.type);
          } else {
            this.voxelEngine.spawnCelebrationParticles(data.x, data.y + 1.2, data.z);
          }

          // Knockback
          const knockbackForce = weapon.id === 'hammer' ? 2.2 : 1.45;
          const angle = Math.atan2(data.x - playerPos.x, data.z - playerPos.z);
          data.x += Math.sin(angle) * knockbackForce;
          data.z += Math.cos(angle) * knockbackForce;

          this.updateEnemyHealthBar(hpBar, data.hp, data.maxHp);

          if (data.hp <= 0) {
            this.defeatEnemy(data.id);
          }
        }
      });

      // Also check animals within melee range (Minecraft style harvesting)
      this.animals.forEach((animalObj) => {
        const { data, group, hpBar } = animalObj;
        const dist = Math.hypot(data.x - playerPos.x, data.z - playerPos.z);
        if (dist <= weapon.range && Math.abs(data.y - playerPos.y) < 3.0) {
          const dmg = Math.round(weapon.damage * this.weaponDamageMultiplier);
          hitCount++;
          totalDmg += dmg;
          this.damageAnimal(data, group, hpBar, dmg, playerPos);
        }
      });
    } else {
      // Ranged projectile
      if (weapon.id === 'blaster') sound.playLaserBlaster();
      else sound.playBowShoot();

      const colHex = weapon.id === 'blaster' ? 0x38bdf8 : 0xf43f5e;
      const forwardDir = cameraDir.clone().normalize();
      const spawnPos = new THREE.Vector3(
        playerPos.x + forwardDir.x * 1.1,
        playerPos.y + 1.4,
        playerPos.z + forwardDir.z * 1.1
      );

      if (this.particleManager) {
        this.particleManager.spawnMuzzleFlash(spawnPos.x, spawnPos.y, spawnPos.z, forwardDir, colHex);
      }

      const mesh = this.buildProjectileMesh(weapon.id, weapon.color);
      mesh.position.copy(spawnPos);
      mesh.lookAt(spawnPos.clone().add(forwardDir));
      this.scene.add(mesh);

      const speed = weapon.id === 'bow' ? 34 : 30;
      const vel = forwardDir.multiplyScalar(speed);

      this.projectiles.push({
        mesh,
        vel,
        damage: Math.round(weapon.damage * this.weaponDamageMultiplier),
        life: 0,
        maxLife: 1.6,
        weaponId: weapon.id,
        trailTimer: 0,
      });
    }

    return { hitEnemiesCount: hitCount, damageDealt: totalDmg, weaponId: weapon.id };
  }

  private defeatEnemy(enemyId: string) {
    const enemyObj = this.enemies.get(enemyId);
    if (!enemyObj) return;

    const { data, group } = enemyObj;
    data.isDead = true;

    sound.playPositionalMonsterDefeat(data.x, data.y + 1.2, data.z, data.type);
    this.creatureAudioTimers.delete(enemyId);
    if (this.particleManager) {
      this.particleManager.spawnEnemyDefeated(data.x, data.y + 1.2, data.z, data.type);
    } else {
      this.voxelEngine.spawnCelebrationParticles(data.x, data.y + 1.2, data.z);
    }

    // Spawn 3D floating loot drops for the defeated enemy / NPC
    const drops = getEnemyDrops(data.type);
    drops.forEach((drop) => {
      this.spawnDroppedMaterial(data.x, data.y, data.z, drop.materialId, drop.count);
    });

    this.scene.remove(group);
    this.enemies.delete(enemyId);

    const reward = data.type === 'void_golem' ? 350 : data.type.startsWith('npc_') ? 180 : 120;
    if (this.onEnemyDefeated) {
      this.onEnemyDefeated(data, reward);
    }

    // Respawn enemy / NPC after 18s to keep the world dynamic
    const respawnType = data.type;
    const rx = data.x + (Math.random() - 0.5) * 16;
    const rz = data.z + (Math.random() - 0.5) * 16;
    setTimeout(() => {
      if (this.enemies.size < 35) {
        this.spawnEnemy(respawnType, rx, 2, rz);
      }
    }, 18000);
  }

  private spawnDamageNumber(
    x: number,
    y: number,
    z: number,
    dmg: number,
    isPlayer: boolean,
    isCrit: boolean = false
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const label = isCrit ? `¡CRIT! -${dmg}` : `-${dmg}`;
    ctx.font = isCrit ? '900 44px sans-serif' : '900 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeText(label, 128, 62);

    ctx.fillStyle = isPlayer ? '#ef4444' : isCrit ? '#00f5d4' : '#fee440';
    ctx.fillText(label, 128, 62);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
    const offsetX = (Math.random() - 0.5) * 0.6;
    const offsetZ = (Math.random() - 0.5) * 0.6;
    sprite.position.set(x + offsetX, y, z + offsetZ);
    const baseScaleX = isCrit ? 2.4 : 1.85;
    const baseScaleY = isCrit ? 0.9 : 0.7;
    sprite.scale.set(baseScaleX * 1.4, baseScaleY * 1.4, 1);
    this.scene.add(sprite);

    this.floatingTexts.push({
      sprite,
      velY: 2.6,
      life: 0,
      maxLife: 0.95,
      baseScaleX,
      baseScaleY,
    });
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    // 1. Update Projectiles & Glowing Flight Trails
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;
      p.trailTimer += dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      if (this.particleManager && p.trailTimer >= 0.022) {
        p.trailTimer = 0;
        const colHex = p.weaponId === 'blaster' ? 0x38bdf8 : 0xf43f5e;
        this.particleManager.spawnProjectileTrail(
          p.mesh.position.x,
          p.mesh.position.y,
          p.mesh.position.z,
          colHex,
          p.weaponId === 'bow'
        );
      }

      // Check collision with solid voxels
      const bx = Math.floor(p.mesh.position.x);
      const by = Math.floor(p.mesh.position.y);
      const bz = Math.floor(p.mesh.position.z);
      if (this.voxelEngine.hasSolidBlock(bx, by, bz) || p.life >= p.maxLife) {
        if (this.voxelEngine.hasSolidBlock(bx, by, bz)) {
          sound.playPositionalImpact(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, p.weaponId);
          if (this.particleManager) {
            this.particleManager.spawnWeaponHit(
              p.mesh.position.x,
              p.mesh.position.y,
              p.mesh.position.z,
              p.weaponId,
              false
            );
          }
        }
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies
      let hit = false;
      this.enemies.forEach((enemyObj) => {
        if (hit) return;
        const { data, group, hpBar } = enemyObj;
        if (data.isDead) return;

        const dist = p.mesh.position.distanceTo(new THREE.Vector3(data.x, data.y + 1, data.z));
        if (dist < 1.65) {
          hit = true;
          const isCrit = Math.random() > 0.65;
          const baseDmg = p.damage + Math.floor(Math.random() * 6);
          const dmg = isCrit ? Math.round(baseDmg * 1.35) : baseDmg;
          data.hp -= dmg;
          sound.playPositionalEnemyHit(data.x, data.y + 1.0, data.z);
          this.triggerEnemyHitVisual(group);
          this.spawnDamageNumber(data.x, data.y + 2.0, data.z, dmg, false, isCrit);

          if (this.particleManager) {
            this.particleManager.spawnWeaponHit(data.x, data.y + 1.0, data.z, p.weaponId, isCrit);
            this.particleManager.spawnEnemyDamaged(data.x, data.y + 1.0, data.z, data.type);
          } else {
            this.voxelEngine.spawnCelebrationParticles(data.x, data.y + 1.0, data.z);
          }

          // Projectile knockback
          const angle = Math.atan2(p.vel.x, p.vel.z);
          data.x += Math.sin(angle) * 0.9;
          data.z += Math.cos(angle) * 0.9;

          this.updateEnemyHealthBar(hpBar, data.hp, data.maxHp);

          if (data.hp <= 0) {
            this.defeatEnemy(data.id);
          }
        }
      });

      // Check collision with animals (ranged hunting)
      if (!hit) {
        this.animals.forEach((animalObj) => {
          if (hit) return;
          const { data, group, hpBar } = animalObj;
          const dist = p.mesh.position.distanceTo(new THREE.Vector3(data.x, data.y + 0.8, data.z));
          if (dist < 1.45) {
            hit = true;
            this.damageAnimal(data, group, hpBar, p.damage, playerPos);
          }
        });
      }

      if (hit) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Floating Damage Numbers (Pop-in scale & fade)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.sprite.position.y += ft.velY * dt;
      const progress = ft.life / ft.maxLife;
      const pop = progress < 0.2 ? THREE.MathUtils.lerp(1.5, 1.0, progress / 0.2) : 1.0;
      ft.sprite.scale.set(ft.baseScaleX * pop, ft.baseScaleY * pop, 1);
      (ft.sprite.material as THREE.SpriteMaterial).opacity = progress > 0.7 ? 1.0 - (progress - 0.7) / 0.3 : 1.0;
      if (ft.life >= ft.maxLife) {
        this.scene.remove(ft.sprite);
        this.floatingTexts.splice(i, 1);
      }
    }

    // 2.5 Update 3D Dropped Items (Minecraft-style bobbing, spinning & magnetic pickup)
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      item.age += dt;

      // Rotate cube & halo
      const cube = item.group.getObjectByName('dropCube');
      const halo = item.group.getObjectByName('dropHalo');
      if (cube) {
        cube.rotation.y += dt * 3.2;
        cube.rotation.x += dt * 1.4;
      }
      if (halo) {
        halo.rotation.y -= dt * 2.5;
      }

      // Initial pop physics for first 0.35s
      if (item.age < 0.35) {
        item.vel.y -= 15 * dt;
        item.group.position.addScaledVector(item.vel, dt);
        if (item.group.position.y < item.baseY) {
          item.group.position.y = item.baseY;
        }
      } else {
        // Gentle vertical bobbing
        item.group.position.y = item.baseY + Math.sin(item.age * 4.5) * 0.14;
      }

      // Magnetic pull toward player when within 5.5 blocks (or auto-collect after 0.4s if close)
      const targetPos = new THREE.Vector3(playerPos.x, playerPos.y + 1.0, playerPos.z);
      const distToPlayer = item.group.position.distanceTo(targetPos);

      if (item.age > 0.3 && distToPlayer < 6.5) {
        const pullDir = targetPos.sub(item.group.position).normalize();
        const pullSpeed = 12.0 + (6.5 - distToPlayer) * 2.5;
        item.group.position.addScaledVector(pullDir, pullSpeed * dt);

        if (distToPlayer < 1.15) {
          // Collected!
          sound.playPointCollect();
          this.particleManager?.spawnSparks(playerPos.x, playerPos.y + 1.1, playerPos.z, 0xfee440, 10, 4.5);
          if (this.onMaterialCollected) {
            this.onMaterialCollected(item.materialId, item.count);
          }
          this.scene.remove(item.group);
          this.droppedItems.splice(i, 1);
          continue;
        }
      }

      // Despawn after 60s if uncollected
      if (item.age > 60) {
        this.scene.remove(item.group);
        this.droppedItems.splice(i, 1);
      }
    }

    // 3. Update Enemies & Hostile NPCs AI & Attacks
    this.enemies.forEach((enemyObj) => {
      const { data, group } = enemyObj;
      if (data.isDead) return;

      // Smoothly recover enemy scale after hit jolt
      group.scale.x = THREE.MathUtils.damp(group.scale.x, 1.0, 14, dt);
      group.scale.y = THREE.MathUtils.damp(group.scale.y, 1.0, 14, dt);
      group.scale.z = THREE.MathUtils.damp(group.scale.z, 1.0, 14, dt);

      let timers = this.creatureAudioTimers.get(data.id);
      if (!timers) {
        timers = {
          growlTimer: 1.5 + Math.random() * 4.0,
          stepTimer: 0.4 + Math.random() * 0.2,
        };
        this.creatureAudioTimers.set(data.id, timers);
      }

      // Animate floating rings or hovering
      const ring = group.getObjectByName('spikeRing');
      if (ring) ring.rotation.z += dt * 4;

      // NPC limb references for walking/attacking animations
      const npcLeftArm = group.getObjectByName('npcLeftArm');
      const npcRightArm = group.getObjectByName('npcRightArm');
      const npcLeftLeg = group.getObjectByName('npcLeftLeg');
      const npcRightLeg = group.getObjectByName('npcRightLeg');

      const distToPlayer = Math.hypot(data.x - playerPos.x, data.z - playerPos.z);

      // Positional growls / roars when player is within audible distance
      if (distToPlayer < 45) {
        timers.growlTimer -= dt;
        if (timers.growlTimer <= 0) {
          timers.growlTimer = distToPlayer < 14 ? (3.5 + Math.random() * 3.0) : (6.5 + Math.random() * 5.0);
          sound.playPositionalGrowl(data.x, data.y + 1.2, data.z, data.type);
        }
      }

      // Aggro Range check (18 blocks)
      if (distToPlayer < 18) {
        // Face player
        const angle = Math.atan2(playerPos.x - data.x, playerPos.z - data.z);
        data.rotationY = angle;

        // Move towards player if not in attack range
        if (distToPlayer > data.attackRange) {
          const moveSpeed = data.speed * this.weatherSpeedMultiplier;
          data.x += Math.sin(angle) * moveSpeed * dt;
          data.z += Math.cos(angle) * moveSpeed * dt;

          // Animate NPC walking legs & arms
          const walkTime = Date.now() * 0.01;
          if (npcLeftLeg && npcRightLeg) {
            npcLeftLeg.rotation.x = Math.sin(walkTime) * 0.65;
            npcRightLeg.rotation.x = -Math.sin(walkTime) * 0.65;
          }
          if (npcLeftArm && npcRightArm) {
            npcLeftArm.rotation.x = -Math.sin(walkTime) * 0.5;
            npcRightArm.rotation.x = -0.6 + Math.sin(walkTime) * 0.4;
          }

          // Enemy footsteps / heavy stomps
          timers.stepTimer -= dt;
          if (timers.stepTimer <= 0) {
            timers.stepTimer = data.type === 'void_golem' ? 0.65 : 0.38;
            const surface = data.type === 'void_golem' ? 'stone' : 'neon_cyan';
            sound.playPositionalFootstep(data.x, data.y, data.z, surface, true);
          }
        } else {
          // Attack player!
          if (npcLeftLeg && npcRightLeg) {
            npcLeftLeg.rotation.x = 0;
            npcRightLeg.rotation.x = 0;
          }
          data.cooldownTimer -= dt;
          if (npcRightArm) {
            // Raise & swing weapon arm during attack cooldown
            npcRightArm.rotation.x = data.cooldownTimer > 1.2 ? -0.3 : -1.45;
          }
          if (data.cooldownTimer <= 0) {
            data.cooldownTimer = 1.6;
            sound.playPlayerHurt();
            this.spawnDamageNumber(playerPos.x, playerPos.y + 1.5, playerPos.z, data.attackDamage, true);
            if (this.particleManager) {
              this.particleManager.spawnPlayerHit(playerPos.x, playerPos.y, playerPos.z);
            }
            if (this.onPlayerDamaged) {
              this.onPlayerDamaged(data.attackDamage, data.name);
            }
          }
        }
      } else {
        // Gentle idle patrol for NPCs when player is far
        data.wanderTimer = (data.wanderTimer ?? 2.0) - dt;
        if (data.wanderTimer <= 0) {
          data.wanderTimer = 3.0 + Math.random() * 3.0;
          data.rotationY = Math.random() * Math.PI * 2;
        }
        data.x += Math.sin(data.rotationY) * 0.8 * dt;
        data.z += Math.cos(data.rotationY) * 0.8 * dt;
      }

      // Check ground height
      const bx = Math.floor(data.x);
      const bz = Math.floor(data.z);
      let groundY = 0;
      for (let y = 35; y >= -10; y--) {
        if (this.voxelEngine.hasSolidBlock(bx, y, bz)) {
          groundY = y + 1;
          break;
        }
      }
      data.y = groundY;

      group.position.set(data.x, data.y, data.z);
      group.rotation.y = data.rotationY;
    });

    // 4. Update Peaceful Animals
    this.animals.forEach((animalObj) => {
      const { data, group } = animalObj;

      // Smoothly recover animal scale after hit jolt
      group.scale.x = THREE.MathUtils.damp(group.scale.x, 1.0, 14, dt);
      group.scale.y = THREE.MathUtils.damp(group.scale.y, 1.0, 14, dt);
      group.scale.z = THREE.MathUtils.damp(group.scale.z, 1.0, 14, dt);

      let aTimers = this.creatureAudioTimers.get(data.id);
      if (!aTimers) {
        aTimers = {
          growlTimer: 3.5 + Math.random() * 5.0,
          stepTimer: 0.45,
        };
        this.creatureAudioTimers.set(data.id, aTimers);
      }

      data.wanderTimer -= dt;

      if (data.wanderTimer <= 0) {
        data.wanderTimer = 3.0 + Math.random() * 4.0;
        data.speed = 1.8; // Reset panic speed
        data.targetX = data.x + (Math.random() - 0.5) * 16;
        data.targetZ = data.z + (Math.random() - 0.5) * 16;
      }

      const dist = Math.hypot(data.targetX - data.x, data.targetZ - data.z);
      if (dist > 0.2) {
        const angle = Math.atan2(data.targetX - data.x, data.targetZ - data.z);
        const animalSpeed = data.speed * this.weatherSpeedMultiplier;
        data.x += Math.sin(angle) * animalSpeed * dt;
        data.z += Math.cos(angle) * animalSpeed * dt;
        data.rotationY = angle;

        // Animal gentle footsteps
        aTimers.stepTimer -= dt;
        if (aTimers.stepTimer <= 0) {
          aTimers.stepTimer = 0.46;
          sound.playPositionalFootstep(data.x, data.y, data.z, 'grass', true);
        }
      }

      // Periodic ambient animal noises (bark, bleat, cluck)
      aTimers.growlTimer -= dt;
      if (aTimers.growlTimer <= 0) {
        aTimers.growlTimer = 7.0 + Math.random() * 7.0;
        sound.playPositionalAnimalSound(data.x, data.y + 0.6, data.z, data.type);
      }

      // Check ground height
      const bx = Math.floor(data.x);
      const bz = Math.floor(data.z);
      let groundY = 0;
      for (let y = 35; y >= -10; y--) {
        if (this.voxelEngine.hasSolidBlock(bx, y, bz)) {
          groundY = y + 1;
          break;
        }
      }
      data.y = groundY;

      group.position.set(data.x, data.y, data.z);
      group.rotation.y = data.rotationY;
    });

    // 5. Only update world-space weapon position if not parented to character arm
    if (!this.isAttachedToArm) {
      this.playerWeaponGroup.position.set(
        playerPos.x + 0.35,
        playerPos.y + 1.1,
        playerPos.z + 0.2
      );
    }
  }
}
