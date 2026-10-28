/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MultiplayerPeer } from '../types/game';
import { createVoxelCharacter, VoxelCharacterInstance } from './characterModel';
import { VoxelEngine } from './voxelEngine';

export class MultiplayerManager {
  public peers: Map<
    string,
    {
      data: MultiplayerPeer;
      char: VoxelCharacterInstance;
      activeEmote?: { id: string; timer: number };
    }
  > = new Map();
  public scene: THREE.Scene;
  public voxelEngine: VoxelEngine;
  public onChatMessage?: (sender: string, message: string, platform: string) => void;

  private chatPool = [
    '¡Victoria! ¡Estamos reconstruyendo el Sector Neón!',
    'Miren esta torre de cristal que acabo de hacer.',
    '¿Alguien probó el nuevo script de trampolín?',
    'Compré las alas cuánticas en el mercado con mis puntos Toro :D',
    '¡El evento semanal de Neón va por buen camino!',
    'Juego cruzado desde mi tablet va super fluido.',
    '¡Reconstruyamos el puente hacia el Núcleo!',
  ];

  constructor(scene: THREE.Scene, voxelEngine: VoxelEngine) {
    this.scene = scene;
    this.voxelEngine = voxelEngine;
    this.initSimulatedPeers();
  }

  private initSimulatedPeers() {
    const peerConfigs: Partial<MultiplayerPeer>[] = [
      {
        id: 'peer_1',
        name: 'Sofia_Dev',
        platform: 'PC',
        x: 4,
        y: 1,
        z: 4,
        customization: {
          skinColor: '#fde047',
          hairStyle: 'cyber_spiky',
          hairColor: '#f43f5e',
          shirtColor: '#8b5cf6',
          pantsColor: '#1e1b4b',
          headwear: 'cyber_goggles',
          backAccessory: 'quantum_wings',
          faceExpression: 'confident_wink',
          scale: 0.95,
        },
      },
      {
        id: 'peer_2',
        name: 'Alex_Voxel',
        platform: 'Console',
        x: -4,
        y: 1,
        z: -2,
        customization: {
          skinColor: '#fdba74',
          hairStyle: 'afro_cube',
          hairColor: '#38bdf8',
          shirtColor: '#10b981',
          pantsColor: '#064e3b',
          headwear: 'builder_helmet',
          backAccessory: 'jetpack',
          faceExpression: 'happy_kawaii',
          scale: 1.0,
        },
      },
      {
        id: 'peer_3',
        name: 'Matias_Touch',
        platform: 'Mobile',
        x: -3,
        y: 1,
        z: 5,
        customization: {
          skinColor: '#fcd34d',
          hairStyle: 'sleek_bob',
          hairColor: '#e11d48',
          shirtColor: '#ec4899',
          pantsColor: '#312e81',
          headwear: 'cat_ears',
          backAccessory: 'cyber_katana',
          faceExpression: 'determined',
          scale: 0.9,
        },
      },
    ];

    peerConfigs.forEach((cfg) => {
      const data: MultiplayerPeer = {
        id: cfg.id!,
        name: cfg.name!,
        platform: cfg.platform!,
        color: '#00f5d4',
        x: cfg.x!,
        y: cfg.y!,
        z: cfg.z!,
        targetX: cfg.x!,
        targetZ: cfg.z!,
        rotationY: Math.random() * Math.PI * 2,
        currentAction: 'idle',
        customization: cfg.customization!,
      };

      const char = createVoxelCharacter(data.customization);
      char.root.position.set(data.x, data.y, data.z);
      this.scene.add(char.root);

      // Add 3D name tag floating above head
      this.addNameTag(char.root, data.name, data.platform);

      this.peers.set(data.id, { data, char });
    });
  }

  private addNameTag(root: THREE.Group, name: string, platform: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(10, 10, 236, 44, 12);
    ctx.fill();

    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name} [${platform}]`, 128, 38);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 2.6, 0);
    sprite.scale.set(2.2, 0.55, 1);
    root.add(sprite);
  }

  public update(dt: number) {
    this.peers.forEach((peer) => {
      const { data, char } = peer;

      // Handle active emote timer
      if (peer.activeEmote) {
        peer.activeEmote.timer -= dt;
        if (peer.activeEmote.timer <= 0) {
          peer.activeEmote = undefined;
        } else {
          // Play emote in place
          char.updateAnimation(false, false, false, dt, peer.activeEmote.id);
          return;
        }
      }

      // Random wandering & occasional building across 300% expanded citadel
      const dist = Math.hypot(data.targetX - data.x, data.targetZ - data.z);
      if (dist < 0.3) {
        if (Math.random() < 0.02) {
          data.targetX = (Math.random() - 0.5) * 32;
          data.targetZ = (Math.random() - 0.5) * 32;
        }
      } else {
        const angle = Math.atan2(data.targetX - data.x, data.targetZ - data.z);
        const speed = 2.4;
        data.x += Math.sin(angle) * speed * dt;
        data.z += Math.cos(angle) * speed * dt;
        data.rotationY = angle;
      }

      // Check ground height under peer
      const bx = Math.floor(data.x);
      const bz = Math.floor(data.z);
      let groundY = 0;
      for (let y = 35; y >= -5; y--) {
        if (this.voxelEngine.hasSolidBlock(bx, y, bz)) {
          groundY = y + 1;
          break;
        }
      }
      data.y = groundY;

      char.root.position.set(data.x, data.y, data.z);
      char.root.rotation.y = data.rotationY;
      char.updateAnimation(dist >= 0.3, false, false, dt);

      // Occasional peer chat
      if (Math.random() < 0.001) {
        const msg = this.chatPool[Math.floor(Math.random() * this.chatPool.length)];
        data.lastChatMessage = msg;
        if (this.onChatMessage) {
          this.onChatMessage(data.name, msg, data.platform);
        }
      }
    });
  }

  public triggerPeersReact(emoteId: string) {
    const peerEntries = Array.from(this.peers.values());
    if (peerEntries.length === 0) return;

    // Pick 1-2 random peers to react to player's emote
    const peerToReact = peerEntries[Math.floor(Math.random() * peerEntries.length)];
    peerToReact.activeEmote = { id: emoteId, timer: 3.5 };

    const reactionTextMap: Record<string, string> = {
      wave: '¡Hola Victoria! 👋 Qué bueno verte construyendo.',
      dance: '¡Ese ritmo está increíble! 💃 Me uno al baile.',
      cheer: '¡SIII! 🎉 ¡Reconstruyamos el Toroverso juntos!',
      flex: '¡Vaya fuerza de constructora! 💪 Miren estos músculos.',
      bow: 'Un honor colaborar contigo en este mundo. 🙇',
      point: '¡Miren hacia allá! ¡Detecto más fragmentos de datos! 👉',
      laugh: '¡Jajaja, qué buen momento en la isla! 😆',
      spin: '¡Woow, tremendo giro acrobático! ✨',
    };

    const reactionText = reactionTextMap[emoteId] || '¡Genial movimiento!';
    if (this.onChatMessage) {
      setTimeout(() => {
        this.onChatMessage?.(peerToReact.data.name, reactionText, peerToReact.data.platform);
      }, 600);
    }
  }

  public triggerPeerDance() {
    this.peers.forEach((peer) => {
      peer.activeEmote = { id: 'dance', timer: 5.0 };
    });
  }
}
