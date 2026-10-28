/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { sound } from '../audio/soundSystem';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'sandstorm';

export interface WeatherConfig {
  type: WeatherType;
  name: string;
  speedMultiplier: number;
  fogDensityBoost: number;
  fogColorTint?: number;
  lightIntensityMultiplier: number;
  particleCount: number;
  particleColor: number;
  particleSize: number;
  description: string;
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  clear: {
    type: 'clear',
    name: 'Despejado',
    speedMultiplier: 1.0,
    fogDensityBoost: 0.0,
    lightIntensityMultiplier: 1.0,
    particleCount: 0,
    particleColor: 0xffffff,
    particleSize: 0.1,
    description: 'Cielo límpido y visibilidad panorámica perfecta.',
  },
  rain: {
    type: 'rain',
    name: 'Lluvia Cuántica',
    speedMultiplier: 0.85,
    fogDensityBoost: 0.0022,
    fogColorTint: 0x334155,
    lightIntensityMultiplier: 0.75,
    particleCount: 1800,
    particleColor: 0x7dd3fc,
    particleSize: 0.22,
    description: 'Chubasco eléctrico que moja el terreno e incrementa la niebla.',
  },
  snow: {
    type: 'snow',
    name: 'Ventisca Helada',
    speedMultiplier: 0.78,
    fogDensityBoost: 0.0035,
    fogColorTint: 0xe2e8f0,
    lightIntensityMultiplier: 0.85,
    particleCount: 1500,
    particleColor: 0xffffff,
    particleSize: 0.32,
    description: 'Nevada densa que entumece el movimiento y tiñe el horizonte de blanco.',
  },
  sandstorm: {
    type: 'sandstorm',
    name: 'Tormenta de Arena del Vacío',
    speedMultiplier: 0.70,
    fogDensityBoost: 0.0058, // Heavily obscures distant landscape
    fogColorTint: 0x78350f,
    lightIntensityMultiplier: 0.65,
    particleCount: 2200,
    particleColor: 0xf59e0b,
    particleSize: 0.28,
    description: 'Ráfagas feroces de arena y datos que ciegan la visión lejana.',
  },
};

export class WeatherSystem {
  public scene: THREE.Scene;
  public currentWeather: WeatherType = 'clear';
  public isAutoChanging: boolean = true;
  private weatherTimer: number = 90; // change every 90-120 seconds if auto
  private autoCycleDuration: number = 90;

  // Particle Mesh & Geometry
  private particlePoints: THREE.Points | null = null;
  private particleGeo: THREE.BufferGeometry | null = null;
  private particleMat: THREE.PointsMaterial | null = null;
  private particlePositions: Float32Array | null = null;
  private particleVelocities: Float32Array | null = null;

  // Lightning effect for rain storms
  private lightningTimer: number = 0;
  private isLightningActive: boolean = false;
  private lightningDuration: number = 0;
  private baseDirLightIntensity: number = 1.0;

  // Area bounds around player
  private boxSize = { x: 90, y: 50, z: 90 };

  // Reusable colors
  private _tempFogColor = new THREE.Color();
  private _origFogColor = new THREE.Color();

  constructor(scene: THREE.Scene, initialWeather: WeatherType = 'clear') {
    this.scene = scene;
    this.setWeather(initialWeather);
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.weatherTimer = this.autoCycleDuration;
    this.rebuildParticles();
  }

  public cycleNextWeather(): WeatherType {
    const list: WeatherType[] = ['clear', 'rain', 'snow', 'sandstorm'];
    const nextIdx = (list.indexOf(this.currentWeather) + 1) % list.length;
    this.setWeather(list[nextIdx]);
    return list[nextIdx];
  }

  public toggleAutoChange(): boolean {
    this.isAutoChanging = !this.isAutoChanging;
    return this.isAutoChanging;
  }

  public getConfig(): WeatherConfig {
    return WEATHER_CONFIGS[this.currentWeather];
  }

