/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockDefinition, BlockId } from '../types/game';

export const BLOCK_DEFINITIONS: Record<BlockId, BlockDefinition> = {
  air: {
    id: 'air',
    name: 'Aire',
    color: '#000000',
    roughness: 1,
    metalness: 0,
    category: 'natural',
  },
  grass: {
    id: 'grass',
    name: 'Césped Cuántico',
    color: '#38b000',
    roughness: 0.9,
    metalness: 0.05,
    category: 'natural',
  },
  dirt: {
    id: 'dirt',
    name: 'Tierra Vóxel',
    color: '#6f4e37',
    roughness: 0.95,
    metalness: 0.0,
    category: 'natural',
  },
  stone: {
    id: 'stone',
    name: 'Piedra Matrix',
    color: '#6c757d',
    roughness: 0.85,
    metalness: 0.1,
    category: 'construccion',
  },
  wood: {
    id: 'wood',
    name: 'Madera Digital',
    color: '#8b5a2b',
    roughness: 0.8,
    metalness: 0.05,
    category: 'construccion',
  },
  leaves: {
    id: 'leaves',
    name: 'Hojas Holográficas',
    color: '#2d6a4f',
    roughness: 0.6,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
    category: 'natural',
  },
  neon_cyan: {
    id: 'neon_cyan',
    name: 'Neón Cian de Victoria',
    color: '#00f5d4',
    emissive: '#00bbf9',
    roughness: 0.2,
    metalness: 0.3,
    category: 'cyber_neon',
  },
  neon_magenta: {
    id: 'neon_magenta',
    name: 'Magma Magenta',
    color: '#f72585',
    emissive: '#7209b7',
    roughness: 0.2,
    metalness: 0.3,
    category: 'cyber_neon',
  },
  crystal_gold: {
    id: 'crystal_gold',
    name: 'Cristal de Creación',
    color: '#fee440',
    emissive: '#f77f00',
    roughness: 0.15,
    metalness: 0.85,
    category: 'cyber_neon',
  },
  quantum_tech: {
    id: 'quantum_tech',
    name: 'Núcleo Cuántico',
    color: '#4361ee',
    emissive: '#3a0ca3',
    roughness: 0.25,
    metalness: 0.7,
    category: 'cyber_neon',
  },
  data_water: {
    id: 'data_water',
    name: 'Agua de Datos',
    color: '#4cc9f0',
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65,
    category: 'natural',
  },
  void_rock: {
    id: 'void_rock',
    name: 'Roca del Cataclismo',
    color: '#1b1b1e',
    emissive: '#370617',
    roughness: 0.9,
    metalness: 0.2,
    category: 'construccion',
  },
  jump_pad: {
    id: 'jump_pad',
    name: 'Plataforma Salto (x3)',
    color: '#390099',
    emissive: '#ff5400',
    roughness: 0.3,
    metalness: 0.5,
    isInteractive: true,
    category: 'mecanismo',
  },
  teleport_pad: {
    id: 'teleport_pad',
    name: 'Teletransportador',
    color: '#ff0054',
    emissive: '#9e0059',
    roughness: 0.2,
    metalness: 0.6,
    isInteractive: true,
    category: 'mecanismo',
  },
  light_block: {
    id: 'light_block',
    name: 'Faro de Victoria',
    color: '#ffffff',
    emissive: '#ffffff',
    roughness: 0.1,
    metalness: 0.1,
    isInteractive: true,
    category: 'mecanismo',
  },
};

// Procedural Canvas Textures Cache
const textureCache: Record<string, THREE.CanvasTexture> = {};

