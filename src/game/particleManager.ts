/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockId } from '../types/game';
import { BLOCK_DEFINITIONS } from './blockDefinitions';

export type ParticleKind = 'spark' | 'smoke' | 'magic' | 'debris' | 'ring' | 'glitch' | 'slash' | 'dome';

interface TransientLight {
  light: THREE.PointLight;
  life: number;
  maxLife: number;
  startIntensity: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  accel: THREE.Vector3;
  rotVel: THREE.Vector3;
  drag: number;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
  startOpacity: number;
  endOpacity: number;
  kind: ParticleKind;
  material: THREE.Material;
}

export class ParticleManager {
  public scene: THREE.Scene;
  public group: THREE.Group;
  private activeParticles: Particle[] = [];
  private activeLights: TransientLight[] = [];

  // Shared reusable geometries to minimize GPU memory & allocations
  private sparkGeo: THREE.BufferGeometry;
  private smokeGeo: THREE.BufferGeometry;
  private magicGeo: THREE.BufferGeometry;
  private debrisGeo: THREE.BufferGeometry;
  private ringGeo: THREE.BufferGeometry;
  private slashGeo: THREE.BufferGeometry;
  private domeGeo: THREE.BufferGeometry;

  // Cached materials for common effects
  private additiveCache = new Map<number, THREE.MeshBasicMaterial>();
  private normalCache = new Map<number, THREE.MeshBasicMaterial>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'ToroverseParticleSystem';
    this.scene.add(this.group);

