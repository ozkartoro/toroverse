/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VoxelEngine } from './voxelEngine';
import { VoxelCharacterInstance } from './characterModel';
import { sound } from '../audio/soundSystem';

export interface PlayerInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  mine: boolean;
  place: boolean;
  interact: boolean;
  virtualStickX: number;
  virtualStickY: number;
}

export class PlayerController {
  public position = new THREE.Vector3(0, 5, 0);
  public velocity = new THREE.Vector3(0, 0, 0);
  public yaw = 0; // horizontal camera angle
  public pitch = -0.25; // vertical camera angle
  public isGrounded = false;
  public cameraDistance = 6.0;
  public isFirstPerson = false;
  public currentEmote: string | null = null;
  public emoteTimer = 0;

  // Collision dimensions
  private radius = 0.35;
  private height = 1.8;

  // Coyote time & jump buffer
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private footstepTimer = 0;
  private shakeTimer = 0;
  private shakeIntensity = 0;

  // Reusable vectors for zero GC
  private _moveDir = new THREE.Vector3();
  private _camOffset = new THREE.Vector3();
  private _targetCamPos = new THREE.Vector3();

  public weatherSpeedMultiplier: number = 1.0;

  // Callbacks
  public onEarnPoints?: (amount: number, reason: string) => void;
  public onTriggerScript?: (coord: string, action: string, msg: string) => void;
  public onExplored?: (distanceDelta: number) => void;
  public onJumpPad?: () => void;

  constructor(
    public camera: THREE.PerspectiveCamera,
    public character: VoxelCharacterInstance,
    public voxelEngine: VoxelEngine
  ) {
    this.voxelEngine.scene.add(this.character.root);
  }

  public triggerEmote(emoteId: string, duration = 4.0) {
    this.currentEmote = emoteId;
    this.emoteTimer = duration;
  }

  public stopEmote() {
    this.currentEmote = null;
    this.emoteTimer = 0;
  }

  public triggerCameraShake(intensity = 0.18, duration = 0.22) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  public triggerAttack(weaponId: string, cameraDir: THREE.Vector3) {
    this.stopEmote();
    // Face character towards attack direction
    const attackYaw = Math.atan2(cameraDir.x, cameraDir.z);
    this.character.root.rotation.y = attackYaw;
    this.character.triggerAttack(weaponId);

    const intensity = weaponId === 'hammer' ? 0.35 : weaponId === 'sword' ? 0.14 : 0.1;
    const duration = weaponId === 'hammer' ? 0.32 : 0.18;
    this.triggerCameraShake(intensity, duration);
  }

  public teleport(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.character.root.position.copy(this.position);
    sound.playTeleport();
    this.voxelEngine.particleManager?.spawnTeleportVortex(x, y, z);
  }

  public update(dt: number, input: PlayerInputState, actionTriggered: boolean) {
    const clampedDt = Math.min(dt, 0.05);

    // Update timers
    if (this.isGrounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - clampedDt);
    }