  private rebuildParticles() {
    // Remove old points
    if (this.particlePoints) {
      this.scene.remove(this.particlePoints);
      this.particlePoints.geometry.dispose();
      if (Array.isArray(this.particlePoints.material)) {
        this.particlePoints.material.forEach((m) => m.dispose());
      } else {
        this.particlePoints.material.dispose();
      }
      this.particlePoints = null;
    }

    const cfg = this.getConfig();
    if (cfg.particleCount === 0) return;

    const count = cfg.particleCount;
    this.particlePositions = new Float32Array(count * 3);
    this.particleVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      this.particlePositions[idx] = (Math.random() - 0.5) * this.boxSize.x;
      this.particlePositions[idx + 1] = Math.random() * this.boxSize.y;
      this.particlePositions[idx + 2] = (Math.random() - 0.5) * this.boxSize.z;

      if (this.currentWeather === 'rain') {
        this.particleVelocities[idx] = -3.0 + Math.random() * 1.0; // wind drift
        this.particleVelocities[idx + 1] = -42.0 - Math.random() * 8.0; // downward speed
        this.particleVelocities[idx + 2] = -1.5 + Math.random() * 1.0;
      } else if (this.currentWeather === 'snow') {
        this.particleVelocities[idx] = (Math.random() - 0.5) * 3.0;
        this.particleVelocities[idx + 1] = -3.8 - Math.random() * 2.0;
        this.particleVelocities[idx + 2] = (Math.random() - 0.5) * 3.0;
      } else if (this.currentWeather === 'sandstorm') {
        this.particleVelocities[idx] = 34.0 + Math.random() * 10.0; // rushing sand
        this.particleVelocities[idx + 1] = -2.5 + Math.random() * 4.0;
        this.particleVelocities[idx + 2] = (Math.random() - 0.5) * 8.0;
      }
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: cfg.particleColor,
      size: cfg.particleSize,
      transparent: true,
      opacity: this.currentWeather === 'rain' ? 0.65 : this.currentWeather === 'snow' ? 0.85 : 0.75,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.particlePoints = new THREE.Points(this.particleGeo, this.particleMat);
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    dirLight: THREE.DirectionalLight,
    sceneFog: THREE.FogExp2 | THREE.Fog | null
  ) {
    // 1. Auto weather progression
    if (this.isAutoChanging) {
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.cycleNextWeather();
      }
    }

    const cfg = this.getConfig();

    // 2. Modulate Scene Fog based on weather severity
    if (sceneFog && sceneFog instanceof THREE.FogExp2) {
      sceneFog.density += (cfg.fogDensityBoost * 0.4);

      if (cfg.fogColorTint !== undefined) {
        this._tempFogColor.setHex(cfg.fogColorTint);
        // Blend current fog towards weather fog tint
        sceneFog.color.lerp(this._tempFogColor, 0.25);
      }
    }

    // 3. Lightning Flash (during rain)
    if (this.currentWeather === 'rain') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        // Chance to trigger lightning
        if (Math.random() < 0.008) {
          this.isLightningActive = true;
          this.lightningDuration = 0.12;
          this.lightningTimer = 8.0 + Math.random() * 12.0;
          sound.playPointCollect(); // subtle celestial thunder flash cue
        }
      }

      if (this.isLightningActive) {
        this.lightningDuration -= dt;
        dirLight.intensity = 3.5; // sudden brilliant flash
        dirLight.color.setHex(0xe0f2fe);
        if (this.lightningDuration <= 0) {
          this.isLightningActive = false;
        }
      }
    }

    // 4. Update weather particles following player
    if (!this.particlePoints || !this.particlePositions || !this.particleVelocities || !this.particleGeo) {
      return;
    }

    const posAttr = this.particleGeo.getAttribute('position') as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const count = cfg.particleCount;

    const px = playerPos.x;
    const py = playerPos.y;
    const pz = playerPos.z;

    const hx = this.boxSize.x / 2;
    const hz = this.boxSize.z / 2;
    const maxY = this.boxSize.y;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Move particle
      array[idx] += this.particleVelocities[idx] * dt;
      array[idx + 1] += this.particleVelocities[idx + 1] * dt;
      array[idx + 2] += this.particleVelocities[idx + 2] * dt;

      // Organic snowflake sway
      if (this.currentWeather === 'snow') {
        array[idx] += Math.sin(array[idx + 1] * 0.2) * 0.8 * dt;
        array[idx + 2] += Math.cos(array[idx + 1] * 0.2) * 0.8 * dt;
      }

      // Wrap-around relative to player position
      if (array[idx + 1] < py - 2) {
        array[idx + 1] = py + maxY - 4;
        array[idx] = px + (Math.random() - 0.5) * this.boxSize.x;
        array[idx + 2] = pz + (Math.random() - 0.5) * this.boxSize.z;
      } else if (array[idx + 1] > py + maxY) {
        array[idx + 1] = py + 2;
      }

      if (array[idx] < px - hx) array[idx] = px + hx;
      else if (array[idx] > px + hx) array[idx] = px - hx;

      if (array[idx + 2] < pz - hz) array[idx + 2] = pz + hz;
      else if (array[idx + 2] > pz + hz) array[idx + 2] = pz - hz;
    }

    posAttr.needsUpdate = true;
  }
}
