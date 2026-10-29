/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockId, VoxelWorldData, VoxelPosition } from '../types/game';
import { BLOCK_DEFINITIONS, getBlockMaterial, updateEmissiveBlockMaterials } from './blockDefinitions';
import { ParticleManager } from './particleManager';

export interface RaycastHitResult {
  hitCoord: VoxelPosition;
  placeCoord: VoxelPosition;
  normal: THREE.Vector3;
  blockId: BlockId;
}

export interface ParticleParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class VoxelEngine {
  public scene: THREE.Scene;
  public worldData: VoxelWorldData;
  public instancedMeshes: Map<BlockId, THREE.InstancedMesh> = new Map();
  public interactiveCoordSet: Set<string> = new Set();
  public worldGroup: THREE.Group;
  public particlesGroup: THREE.Group;
  public activeParticles: ParticleParticle[] = [];
  public particleManager?: ParticleManager;

  // Reusable shared box geometry
  private boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  private particleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

  // Wireframe highlight box for placement preview
  public targetBoxWireframe: THREE.LineSegments;
  public placeBoxWireframe: THREE.LineSegments;

  // 3D Block Mining Cracks
  private crackCanvas: HTMLCanvasElement;
  private crackCtx: CanvasRenderingContext2D | null;
  private crackTexture: THREE.CanvasTexture;
  public crackMesh: THREE.Mesh;
  private currentCrackStage: number = -1;

  // Torch & Light Block Dynamic Illumination
  private torchLightsGroup: THREE.Group;
  private torchLights: THREE.PointLight[] = [];

  // Temporary matrix for instancing updates
  private _tempMat4 = new THREE.Matrix4();