export function getBlockTexture(blockId: BlockId): THREE.CanvasTexture {
  if (textureCache[blockId]) {
    return textureCache[blockId];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    dummy.colorSpace = THREE.SRGBColorSpace;
    return dummy;
  }

  const def = BLOCK_DEFINITIONS[blockId] || BLOCK_DEFINITIONS.stone;
  ctx.fillStyle = def.color;
  ctx.fillRect(0, 0, 32, 32);

  // Pixel art shading & detailing
  if (blockId === 'grass') {
    // Top border lighter, bottom dirt speckles
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, 32, 6);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(4, 6, 4, 3);
    ctx.fillRect(16, 6, 4, 4);
    ctx.fillRect(24, 6, 4, 2);
    // Bevel border
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);
  } else if (blockId === 'dirt') {
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(4, 4, 6, 6);
    ctx.fillRect(18, 14, 5, 5);
    ctx.fillRect(8, 22, 6, 6);
    ctx.strokeStyle = '#432818';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);
  } else if (blockId === 'stone') {
    ctx.fillStyle = '#555b6e';
    ctx.fillRect(6, 6, 8, 8);
    ctx.fillRect(18, 18, 8, 8);
    ctx.strokeStyle = '#343a40';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);
  } else if (blockId === 'wood') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 8, 32, 2);
    ctx.fillRect(0, 18, 32, 2);
    ctx.fillRect(0, 26, 32, 2);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);
  } else if (blockId === 'neon_cyan' || blockId === 'neon_magenta') {
    // Glowing sci-fi grid
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 28, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 14, 4, 4);
  } else if (blockId === 'crystal_gold') {
    // Gold crystalline facets
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(28, 16);
    ctx.lineTo(16, 28);
    ctx.lineTo(4, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (blockId === 'jump_pad') {
    // Chevron arrows for launch
    ctx.fillStyle = '#ffb703';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    // Arrow up
    ctx.beginPath();
    ctx.moveTo(16, 6);
    ctx.lineTo(26, 18);
    ctx.lineTo(20, 18);
    ctx.lineTo(20, 26);
    ctx.lineTo(12, 26);
    ctx.lineTo(12, 18);
    ctx.lineTo(6, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (blockId === 'teleport_pad') {
    // Spiral warp vortex
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 14, 4, 4);
  } else if (blockId === 'quantum_tech') {
    // Circuit patterns
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, 16);
    ctx.lineTo(12, 16);
    ctx.lineTo(16, 12);
    ctx.lineTo(28, 12);
    ctx.stroke();
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(24, 10, 4, 4);
  } else {
    // Generic beveled voxel border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 31, 31);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  textureCache[blockId] = texture;
  return texture;
}

// Material generator per block
const materialCache: Record<string, THREE.MeshStandardMaterial> = {};

export function getBlockMaterial(blockId: BlockId): THREE.MeshStandardMaterial {
  if (materialCache[blockId]) {
    return materialCache[blockId];
  }

  const def = BLOCK_DEFINITIONS[blockId] || BLOCK_DEFINITIONS.stone;
  const texture = getBlockTexture(blockId);

  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    color: new THREE.Color(def.color),
    roughness: def.roughness,
    metalness: def.metalness,
    transparent: !!def.transparent,
    opacity: def.opacity ?? 1.0,
    emissive: def.emissive ? new THREE.Color(def.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: def.emissive ? 0.6 : 0.0,
  });

  materialCache[blockId] = mat;
  return mat;
}

// Pre-allocated colors for dynamic emissive updates to avoid garbage collection
const tempColorDay = new THREE.Color();
const tempColorNight = new THREE.Color();

/**
 * Updates emissive block materials in real time based on the day/night cycle,
 * boosting luminescence at dusk and night with organic breathing animations.
 */
export function updateEmissiveBlockMaterials(
  emissiveBoost: number,
  nightFactor: number,
  timeSeconds: number
) {
  // neon_cyan (Victoria's Signature Cyan)
  if (materialCache['neon_cyan']) {
    const mat = materialCache['neon_cyan'];
    tempColorDay.setHex(0x00bbf9);
    tempColorNight.setHex(0x00f5d4);
    mat.emissive.copy(tempColorDay).lerp(tempColorNight, nightFactor);
    const pulse = 1.0 + Math.sin(timeSeconds * 2.8) * (0.18 * nightFactor);
    mat.emissiveIntensity = Math.min(2.5, 0.65 * emissiveBoost * pulse);
  }

  // neon_magenta (Magma Magenta)
  if (materialCache['neon_magenta']) {
    const mat = materialCache['neon_magenta'];
    tempColorDay.setHex(0x7209b7);
    tempColorNight.setHex(0xf72585);
    mat.emissive.copy(tempColorDay).lerp(tempColorNight, nightFactor);
    const pulse = 1.0 + Math.sin(timeSeconds * 2.8 + 1.2) * (0.18 * nightFactor);
    mat.emissiveIntensity = Math.min(2.5, 0.65 * emissiveBoost * pulse);
  }

  // crystal_gold (Creation Crystal)
  if (materialCache['crystal_gold']) {
    const mat = materialCache['crystal_gold'];
    tempColorDay.setHex(0xf77f00);
    tempColorNight.setHex(0xfee440);
    mat.emissive.copy(tempColorDay).lerp(tempColorNight, nightFactor);
    const pulse = 1.0 + Math.sin(timeSeconds * 2.2 + 2.4) * (0.22 * nightFactor);
    mat.emissiveIntensity = Math.min(2.5, 0.6 * emissiveBoost * pulse);
  }

  // quantum_tech (Quantum Core)
  if (materialCache['quantum_tech']) {
    const mat = materialCache['quantum_tech'];
    tempColorDay.setHex(0x3a0ca3);
    tempColorNight.setHex(0x4361ee);
    mat.emissive.copy(tempColorDay).lerp(tempColorNight, nightFactor);
    const pulse = 1.0 + Math.sin(timeSeconds * 1.8 + 0.5) * (0.2 * nightFactor);
    mat.emissiveIntensity = Math.min(2.5, 0.65 * emissiveBoost * pulse);
  }

  // light_block (Faro de Victoria)
  if (materialCache['light_block']) {
    const mat = materialCache['light_block'];
    tempColorDay.setHex(0xfffbeb);
    tempColorNight.setHex(0xffffff);
    mat.emissive.copy(tempColorDay).lerp(tempColorNight, nightFactor);
    const pulse = 1.0 + Math.sin(timeSeconds * 3.5) * (0.12 * nightFactor);
    mat.emissiveIntensity = Math.min(3.0, 0.9 * emissiveBoost * pulse);
  }

  // jump_pad
  if (materialCache['jump_pad']) {
    const mat = materialCache['jump_pad'];
    const pulse = 1.0 + Math.sin(timeSeconds * 3.0) * (0.15 * nightFactor);
    mat.emissiveIntensity = Math.min(2.0, 0.5 * emissiveBoost * pulse);
  }

  // teleport_pad
  if (materialCache['teleport_pad']) {
    const mat = materialCache['teleport_pad'];
    const pulse = 1.0 + Math.sin(timeSeconds * 3.2) * (0.2 * nightFactor);
    mat.emissiveIntensity = Math.min(2.2, 0.6 * emissiveBoost * pulse);
  }

  // void_rock
  if (materialCache['void_rock']) {
    const mat = materialCache['void_rock'];
    mat.emissiveIntensity = 0.25 * emissiveBoost;
  }
}