    if (input.jump) {
      this.jumpBufferTimer = 0.15;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - clampedDt);
    }

    // 1. Calculate horizontal intent
    let moveX = 0;
    let moveZ = 0;

    if (input.forward) moveZ -= 1;
    if (input.backward) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    // Mobile Virtual Joystick input
    if (Math.abs(input.virtualStickX) > 0.05 || Math.abs(input.virtualStickY) > 0.05) {
      moveX += input.virtualStickX;
      moveZ += input.virtualStickY;
    }

    // Console Gamepad input polling
    this.pollGamepad(input);

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const isMoving = len > 0.1;
    if (isMoving) {
      moveX /= Math.max(1, len);
      moveZ /= Math.max(1, len);
    }

    // Cancel emote if moving or in the air
    if (isMoving || !this.isGrounded) {
      this.stopEmote();
    } else if (this.currentEmote) {
      this.emoteTimer -= clampedDt;
      if (this.emoteTimer <= 0) {
        this.currentEmote = null;
      }
    }

    // Transform direction by camera yaw
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);
    const worldMoveX = moveX * cosYaw + moveZ * sinYaw;
    const worldMoveZ = -moveX * sinYaw + moveZ * cosYaw;

    const baseSpeed = input.sprint ? 20.0 : 8.5;
    const speed = baseSpeed * this.weatherSpeedMultiplier;
    this.velocity.x = worldMoveX * speed;
    this.velocity.z = worldMoveZ * speed;

    if (isMoving && this.isGrounded && this.onExplored) {
      this.onExplored(speed * clampedDt);
    }

    // 2. Jump Handling
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.velocity.y = 10.5;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.isGrounded = false;
      this.stopEmote();
      sound.playJump();
    }

    // 3. Gravity
    this.velocity.y -= 26 * clampedDt;
    if (this.velocity.y < -30) this.velocity.y = -30;

    // 4. Collision & Movement Resolution with Voxel World
    this.resolveMovement(clampedDt);

    // 5. Check Interactive Blocks under foot
    this.checkUnderfootBlocks();

    // 6. Update Character Mesh
    this.character.root.position.copy(this.position);
    if (isMoving) {
      const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
      this.character.root.rotation.y = THREE.MathUtils.damp(
        this.character.root.rotation.y,
        targetAngle,
        15,
        clampedDt
      );
    }
    this.character.updateAnimation(
      isMoving,
      !this.isGrounded,
      actionTriggered,
      clampedDt,
      this.currentEmote || undefined
    );

    // Positional surface-aware footstep audio
    if (isMoving && this.isGrounded) {
      this.footstepTimer -= clampedDt;
      if (this.footstepTimer <= 0) {
        const stepInterval = input.sprint ? 0.3 : 0.44;
        this.footstepTimer = stepInterval;
        const bx = Math.floor(this.position.x);
        const by = Math.floor(this.position.y - 0.2);
        const bz = Math.floor(this.position.z);
        const surfaceBlock = this.voxelEngine.getBlock(bx, by, bz);
        sound.playPositionalFootstep(this.position.x, this.position.y, this.position.z, surfaceBlock);
      }
    } else {
      this.footstepTimer = 0.15;
    }

    // 7. Update Third-Person Camera with Smooth Damping
    this.updateCamera(clampedDt);
  }

  private pollGamepad(input: PlayerInputState) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    // Left stick movement
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    if (Math.abs(lx) > 0.15) input.virtualStickX = lx;
    if (Math.abs(ly) > 0.15) input.virtualStickY = ly;

    // Right stick camera
    const rx = gp.axes[2] || 0;
    const ry = gp.axes[3] || 0;
    if (Math.abs(rx) > 0.15) this.yaw -= rx * 0.04;
    if (Math.abs(ry) > 0.15) this.pitch = Math.max(-1.4, Math.min(0.6, this.pitch - ry * 0.04));

    // A button (0) Jump
    if (gp.buttons[0]?.pressed) input.jump = true;
    // B button (1) Sprint
    if (gp.buttons[1]?.pressed) input.sprint = true;
    // RT (7) Place
    if (gp.buttons[7]?.pressed) input.place = true;
    // LT (6) Mine
    if (gp.buttons[6]?.pressed) input.mine = true;
    // X (2) Interact
    if (gp.buttons[2]?.pressed) input.interact = true;
  }

  private resolveMovement(dt: number) {
    // Attempt movement on X
    const newX = this.position.x + this.velocity.x * dt;
    if (!this.checkPlayerCollision(newX, this.position.y, this.position.z)) {
      this.position.x = newX;
    } else {
      this.velocity.x = 0;
    }

    // Attempt movement on Z
    const newZ = this.position.z + this.velocity.z * dt;
    if (!this.checkPlayerCollision(this.position.x, this.position.y, newZ)) {
      this.position.z = newZ;
    } else {
      this.velocity.z = 0;
    }

    // Attempt movement on Y
    const newY = this.position.y + this.velocity.y * dt;
    if (this.velocity.y < 0) {
      // Falling down
      if (!this.checkPlayerCollision(this.position.x, newY, this.position.z)) {
        this.position.y = newY;
        this.isGrounded = false;
      } else {
        // Landed on block
        this.position.y = Math.floor(newY) + 1.0;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    } else if (this.velocity.y > 0) {
      // Jumping up
      if (!this.checkPlayerCollision(this.position.x, newY, this.position.z)) {
        this.position.y = newY;
      } else {
        // Bump head
        this.velocity.y = 0;
      }
    }

    // Respawn if fell into void
    if (this.position.y < -25) {
      const sp = this.voxelEngine.worldData.spawnPoint;
      this.teleport(sp[0], sp[1] + 2, sp[2]);
    }
  }

  private checkPlayerCollision(px: number, py: number, pz: number): boolean {
    const minX = Math.floor(px - this.radius);
    const maxX = Math.floor(px + this.radius);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + this.height);
    const minZ = Math.floor(pz - this.radius);
    const maxZ = Math.floor(pz + this.radius);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.voxelEngine.hasSolidBlock(x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private checkUnderfootBlocks() {
    const bx = Math.floor(this.position.x);
    const by = Math.floor(this.position.y - 0.1);
    const bz = Math.floor(this.position.z);
    const coordKey = `${bx},${by},${bz}`;

    const blockId = this.voxelEngine.getBlock(bx, by, bz);

    // Jump pad mechanics
    if (blockId === 'jump_pad') {
      this.velocity.y = 21.0;
      this.isGrounded = false;
      this.onJumpPad?.();
      sound.playPositionalBounce(bx + 0.5, by + 1.0, bz + 0.5);
      if (this.voxelEngine.particleManager) {
        this.voxelEngine.particleManager.spawnJumpPadAscend(bx + 0.5, by + 1.0, bz + 0.5);
      } else {
        this.voxelEngine.spawnCelebrationParticles(bx + 0.5, by + 1.2, bz + 0.5);
      }
      if (this.onTriggerScript) {
        this.onTriggerScript(coordKey, 'bounce_player', '¡Plataforma de Salto Activada!');
      }
    } else if (blockId === 'teleport_pad') {
      sound.playPositionalTeleport(bx + 0.5, by + 0.5, bz + 0.5);
      if (this.voxelEngine.particleManager) {
        this.voxelEngine.particleManager.spawnTeleportVortex(bx + 0.5, by + 0.5, bz + 0.5);
      }
    }

    // Script execution check
    const script = this.voxelEngine.worldData.scripts[coordKey];
    if (script && script.trigger === 'on_step') {
      if (script.action === 'bounce_player') {
        this.velocity.y = script.paramNumber || 20;
        this.isGrounded = false;
        sound.playBounce();
      } else if (script.action === 'give_points') {
        const pts = script.paramNumber || 250;
        sound.playPointCollect();
        this.voxelEngine.spawnCelebrationParticles(bx + 0.5, by + 1.2, bz + 0.5);
        if (this.onEarnPoints) this.onEarnPoints(pts, script.paramText || 'Misión Cumplida');
        // Delete one-shot script so it doesn't give infinite points on every frame
        delete this.voxelEngine.worldData.scripts[coordKey];
      } else if (script.action === 'teleport_player') {
        const sp = this.voxelEngine.worldData.spawnPoint;
        this.teleport(sp[0], sp[1] + 2, sp[2]);
        sound.playTeleport();
      }
    }
  }

  public updateCamera(dt: number) {
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      const curShake = this.shakeIntensity * (this.shakeTimer / 0.25);
      shakeOffsetX = (Math.random() - 0.5) * curShake;
      shakeOffsetY = (Math.random() - 0.5) * curShake;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }

    if (this.isFirstPerson) {
      this.camera.position.set(
        this.position.x + shakeOffsetX,
        this.position.y + 1.6 + shakeOffsetY,
        this.position.z
      );
      const lookTarget = new THREE.Vector3(
        this.position.x - Math.sin(this.yaw) * Math.cos(this.pitch) * 10,
        this.position.y + 1.6 + Math.sin(this.pitch) * 10,
        this.position.z - Math.cos(this.yaw) * Math.cos(this.pitch) * 10
      );
      this.camera.lookAt(lookTarget);
      this.character.root.visible = false;
      return;
    }

    this.character.root.visible = true;

    // Third-person spherical orbital offset
    const dist = this.cameraDistance;
    const cosPitch = Math.cos(this.pitch);
    const ox = Math.sin(this.yaw) * cosPitch * dist;
    const oy = -Math.sin(this.pitch) * dist;
    const oz = Math.cos(this.yaw) * cosPitch * dist;

    this._targetCamPos.set(
      this.position.x + ox + shakeOffsetX,
      this.position.y + 1.4 + Math.max(0.5, oy) + shakeOffsetY,
      this.position.z + oz
    );

    // Smoothly damp camera position
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._targetCamPos.x, 18, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._targetCamPos.y, 18, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._targetCamPos.z, 18, dt);

    const lookTarget = new THREE.Vector3(
      this.position.x + shakeOffsetX * 0.5,
      this.position.y + 1.3 + shakeOffsetY * 0.5,
      this.position.z
    );
    this.camera.lookAt(lookTarget);
  }
}