  constructor(scene: THREE.Scene, initialWorld: VoxelWorldData) {
    this.scene = scene;
    this.worldData = initialWorld;
    this.worldGroup = new THREE.Group();
    this.worldGroup.name = 'VoxelWorld';
    this.scene.add(this.worldGroup);

    this.particlesGroup = new THREE.Group();
    this.particlesGroup.name = 'Particles';
    this.scene.add(this.particlesGroup);

    this.torchLightsGroup = new THREE.Group();
    this.torchLightsGroup.name = 'TorchLights';
    this.scene.add(this.torchLightsGroup);

    // Wireframes for targeting
    const targetWireGeo = new THREE.WireframeGeometry(this.boxGeometry);
    this.targetBoxWireframe = new THREE.LineSegments(
      targetWireGeo,
      new THREE.LineBasicMaterial({ color: 0xff0055, linewidth: 2 })
    );
    this.targetBoxWireframe.visible = false;
    this.scene.add(this.targetBoxWireframe);

    const placeWireGeo = new THREE.WireframeGeometry(this.boxGeometry);
    this.placeBoxWireframe = new THREE.LineSegments(
      placeWireGeo,
      new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 })
    );
    this.placeBoxWireframe.visible = false;
    this.scene.add(this.placeBoxWireframe);

    // 3D Minecraft-style Block Cracking Overlay Mesh
    this.crackCanvas = document.createElement('canvas');
    this.crackCanvas.width = 128;
    this.crackCanvas.height = 128;
    this.crackCtx = this.crackCanvas.getContext('2d');
    this.crackTexture = new THREE.CanvasTexture(this.crackCanvas);
    this.crackTexture.magFilter = THREE.NearestFilter;
    this.crackTexture.minFilter = THREE.NearestFilter;

    const crackMat = new THREE.MeshBasicMaterial({
      map: this.crackTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.004, 1.004, 1.004), crackMat);
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);

    this.buildWorld();
  }

  public loadWorld(newWorld: VoxelWorldData) {
    this.worldData = newWorld;
    this.buildWorld();
  }

  public buildWorld() {
    // Clear existing instanced meshes
    this.instancedMeshes.forEach((mesh) => {
      this.worldGroup.remove(mesh);
      mesh.dispose();
    });
    this.instancedMeshes.clear();
    this.interactiveCoordSet.clear();

    // 1. Group coordinates by BlockId
    const groups = new Map<BlockId, VoxelPosition[]>();

    for (const [key, blockId] of Object.entries(this.worldData.blocks)) {
      if (blockId === 'air') continue;
      const [x, y, z] = key.split(',').map(Number);
      if (isNaN(x) || isNaN(y) || isNaN(z)) continue;

      let list = groups.get(blockId);
      if (!list) {
        list = [];
        groups.set(blockId, list);
      }
      list.push({ x, y, z });

      const def = BLOCK_DEFINITIONS[blockId];
      if (def?.isInteractive || this.worldData.scripts[key]) {
        this.interactiveCoordSet.add(key);
      }
    }

    // 2. Create optimized GPU InstancedMesh for each block type (1 draw call per block type)
    groups.forEach((coords, blockId) => {
      if (coords.length === 0) return;

      const mat = getBlockMaterial(blockId);
      const instancedMesh = new THREE.InstancedMesh(this.boxGeometry, mat, coords.length);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      coords.forEach((c, idx) => {
        this._tempMat4.setPosition(c.x + 0.5, c.y + 0.5, c.z + 0.5);
        instancedMesh.setMatrixAt(idx, this._tempMat4);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.userData = { blockId, coords };

      this.worldGroup.add(instancedMesh);
      this.instancedMeshes.set(blockId, instancedMesh);
    });

    // 3. Torch & Light Block Point Lights (Dynamic real-time illumination)
    while (this.torchLights.length > 0) {
      const l = this.torchLights.pop();
      if (l) {
        this.torchLightsGroup.remove(l);
        l.dispose();
      }
    }
    const torchCoords = groups.get('light_block') || [];
    const maxLights = Math.min(18, torchCoords.length);
    for (let i = 0; i < maxLights; i++) {
      const c = torchCoords[i];
      const light = new THREE.PointLight(0xffb703, 3.2, 16, 1.8);
      light.position.set(c.x + 0.5, c.y + 1.2, c.z + 0.5);
      this.torchLightsGroup.add(light);
      this.torchLights.push(light);
    }
  }

  public setBlock(x: number, y: number, z: number, blockId: BlockId): boolean {
    const key = `${x},${y},${z}`;
    const oldBlock = this.worldData.blocks[key];

    if (blockId === 'air') {
      if (oldBlock && oldBlock !== 'air') {
        if (this.particleManager) {
          this.particleManager.spawnBlockBreak(x + 0.5, y + 0.5, z + 0.5, oldBlock);
        } else {
          this.spawnBlockDebris(x + 0.5, y + 0.5, z + 0.5, oldBlock);
        }
        delete this.worldData.blocks[key];
        delete this.worldData.scripts[key];
        this.interactiveCoordSet.delete(key);
        this.buildWorld();
        return true;
      }
      return false;
    }

    // Placing block
    if (this.particleManager) {
      this.particleManager.spawnBlockPlace(x + 0.5, y + 0.5, z + 0.5, blockId);
    }

    this.worldData.blocks[key] = blockId;
    const def = BLOCK_DEFINITIONS[blockId];
    if (def?.isInteractive || this.worldData.scripts[key]) {
      this.interactiveCoordSet.add(key);
    }
    this.buildWorld();
    return true;
  }

  public getBlock(x: number, y: number, z: number): BlockId {
    return this.worldData.blocks[`${x},${y},${z}`] || 'air';
  }

  public hasSolidBlock(x: number, y: number, z: number): boolean {
    const b = this.getBlock(x, y, z);
    return b !== 'air' && b !== 'data_water';
  }

  public raycastBlock(raycaster: THREE.Raycaster): RaycastHitResult | null {
    const intersects = raycaster.intersectObjects(this.worldGroup.children, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.object && hit.point && hit.face && hit.instanceId !== undefined) {
        const uData = hit.object.userData;
        if (uData?.coords && uData.coords[hit.instanceId]) {
          const hitCoord = uData.coords[hit.instanceId] as VoxelPosition;
          const normal = hit.face.normal.clone();
          normal.transformDirection(hit.object.matrixWorld).round();

          const placeCoord: VoxelPosition = {
            x: hitCoord.x + normal.x,
            y: hitCoord.y + normal.y,
            z: hitCoord.z + normal.z,
          };

          return {
            hitCoord,
            placeCoord,
            normal,
            blockId: uData.blockId,
          };
        }
      }
    }
    return null;
  }

  public updateTargetWireframes(hitResult: RaycastHitResult | null) {
    if (!hitResult) {
      this.targetBoxWireframe.visible = false;
      this.placeBoxWireframe.visible = false;
      return;
    }

    this.targetBoxWireframe.visible = true;
    this.targetBoxWireframe.position.set(
      hitResult.hitCoord.x + 0.5,
      hitResult.hitCoord.y + 0.5,
      hitResult.hitCoord.z + 0.5
    );

    this.placeBoxWireframe.visible = true;
    this.placeBoxWireframe.position.set(
      hitResult.placeCoord.x + 0.5,
      hitResult.placeCoord.y + 0.5,
      hitResult.placeCoord.z + 0.5
    );
  }

  /**
   * Block mining hardness in seconds to break
   */
  public getBlockHardness(blockId: BlockId): number {
    switch (blockId) {
      case 'leaves':
        return 0.18;
      case 'dirt':
      case 'grass':
        return 0.38;
      case 'wood':
        return 0.62;
      case 'stone':
      case 'void_rock':
        return 0.88;
      case 'crystal_gold':
      case 'quantum_tech':
        return 1.15;
      case 'neon_cyan':
      case 'neon_magenta':
        return 0.75;
      default:
        return 0.55;
    }
  }

  /**
   * Updates Minecraft-style progressive cracking visual stages (0 to 5) on the targeted block
   */
  public setMiningCrack(x: number, y: number, z: number, progress: number) {
    if (progress <= 0 || progress >= 1.0) {
      this.clearMiningCrack();
      return;
    }

    this.crackMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.crackMesh.visible = true;

    const stage = Math.min(5, Math.floor(progress * 6));
    if (stage !== this.currentCrackStage && this.crackCtx) {
      this.currentCrackStage = stage;
      this.drawProceduralCrackTexture(stage);
      this.crackTexture.needsUpdate = true;
    }
  }

  public clearMiningCrack() {
    this.crackMesh.visible = false;
    this.currentCrackStage = -1;
  }

  private drawProceduralCrackTexture(stage: number) {
    if (!this.crackCtx) return;
    const ctx = this.crackCtx;
    ctx.clearRect(0, 0, 128, 128);

    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = 64;
    const cy = 64;

    // Procedural jagged cracks radiating outward based on mining stage (1 to 5)
    const branches = 4 + stage * 2;
    for (let i = 0; i < branches; i++) {
      const baseAngle = (i / branches) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);

      let curX = cx;
      let curY = cy;
      const steps = 3 + stage;
      const stepLen = (10 + stage * 6) / steps;

      for (let s = 0; s < steps; s++) {
        const jitter = (Math.sin(i * 13 + s * 7) * 0.5);
        const a = baseAngle + jitter;
        curX += Math.cos(a) * stepLen;
        curY += Math.sin(a) * stepLen;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }

    // Outer subtle highlight on cracks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  public spawnBlockDebris(wx: number, wy: number, wz: number, blockId: BlockId) {
    if (this.particleManager) {
      this.particleManager.spawnBlockBreak(wx, wy, wz, blockId);
      return;
    }

    const def = BLOCK_DEFINITIONS[blockId] || BLOCK_DEFINITIONS.stone;
    const mat = new THREE.MeshBasicMaterial({ color: def.color });

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.set(
        wx + (Math.random() - 0.5) * 0.4,
        wy + (Math.random() - 0.5) * 0.4,
        wz + (Math.random() - 0.5) * 0.4
      );
      this.particlesGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 4
      );

      this.activeParticles.push({
        mesh,
        vel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }
  }

  public spawnCelebrationParticles(wx: number, wy: number, wz: number) {
    if (this.particleManager) {
      this.particleManager.spawnMagic(wx, wy, wz, 0x00f5d4, 16);
      this.particleManager.spawnSparks(wx, wy, wz, 0xfee440, 16);
      this.particleManager.spawnRing(wx, wy, wz, 0xf72585, 2.0);
      return;
    }

    const colors = [0x00f5d4, 0xf72585, 0xfee440, 0x4361ee];
    for (let i = 0; i < 20; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mesh = new THREE.Mesh(this.particleGeo, new THREE.MeshBasicMaterial({ color: col }));
      mesh.position.set(wx, wy, wz);
      this.particlesGroup.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 6 + 4,
        Math.sin(angle) * speed
      );

      this.activeParticles.push({
        mesh,
        vel,
        life: 0,
        maxLife: 1.0 + Math.random() * 0.5,
      });
    }
  }

  public updateParticles(dt: number) {
    if (this.particleManager) {
      this.particleManager.update(dt);
    }

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particlesGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.activeParticles.splice(i, 1);
        continue;
      }

      // Physics
      p.vel.y -= 14 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 7;
      const scale = Math.max(0.01, 1 - p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  // Stamp Blueprint
  public stampBlueprint(originX: number, originY: number, originZ: number, blueprintId: string): number {
    let placed = 0;
    if (blueprintId === 'torre_victoria') {
      for (let y = 0; y < 8; y++) {
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            const key = `${originX + x},${originY + y},${originZ + z}`;
            this.worldData.blocks[key] = (x === 0 && z === 0) ? 'crystal_gold' : (y % 2 === 0 ? 'neon_cyan' : 'stone');
            placed++;
          }
        }
      }
      this.worldData.blocks[`${originX},${originY + 8},${originZ}`] = 'light_block';
      placed++;
    } else if (blueprintId === 'trampolin_obby') {
      for (let i = 0; i < 5; i++) {
        const bx = originX + i * 2;
        const by = originY + i * 2;
        const bz = originZ;
        this.worldData.blocks[`${bx},${by},${bz}`] = i === 0 ? 'jump_pad' : 'neon_magenta';
        placed++;
      }
      this.worldData.blocks[`${originX + 10},${originY + 10},${originZ}`] = 'crystal_gold';
      placed++;
    } else if (blueprintId === 'arco_cibernetico') {
      for (let y = 0; y < 6; y++) {
        this.worldData.blocks[`${originX - 2},${originY + y},${originZ}`] = 'quantum_tech';
        this.worldData.blocks[`${originX + 2},${originY + y},${originZ}`] = 'quantum_tech';
        placed += 2;
      }
      for (let x = -2; x <= 2; x++) {
        this.worldData.blocks[`${originX + x},${originY + 6},${originZ}`] = 'neon_cyan';
        placed++;
      }
    }
    if (this.particleManager) {
      this.particleManager.spawnBlueprintStamp(originX, originY, originZ);
    }
    this.buildWorld();
    return placed;
  }

  /**
   * Modulates emissive materials according to current Day/Night phase and time
   */
  public updateEmissiveMaterials(emissiveBoost: number, nightFactor: number, timeSeconds: number) {
    updateEmissiveBlockMaterials(emissiveBoost, nightFactor, timeSeconds);
  }
}