    // Geometries (Enlarged for high visual impact)
    this.sparkGeo = new THREE.OctahedronGeometry(0.16, 0);
    this.smokeGeo = new THREE.DodecahedronGeometry(0.28, 0);
    this.magicGeo = new THREE.TetrahedronGeometry(0.18, 0);
    this.debrisGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    this.ringGeo = new THREE.TorusGeometry(0.6, 0.08, 8, 24);
    this.slashGeo = new THREE.TorusGeometry(1.15, 0.14, 8, 24, Math.PI * 0.88);
    this.domeGeo = new THREE.SphereGeometry(0.55, 12, 12);
  }

  private getAdditiveMaterial(colorHex: number): THREE.MeshBasicMaterial {
    let mat = this.additiveCache.get(colorHex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.additiveCache.set(colorHex, mat);
    }
    // Clone with its own opacity instance
    return mat.clone();
  }

  private getNormalMaterial(colorHex: number): THREE.MeshBasicMaterial {
    let mat = this.normalCache.get(colorHex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.9,
        blending: THREE.NormalBlending,
        depthWrite: false,
      });
      this.normalCache.set(colorHex, mat);
    }
    return mat.clone();
  }

  /**
   * Spawns high-velocity directional or explosive sparks (Chispas)
   */
  public spawnSparks(
    x: number,
    y: number,
    z: number,
    colorHex: number = 0x00f5d4,
    count: number = 14,
    speed: number = 5,
    dir?: THREE.Vector3
  ) {
    for (let i = 0; i < count; i++) {
      const mat = this.getAdditiveMaterial(colorHex);
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, y, z);
      this.group.add(mesh);

      let vel: THREE.Vector3;
      if (dir) {
        // Biased cone along direction
        const spread = 0.55;
        vel = dir
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread
            )
          )
          .normalize()
          .multiplyScalar(speed * (0.6 + Math.random() * 0.8));
      } else {
        // Radial sphere
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random());
        const sinPhi = Math.sin(phi);
        vel = new THREE.Vector3(
          r * sinPhi * Math.cos(theta),
          r * sinPhi * Math.sin(theta) + 0.3,
          r * Math.cos(phi)
        ).multiplyScalar(speed);
      }

      const maxLife = 0.35 + Math.random() * 0.35;
      this.activeParticles.push({
        mesh,
        vel,
        accel: new THREE.Vector3(0, -9.8, 0),
        rotVel: new THREE.Vector3(
          Math.random() * 10 - 5,
          Math.random() * 10 - 5,
          Math.random() * 10 - 5
        ),
        drag: 0.92,
        life: 0,
        maxLife,
        startScale: 1.0 + Math.random() * 0.5,
        endScale: 0.05,
        startOpacity: 1.0,
        endOpacity: 0.0,
        kind: 'spark',
        material: mat,
      });
    }
  }

  /**
   * Spawns expanding, rising soft smoke billows (Humo / Polvo)
   */
  public spawnSmoke(
    x: number,
    y: number,
    z: number,
    colorHex: number = 0x94a3b8,
    count: number = 10,
    radius: number = 0.4
  ) {
    for (let i = 0; i < count; i++) {
      const mat = this.getNormalMaterial(colorHex);
      const mesh = new THREE.Mesh(this.smokeGeo, mat);
      mesh.position.set(
        x + (Math.random() - 0.5) * radius,
        y + (Math.random() - 0.5) * radius,
        z + (Math.random() - 0.5) * radius
      );
      this.group.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.8 + Math.random() * 1.5,
        Math.sin(angle) * speed
      );

      const maxLife = 0.6 + Math.random() * 0.5;
      this.activeParticles.push({
        mesh,
        vel,
        accel: new THREE.Vector3(0, 0.4, 0), // Slight buoyant rise
        rotVel: new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ),
        drag: 0.88,
        life: 0,
        maxLife,
        startScale: 0.5,
        endScale: 1.8 + Math.random() * 0.8, // Expands
        startOpacity: 0.7,
        endOpacity: 0.0,
        kind: 'smoke',
        material: mat,
      });
    }
  }

  /**
   * Spawns magical swirling quantum energy particles (Magia / Glitch Cuántico)
   */
  public spawnMagic(
    x: number,
    y: number,
    z: number,
    colorHex: number = 0xa855f7,
    count: number = 16,
    speed: number = 2.5
  ) {
    for (let i = 0; i < count; i++) {
      const mat = this.getAdditiveMaterial(colorHex);
      const mesh = new THREE.Mesh(this.magicGeo, mat);
      mesh.position.set(x, y, z);
      this.group.add(mesh);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const hSpeed = Math.random() * speed * 0.8;
      const vel = new THREE.Vector3(
        Math.cos(angle) * hSpeed,
        1.5 + Math.random() * 3.0,
        Math.sin(angle) * hSpeed
      );

      const maxLife = 0.8 + Math.random() * 0.6;
      this.activeParticles.push({
        mesh,
        vel,
        accel: new THREE.Vector3(0, 0.2, 0),
        rotVel: new THREE.Vector3(
          Math.random() * 8 - 4,
          Math.random() * 8 - 4,
          Math.random() * 8 - 4
        ),
        drag: 0.95,
        life: 0,
        maxLife,
        startScale: 0.4,
        endScale: 1.2,
        startOpacity: 1.0,
        endOpacity: 0.0,
        kind: 'magic',
        material: mat,
      });
    }
  }

  /**
   * Spawns an expanding energy ring shockwave
   */
  public spawnRing(
    x: number,
    y: number,
    z: number,
    colorHex: number = 0x00f5d4,
    maxRadius: number = 2.5,
    orientation: 'horizontal' | 'vertical' = 'horizontal'
  ) {
    const mat = this.getAdditiveMaterial(colorHex);
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(x, y, z);
    if (orientation === 'horizontal') {
      mesh.rotation.x = Math.PI / 2;
    }
    this.group.add(mesh);

    this.activeParticles.push({
      mesh,
      vel: new THREE.Vector3(0, 0.1, 0),
      accel: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(0, 0, 0),
      drag: 1.0,
      life: 0,
      maxLife: 0.45,
      startScale: 0.2,
      endScale: maxRadius * 2.0,
      startOpacity: 0.9,
      endOpacity: 0.0,
      kind: 'ring',
      material: mat,
    });
  }

  /**
   * Spawns a transient dynamic point light flash to illuminate surroundings on attack/impact
   */
  public spawnFlashLight(
    x: number,
    y: number,
    z: number,
    colorHex: number = 0x00f5d4,
    intensity: number = 6.0,
    distance: number = 9.0,
    maxLife: number = 0.25
  ) {
    if (this.activeLights.length > 8) return; // Cap active dynamic lights for smooth 60fps
    const light = new THREE.PointLight(colorHex, intensity, distance);
    light.position.set(x, y, z);
    this.group.add(light);
    this.activeLights.push({
      light,
      life: 0,
      maxLife,
      startIntensity: intensity,
    });
  }

  /**
   * Spawns an expanding spherical energy dome burst on impact
   */
  public spawnImpactDome(
    x: number,
    y: number,
    z: number,
    colorHex: number = 0x00f5d4,
    maxScale: number = 2.4,
    maxLife: number = 0.3
  ) {
    const mat = this.getAdditiveMaterial(colorHex);
    const mesh = new THREE.Mesh(this.domeGeo, mat);
    mesh.position.set(x, y, z);
    this.group.add(mesh);

    this.activeParticles.push({
      mesh,
      vel: new THREE.Vector3(0, 0, 0),
      accel: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(2, 4, 2),
      drag: 1.0,
      life: 0,
      maxLife,
      startScale: 0.2,
      endScale: maxScale,
      startOpacity: 0.85,
      endOpacity: 0.0,
      kind: 'dome',
      material: mat,
    });
  }

  /**
   * Spawns a glowing 3D crescent energy blade wave (Slash Arc) that sweeps forward
   */
  public spawnSlashArc(
    x: number,
    y: number,
    z: number,
    dir: THREE.Vector3,
    colorHex: number = 0x00f5d4,
    scaleMultiplier: number = 1.0,
    tiltAngle: number = 0.35
  ) {
    const forward = dir.clone();
    forward.y = Math.max(-0.3, Math.min(0.3, forward.y));
    forward.normalize();
    const yaw = Math.atan2(forward.x, forward.z);

    // Outer neon crescent blade wave
    const outerMat = this.getAdditiveMaterial(colorHex);
    const outerMesh = new THREE.Mesh(this.slashGeo, outerMat);
    outerMesh.position.set(x + forward.x * 1.1, y, z + forward.z * 1.1);
    outerMesh.rotation.order = 'YXZ';
    outerMesh.rotation.y = yaw;
    outerMesh.rotation.x = Math.PI / 2;
    outerMesh.rotation.z = -Math.PI * 0.44 + tiltAngle;
    this.group.add(outerMesh);

    this.activeParticles.push({
      mesh: outerMesh,
      vel: forward.clone().multiplyScalar(9.5),
      accel: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(0, 0, 5.5),
      drag: 0.9,
      life: 0,
      maxLife: 0.28,
      startScale: 0.7 * scaleMultiplier,
      endScale: 1.85 * scaleMultiplier,
      startOpacity: 1.0,
      endOpacity: 0.0,
      kind: 'slash',
      material: outerMat,
    });

    // Inner white-hot energy core crescent
    const coreMat = this.getAdditiveMaterial(0xffffff);
    const coreMesh = new THREE.Mesh(this.slashGeo, coreMat);
    coreMesh.position.copy(outerMesh.position);
    coreMesh.rotation.copy(outerMesh.rotation);
    this.group.add(coreMesh);

    this.activeParticles.push({
      mesh: coreMesh,
      vel: forward.clone().multiplyScalar(10.0),
      accel: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(0, 0, 6.5),
      drag: 0.9,
      life: 0,
      maxLife: 0.22,
      startScale: 0.45 * scaleMultiplier,
      endScale: 1.45 * scaleMultiplier,
      startOpacity: 1.0,
      endOpacity: 0.0,
      kind: 'slash',
      material: coreMat,
    });

    // Secondary cross-wave in gold/magenta for extra flair
    const subMat = this.getAdditiveMaterial(0xfee440);
    const subMesh = new THREE.Mesh(this.slashGeo, subMat);
    subMesh.position.copy(outerMesh.position);
    subMesh.rotation.order = 'YXZ';
    subMesh.rotation.y = yaw;
    subMesh.rotation.x = Math.PI / 2 + 0.35;
    subMesh.rotation.z = -Math.PI * 0.44 - tiltAngle;
    this.group.add(subMesh);

    this.activeParticles.push({
      mesh: subMesh,
      vel: forward.clone().multiplyScalar(7.5),
      accel: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(0, 0, -4.5),
      drag: 0.9,
      life: 0,
      maxLife: 0.25,
      startScale: 0.55 * scaleMultiplier,
      endScale: 1.55 * scaleMultiplier,
      startOpacity: 0.85,
      endOpacity: 0.0,
      kind: 'slash',
      material: subMat,
    });

    // High-speed directional sparks & dynamic light flash
    this.spawnSparks(
      x + forward.x * 1.4,
      y,
      z + forward.z * 1.4,
      colorHex,
      20,
      9.0,
      forward
    );
    this.spawnSparks(
      x + forward.x * 1.4,
      y,
      z + forward.z * 1.4,
      0xffffff,
      10,
      7.5,
      forward
    );
    this.spawnFlashLight(x + forward.x * 1.4, y, z + forward.z * 1.4, colorHex, 7.5, 10, 0.22);
  }

  /**
   * Spawns a colossal seismic ground slam for the Titanic Voxel Hammer
   */
  public spawnHammerSlam(x: number, y: number, z: number) {
    // Triple concentric shockwave rings
    this.spawnRing(x, y + 0.15, z, 0xf59e0b, 4.2, 'horizontal');
    this.spawnRing(x, y + 0.25, z, 0xef4444, 3.2, 'horizontal');
    this.spawnRing(x, y + 0.35, z, 0xfee440, 2.2, 'horizontal');

    // Expanding plasma impact dome
    this.spawnImpactDome(x, y + 0.3, z, 0xf59e0b, 3.2, 0.35);
    this.spawnImpactDome(x, y + 0.3, z, 0xffffff, 1.8, 0.2);

    // Erupting magma/voxel debris chunks in a radial ring
    for (let i = 0; i < 16; i++) {
      const col = i % 3 === 0 ? 0xf59e0b : i % 3 === 1 ? 0xef4444 : 0x44403c;
      const mat = i % 3 === 2 ? this.getNormalMaterial(col) : this.getAdditiveMaterial(col);
      const mesh = new THREE.Mesh(this.debrisGeo, mat);
      const angle = (i / 16) * Math.PI * 2;
      const rad = 0.6 + Math.random() * 1.2;
      mesh.position.set(x + Math.cos(angle) * rad, y + 0.2, z + Math.sin(angle) * rad);
      this.group.add(mesh);

      const speed = 4.5 + Math.random() * 4.5;
      this.activeParticles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          5.0 + Math.random() * 4.5,
          Math.sin(angle) * speed
        ),
        accel: new THREE.Vector3(0, -16, 0),
        rotVel: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12),
        drag: 0.95,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.25,
        startScale: 1.5,
        endScale: 0.2,
        startOpacity: 1.0,
        endOpacity: 0.0,
        kind: 'debris',
        material: mat,
      });
    }

    // Explosive sparks, dust & intense orange flash
    this.spawnSparks(x, y + 0.4, z, 0xfbbf24, 32, 9.5);
    this.spawnSparks(x, y + 0.4, z, 0xef4444, 18, 7.5);
    this.spawnSmoke(x, y + 0.2, z, 0x78716c, 22, 1.4);
    this.spawnFlashLight(x, y + 1.0, z, 0xf59e0b, 12.0, 14.0, 0.38);
  }

  /**
   * Muzzle flash & shock ring when firing ranged weapons (Blaster / Photon Bow)
   */
  public spawnMuzzleFlash(
    x: number,
    y: number,
    z: number,
    dir: THREE.Vector3,
    colorHex: number = 0x38bdf8
  ) {
    this.spawnImpactDome(x, y, z, 0xffffff, 0.9, 0.14);
    this.spawnImpactDome(x, y, z, colorHex, 1.4, 0.2);
    this.spawnSparks(x, y, z, colorHex, 16, 10.0, dir);
    this.spawnSparks(x, y, z, 0xffffff, 8, 8.0, dir);

    // Directional shock ring oriented perpendicular to shot direction
    const mat = this.getAdditiveMaterial(colorHex);
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(x + dir.x * 0.4, y + dir.y * 0.4, z + dir.z * 0.4);
    mesh.lookAt(x + dir.x * 2, y + dir.y * 2, z + dir.z * 2);
    this.group.add(mesh);

    this.activeParticles.push({
      mesh,
      vel: dir.clone().multiplyScalar(2.0),
      accel: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(0, 0, 4),
      drag: 0.9,
      life: 0,
      maxLife: 0.24,
      startScale: 0.2,
      endScale: 1.8,
      startOpacity: 1.0,
      endOpacity: 0.0,
      kind: 'ring',
      material: mat,
    });

    this.spawnFlashLight(x, y, z, colorHex, 6.5, 9.0, 0.18);
  }

  /**
   * Continuous glowing trail emitted along projectile flight path
   */
  public spawnProjectileTrail(
    x: number,
    y: number,
    z: number,
    colorHex: number = 0x38bdf8,
    isBow: boolean = false
  ) {
    const mat = this.getAdditiveMaterial(colorHex);
    const mesh = new THREE.Mesh(isBow ? this.magicGeo : this.sparkGeo, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.12,
      y + (Math.random() - 0.5) * 0.12,
      z + (Math.random() - 0.5) * 0.12
    );
    this.group.add(mesh);

    this.activeParticles.push({
      mesh,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2
      ),
      accel: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(6, 6, 6),
      drag: 0.9,
      life: 0,
      maxLife: 0.24,
      startScale: isBow ? 1.15 : 1.0,
      endScale: 0.05,
      startOpacity: 0.95,
      endOpacity: 0.0,
      kind: isBow ? 'magic' : 'spark',
      material: mat,
    });
  }

  // ==========================================
  // HIGH LEVEL GAME ACTIONS
  // ==========================================

  /**
   * Weapon swing or projectile impact sparks tailored to weapon type
   */
  public spawnWeaponHit(
    x: number,
    y: number,
    z: number,
    weaponId: string,
    isCrit: boolean = false
  ) {
    if (weaponId === 'sword') {
      // High-frequency bright cyan & gold sparks + impact dome + expanding rings
      this.spawnImpactDome(x, y, z, 0x00f5d4, isCrit ? 2.6 : 1.9, 0.25);
      this.spawnImpactDome(x, y, z, 0xffffff, 1.1, 0.16);
      this.spawnSparks(x, y, z, 0x00f5d4, isCrit ? 34 : 24, 9.5);
      this.spawnSparks(x, y, z, 0xffe600, isCrit ? 18 : 12, 7.5);
      this.spawnRing(x, y, z, 0x00f5d4, isCrit ? 2.5 : 1.8);
      if (isCrit) {
        this.spawnRing(x, y, z, 0xfee440, 2.2, 'vertical');
      }
      this.spawnFlashLight(x, y, z, 0x00f5d4, 8.0, 10.0, 0.25);
    } else if (weaponId === 'hammer') {
      // Heavy ground slam: shockwave rings + impact dome + flying dust/smoke + fiery sparks
      this.spawnImpactDome(x, y, z, 0xf59e0b, 3.0, 0.32);
      this.spawnRing(x, y, z, 0xf59e0b, 3.6);
      this.spawnRing(x, y, z, 0xef4444, 2.4, 'vertical');
      this.spawnSmoke(x, y, z, 0x78716c, 22, 1.1);
      this.spawnSparks(x, y, z, 0xfbbf24, 30, 8.5);
      this.spawnSparks(x, y, z, 0xffffff, 14, 7.0);
      this.spawnFlashLight(x, y, z, 0xf59e0b, 10.0, 12.0, 0.3);
    } else if (weaponId === 'blaster') {
      // Plasma burst: blue & cyan sparks + expanding plasma sphere + rings
      this.spawnImpactDome(x, y, z, 0x38bdf8, 2.3, 0.26);
      this.spawnImpactDome(x, y, z, 0xffffff, 1.2, 0.16);
      this.spawnSparks(x, y, z, 0x38bdf8, 28, 9.5);
      this.spawnMagic(x, y, z, 0x60a5fa, 16, 4.0);
      this.spawnRing(x, y, z, 0x38bdf8, 2.0);
      this.spawnRing(x, y, z, 0x00f5d4, 1.5, 'vertical');
      this.spawnFlashLight(x, y, z, 0x38bdf8, 8.5, 10.0, 0.26);
    } else if (weaponId === 'bow') {
      // Rose photon supernova burst
      this.spawnImpactDome(x, y, z, 0xf43f5e, 2.4, 0.26);
      this.spawnImpactDome(x, y, z, 0xfee440, 1.3, 0.18);
      this.spawnSparks(x, y, z, 0xf43f5e, 26, 10.0);
      this.spawnSparks(x, y, z, 0xfee440, 16, 7.5);
      this.spawnRing(x, y, z, 0xf43f5e, 2.2);
      this.spawnRing(x, y, z, 0xfee440, 1.6, 'vertical');
      this.spawnFlashLight(x, y, z, 0xf43f5e, 8.5, 10.0, 0.26);
    } else {
      this.spawnSparks(x, y, z, 0x00f5d4, 18, 6.5);
    }
  }

  /**
   * Enemy hit reaction / damage feedback
   */
  public spawnEnemyDamaged(x: number, y: number, z: number, enemyType: string) {
    if (enemyType === 'glitch_corruptor') {
      this.spawnMagic(x, y, z, 0xa855f7, 20, 4.5);
      this.spawnSparks(x, y, z, 0xef4444, 16, 6.0);
    } else if (enemyType === 'void_golem') {
      this.spawnSmoke(x, y, z, 0x475569, 18, 0.8);
      this.spawnSparks(x, y, z, 0xf59e0b, 20, 6.5);
    } else {
      this.spawnSparks(x, y, z, 0xf43f5e, 20, 6.5);
      this.spawnSmoke(x, y, z, 0x1e293b, 12, 0.5);
    }
  }

  /**
   * Enemy defeat explosion
   */
  public spawnEnemyDefeated(x: number, y: number, z: number, enemyType: string) {
    // Grand celebratory burst: expanding ring, impact dome, corrupt smoke dispersion, magical soul stars
    const mainCol = enemyType === 'void_golem' ? 0xf59e0b : 0xa855f7;
    this.spawnImpactDome(x, y, z, mainCol, 3.8, 0.4);
    this.spawnRing(x, y, z, mainCol, 4.2);
    this.spawnRing(x, y, z, 0x00f5d4, 3.0, 'vertical');
    this.spawnSparks(x, y, z, 0xfee440, 36, 9.0);
    this.spawnSmoke(x, y, z, 0x334155, 22, 1.0);
    this.spawnMagic(x, y, z, 0x00f5d4, 28, 5.5);
    this.spawnFlashLight(x, y, z, mainCol, 14.0, 16.0, 0.45);
  }

  /**
   * Player damaged glitch feedback
   */
  public spawnPlayerHit(x: number, y: number, z: number) {
    // Red and glitch-purple warning sparks + dome
    this.spawnImpactDome(x, y + 1.0, z, 0xef4444, 2.0, 0.25);
    this.spawnSparks(x, y + 1.0, z, 0xef4444, 24, 6.5);
    this.spawnSparks(x, y + 1.0, z, 0x9333ea, 16, 5.0);
    this.spawnRing(x, y + 1.0, z, 0xef4444, 2.0);
  }

  /**
   * Block Break VFX: Tailored debris cubes + smoke dust + block-specific sparks/magic
   */
  public spawnBlockBreak(x: number, y: number, z: number, blockId: BlockId) {
    const def = BLOCK_DEFINITIONS[blockId] || BLOCK_DEFINITIONS.stone;
    const colHex = parseInt(def.color.replace('#', '0x'), 16) || 0x64748b;

    // 1. Solid chunk debris (cubes)
    const count = 10;
    for (let i = 0; i < count; i++) {
      const mat = this.getNormalMaterial(colHex);
      const mesh = new THREE.Mesh(this.debrisGeo, mat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y + (Math.random() - 0.5) * 0.4,
        z + (Math.random() - 0.5) * 0.4
      );
      this.group.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 5
      );

      this.activeParticles.push({
        mesh,
        vel,
        accel: new THREE.Vector3(0, -14, 0),
        rotVel: new THREE.Vector3(
          Math.random() * 8 - 4,
          Math.random() * 8 - 4,
          Math.random() * 8 - 4
        ),
        drag: 0.96,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.3,
        startScale: 1.0,
        endScale: 0.2,
        startOpacity: 1.0,
        endOpacity: 0.0,
        kind: 'debris',
        material: mat,
      });
    }

    // 2. Dust / smoke puff
    const smokeCol =
      blockId.includes('dirt') || blockId.includes('wood')
        ? 0x78350f
        : blockId.includes('stone')
        ? 0x94a3b8
        : 0x475569;
    this.spawnSmoke(x, y, z, smokeCol, 8, 0.3);

    // 3. Block-specific flair: crystals and neons emit magic/sparks
    if (blockId.includes('neon') || blockId.includes('crystal') || blockId.includes('quantum')) {
      this.spawnSparks(x, y, z, colHex, 14, 4.5);
      this.spawnMagic(x, y, z, colHex, 8, 2.5);
    }
  }

  /**
   * Block Place VFX: Contracting magic sparkles + glowing stabilization ring
   */
  public spawnBlockPlace(x: number, y: number, z: number, blockId: BlockId) {
    const def = BLOCK_DEFINITIONS[blockId] || BLOCK_DEFINITIONS.stone;
    const colHex = parseInt(def.color.replace('#', '0x'), 16) || 0x00f5d4;

    // Expanding subtle stabilization ring
    this.spawnRing(x, y, z, colHex, 0.9);

    // Rising magical construction motes
    this.spawnMagic(x, y, z, colHex, 10, 2.0);
    this.spawnSparks(x, y, z, 0xffffff, 6, 3.0);
  }

  /**
   * Blueprint Stamp: Epic reconstruction cascade of quantum magic & gold stars
   */
  public spawnBlueprintStamp(originX: number, originY: number, originZ: number) {
    this.spawnRing(originX, originY, originZ, 0x00f5d4, 4.0);
    this.spawnRing(originX, originY + 2, originZ, 0xf72585, 3.2);
    this.spawnMagic(originX, originY + 1, originZ, 0x00f5d4, 30, 4.0);
    this.spawnMagic(originX, originY + 2, originZ, 0xfee440, 24, 4.5);
    this.spawnSparks(originX, originY + 1.5, originZ, 0xffffff, 20, 6.0);
  }

  /**
   * Jump Pad step launch VFX
   */
  public spawnJumpPadAscend(x: number, y: number, z: number) {
    this.spawnRing(x, y + 0.1, z, 0x00f5d4, 1.8);
    // Vertical ascending stream of energy particles
    for (let i = 0; i < 16; i++) {
      const mat = this.getAdditiveMaterial(i % 2 === 0 ? 0x00f5d4 : 0xf72585);
      const mesh = new THREE.Mesh(this.magicGeo, mat);
      const rad = 0.4 + Math.random() * 0.3;
      const angle = (i / 16) * Math.PI * 2;
      mesh.position.set(x + Math.cos(angle) * rad, y + 0.1, z + Math.sin(angle) * rad);
      this.group.add(mesh);

      this.activeParticles.push({
        mesh,
        vel: new THREE.Vector3(0, 8.0 + Math.random() * 4.0, 0),
        accel: new THREE.Vector3(0, 2.0, 0),
        rotVel: new THREE.Vector3(5, 5, 5),
        drag: 0.96,
        life: 0,
        maxLife: 0.6,
        startScale: 0.5,
        endScale: 1.2,
        startOpacity: 1.0,
        endOpacity: 0.0,
        kind: 'magic',
        material: mat,
      });
    }
  }

  /**
   * Teleportation Vortex VFX
   */
  public spawnTeleportVortex(x: number, y: number, z: number) {
    this.spawnRing(x, y + 0.1, z, 0x38bdf8, 2.5);
    this.spawnRing(x, y + 1.2, z, 0xa855f7, 2.0);
    this.spawnMagic(x, y + 0.5, z, 0x38bdf8, 25, 3.5);
    this.spawnSparks(x, y + 1.0, z, 0xffffff, 18, 5.0);
  }

  // ==========================================
  // UPDATE LOOP (60 FPS POOL RECYCLING)
  // ==========================================
  public update(dt: number) {
    const clampedDt = Math.min(dt, 0.05);

    for (let i = this.activeLights.length - 1; i >= 0; i--) {
      const l = this.activeLights[i];
      l.life += clampedDt;
      if (l.life >= l.maxLife) {
        this.group.remove(l.light);
        l.light.dispose();
        this.activeLights.splice(i, 1);
        continue;
      }
      const p = l.life / l.maxLife;
      l.light.intensity = l.startIntensity * (1 - p);
    }

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += clampedDt;

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        p.material.dispose();
        this.activeParticles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;

      // Physics
      p.vel.addScaledVector(p.accel, clampedDt);
      p.vel.multiplyScalar(Math.pow(p.drag, clampedDt * 60));
      p.mesh.position.addScaledVector(p.vel, clampedDt);

      // Rotation
      p.mesh.rotation.x += p.rotVel.x * clampedDt;
      p.mesh.rotation.y += p.rotVel.y * clampedDt;
      p.mesh.rotation.z += p.rotVel.z * clampedDt;

      // Scale lerp
      const currentScale = THREE.MathUtils.lerp(p.startScale, p.endScale, progress);
      p.mesh.scale.set(currentScale, currentScale, currentScale);

      // Opacity fade
      const currentOpacity = THREE.MathUtils.lerp(p.startOpacity, p.endOpacity, progress);
      (p.material as THREE.MeshBasicMaterial).opacity = Math.max(0, currentOpacity);
    }
  }

  public clearAll() {
    for (let i = this.activeLights.length - 1; i >= 0; i--) {
      const l = this.activeLights[i];
      this.group.remove(l.light);
      l.light.dispose();
    }
    this.activeLights = [];

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      this.group.remove(p.mesh);
      p.material.dispose();
    }
    this.activeParticles = [];
  }

  public dispose() {
    this.clearAll();
    this.scene.remove(this.group);
    this.sparkGeo.dispose();
    this.smokeGeo.dispose();
    this.magicGeo.dispose();
    this.debrisGeo.dispose();
    this.ringGeo.dispose();
    this.slashGeo.dispose();
    this.domeGeo.dispose();
    this.additiveCache.forEach((m) => m.dispose());
    this.normalCache.forEach((m) => m.dispose());
  }
}
