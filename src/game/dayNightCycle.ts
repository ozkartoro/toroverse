/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface DayNightState {
  timeOfDay: number; // 0.0 to 24.0 hours
  formattedTime: string; // e.g. "14:30"
  phase: DayPhase;
  phaseLabel: string;
  nightFactor: number; // 0.0 = bright midday, 1.0 = deep night
  sunAltitude: number; // -1.0 to 1.0
  isAutoAdvancing: boolean;
}

interface SkyKeyframe {
  hour: number;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  particleColor: number;
  particleOpacity: number;
  emissiveBoost: number;
}

const KEYFRAMES: SkyKeyframe[] = [
  // 00:00 - Deep Cosmic Midnight
  {
    hour: 0.0,
    skyColor: 0x030712,
    fogColor: 0x050a18,
    fogDensity: 0.0026,
    sunColor: 0x818cf8, // Cool moonlight
    sunIntensity: 0.55,
    hemiSkyColor: 0x1e1b4b,
    hemiGroundColor: 0x020617,
    hemiIntensity: 0.45,
    particleColor: 0x00f5d4, // Cyan bioluminescent sparkles
    particleOpacity: 0.9,
    emissiveBoost: 2.0,
  },
  // 04:30 - Pre-dawn Twilight
  {
    hour: 4.5,
    skyColor: 0x0f172a,
    fogColor: 0x1e1b4b,
    fogDensity: 0.0028,
    sunColor: 0xa5b4fc,
    sunIntensity: 0.65,
    hemiSkyColor: 0x312e81,
    hemiGroundColor: 0x0f172a,
    hemiIntensity: 0.55,
    particleColor: 0xa855f7,
    particleOpacity: 0.8,
    emissiveBoost: 1.7,
  },
  // 06:15 - Golden Sunrise / Amanecer
  {
    hour: 6.25,
    skyColor: 0x581c87, // Purple-pink dawn horizon
    fogColor: 0x4a1d96,
    fogDensity: 0.0022,
    sunColor: 0xfdba74, // Warm peach sunrise
    sunIntensity: 1.5,
    hemiSkyColor: 0xf472b6,
    hemiGroundColor: 0x1e1b4b,
    hemiIntensity: 1.0,
    particleColor: 0xfde047, // Golden motes
    particleOpacity: 0.65,
    emissiveBoost: 1.2,
  },
  // 08:30 - Crisp Morning
  {
    hour: 8.5,
    skyColor: 0x0284c7, // Clear sky
    fogColor: 0x0369a1,
    fogDensity: 0.0018,
    sunColor: 0xffedd5,
    sunIntensity: 1.9,
    hemiSkyColor: 0x7dd3fc,
    hemiGroundColor: 0x0f172a,
    hemiIntensity: 1.2,
    particleColor: 0x67e8f9,
    particleOpacity: 0.45,
    emissiveBoost: 0.75,
  },
  // 12:00 - High Noon / Mediodía Radiante
  {
    hour: 12.0,
    skyColor: 0x0284c7, // Vibrant azure sky
    fogColor: 0x075985,
    fogDensity: 0.0016, // Clean distant visibility
    sunColor: 0xffffff,
    sunIntensity: 2.2,
    hemiSkyColor: 0x38bdf8,
    hemiGroundColor: 0x1e293b,
    hemiIntensity: 1.3,
    particleColor: 0xe0f2fe,
    particleOpacity: 0.35,
    emissiveBoost: 0.5,
  },
  // 16:30 - Late Afternoon Warmth
  {
    hour: 16.5,
    skyColor: 0x0369a1,
    fogColor: 0x0f766e,
    fogDensity: 0.0018,
    sunColor: 0xfef08a,
    sunIntensity: 2.0,
    hemiSkyColor: 0x67e8f9,
    hemiGroundColor: 0x1e293b,
    hemiIntensity: 1.2,
    particleColor: 0xfef08a,
    particleOpacity: 0.45,
    emissiveBoost: 0.7,
  },
  // 18:45 - Sunset / Atardecer Carmesí
  {
    hour: 18.75,
    skyColor: 0x831843, // Deep magenta-rose dusk
    fogColor: 0x581c87,
    fogDensity: 0.0024,
    sunColor: 0xf97316, // Rich amber blaze
    sunIntensity: 1.6,
    hemiSkyColor: 0xf43f5e,
    hemiGroundColor: 0x18181b,
    hemiIntensity: 0.95,
    particleColor: 0xf43f5e, // Sunset embers
    particleOpacity: 0.75,
    emissiveBoost: 1.3,
  },
  // 20:30 - Twilight / Ocaso
  {
    hour: 20.5,
    skyColor: 0x3b0764, // Deep violet twilight
    fogColor: 0x1e1b4b,
    fogDensity: 0.0025,
    sunColor: 0xc084fc,
    sunIntensity: 0.85,
    hemiSkyColor: 0x4338ca,
    hemiGroundColor: 0x090d16,
    hemiIntensity: 0.6,
    particleColor: 0xc084fc,
    particleOpacity: 0.85,
    emissiveBoost: 1.6,
  },
  // 24:00 - Wrap-around Midnight
  {
    hour: 24.0,
    skyColor: 0x030712,
    fogColor: 0x050a18,
    fogDensity: 0.0026,
    sunColor: 0x818cf8,
    sunIntensity: 0.55,
    hemiSkyColor: 0x1e1b4b,
    hemiGroundColor: 0x020617,
    hemiIntensity: 0.45,
    particleColor: 0x00f5d4,
    particleOpacity: 0.9,
    emissiveBoost: 2.0,
  },
];

export class DayNightCycle {
  // Current time in hours (0.0 to 24.0)
  public timeOfDay: number = 8.5; // Start at pleasant crisp morning
  public cycleDurationSeconds: number = 240; // 4 minutes for a complete day-night cycle
  public isAutoAdvancing: boolean = true;

  // Orbit radius for celestial light
  private celestialRadius: number = 380;

  // Reusable THREE objects to avoid allocation in tick()
  private _tempColorA = new THREE.Color();
  private _tempColorB = new THREE.Color();
  public currentSkyColor = new THREE.Color();
  public currentFogColor = new THREE.Color();
  public currentSunColor = new THREE.Color();
  public currentHemiSkyColor = new THREE.Color();
  public currentHemiGroundColor = new THREE.Color();
  public currentParticleColor = new THREE.Color();

  public currentSunIntensity: number = 1.8;
  public currentHemiIntensity: number = 1.0;
  public currentFogDensity: number = 0.0018;
  public currentParticleOpacity: number = 0.5;
  public currentEmissiveBoost: number = 1.0;
  public currentNightFactor: number = 0.0;
  public currentSunAltitude: number = 0.5;

  private totalElapsedTime: number = 0;

  constructor(initialHour: number = 8.5, cycleDurationSeconds: number = 240) {
    this.timeOfDay = initialHour;
    this.cycleDurationSeconds = cycleDurationSeconds;
    this.update(0);
  }

  public setTime(hour: number) {
    this.timeOfDay = (hour % 24 + 24) % 24;
    this.update(0);
  }

  public toggleAutoAdvance() {
    this.isAutoAdvancing = !this.isAutoAdvancing;
  }

  public setAutoAdvance(active: boolean) {
    this.isAutoAdvancing = active;
  }

  public advanceTime(hoursDelta: number) {
    this.timeOfDay = (this.timeOfDay + hoursDelta) % 24;
    if (this.timeOfDay < 0) this.timeOfDay += 24;
    this.update(0);
  }

  public getPhase(): DayPhase {
    if (this.timeOfDay >= 5.5 && this.timeOfDay < 8.5) return 'dawn';
    if (this.timeOfDay >= 8.5 && this.timeOfDay < 17.5) return 'day';
    if (this.timeOfDay >= 17.5 && this.timeOfDay < 20.5) return 'dusk';
    return 'night';
  }

  public getPhaseLabel(): string {
    const phase = this.getPhase();
    switch (phase) {
      case 'dawn':
        return 'Amanecer Cuántico';
      case 'day':
        return 'Día Radiante';
      case 'dusk':
        return 'Atardecer Carmesí';
      case 'night':
        return 'Noche Estelar';
    }
  }

  public getFormattedTime(): string {
    const totalMinutes = Math.floor(this.timeOfDay * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const hStr = hours < 10 ? `0${hours}` : `${hours}`;
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hStr}:${mStr}`;
  }

  public getState(): DayNightState {
    return {
      timeOfDay: this.timeOfDay,
      formattedTime: this.getFormattedTime(),
      phase: this.getPhase(),
      phaseLabel: this.getPhaseLabel(),
      nightFactor: this.currentNightFactor,
      sunAltitude: this.currentSunAltitude,
      isAutoAdvancing: this.isAutoAdvancing,
    };
  }

  public update(dt: number) {
    if (this.isAutoAdvancing && dt > 0) {
      // 24 hours elapsed over cycleDurationSeconds
      const hoursAdvance = (dt / this.cycleDurationSeconds) * 24;
      this.timeOfDay = (this.timeOfDay + hoursAdvance) % 24;
    }
    this.totalElapsedTime += dt;

    // 1. Calculate Sun / Moon Celestial Orbit
    // 06:00 = Rising on East horizon (angle = 0)
    // 12:00 = Top of the sky (angle = PI / 2)
    // 18:00 = Setting on West horizon (angle = PI)
    // 00:00 = Underneath the world (angle = 3*PI / 2)
    const solarFraction = (this.timeOfDay - 6.0) / 24.0;
    const sunAngle = solarFraction * Math.PI * 2;

    this.currentSunAltitude = Math.sin(sunAngle);

    // Night factor: 0.0 at noon, smoothly climbs to 1.0 when sun is down
    // When altitude is <= 0, full night factor
    if (this.currentSunAltitude >= 0.3) {
      this.currentNightFactor = 0.0;
    } else if (this.currentSunAltitude <= -0.2) {
      this.currentNightFactor = 1.0;
    } else {
      // Smooth Hermite blend between -0.2 and 0.3
      const t = (0.3 - this.currentSunAltitude) / 0.5;
      this.currentNightFactor = t * t * (3 - 2 * t);
    }

    // 2. Interpolate Keyframes
    let k0 = KEYFRAMES[0];
    let k1 = KEYFRAMES[1];

    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (this.timeOfDay >= KEYFRAMES[i].hour && this.timeOfDay <= KEYFRAMES[i + 1].hour) {
        k0 = KEYFRAMES[i];
        k1 = KEYFRAMES[i + 1];
        break;
      }
    }

    const span = k1.hour - k0.hour;
    const progress = span > 0 ? (this.timeOfDay - k0.hour) / span : 0;
    // Smoothstep interpolation for soft non-linear transitions
    const t = progress * progress * (3 - 2 * progress);

    // Sky Color
    this._tempColorA.setHex(k0.skyColor);
    this._tempColorB.setHex(k1.skyColor);
    this.currentSkyColor.copy(this._tempColorA).lerp(this._tempColorB, t);

    // Fog Color & Density
    this._tempColorA.setHex(k0.fogColor);
    this._tempColorB.setHex(k1.fogColor);
    this.currentFogColor.copy(this._tempColorA).lerp(this._tempColorB, t);
    this.currentFogDensity = THREE.MathUtils.lerp(k0.fogDensity, k1.fogDensity, t);

    // Sun / Moon Light
    this._tempColorA.setHex(k0.sunColor);
    this._tempColorB.setHex(k1.sunColor);
    this.currentSunColor.copy(this._tempColorA).lerp(this._tempColorB, t);
    this.currentSunIntensity = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, t);

    // Hemisphere Light
    this._tempColorA.setHex(k0.hemiSkyColor);
    this._tempColorB.setHex(k1.hemiSkyColor);
    this.currentHemiSkyColor.copy(this._tempColorA).lerp(this._tempColorB, t);

    this._tempColorA.setHex(k0.hemiGroundColor);
    this._tempColorB.setHex(k1.hemiGroundColor);
    this.currentHemiGroundColor.copy(this._tempColorA).lerp(this._tempColorB, t);

    this.currentHemiIntensity = THREE.MathUtils.lerp(k0.hemiIntensity, k1.hemiIntensity, t);

    // Ambient Particles
    this._tempColorA.setHex(k0.particleColor);
    this._tempColorB.setHex(k1.particleColor);
    this.currentParticleColor.copy(this._tempColorA).lerp(this._tempColorB, t);
    this.currentParticleOpacity = THREE.MathUtils.lerp(k0.particleOpacity, k1.particleOpacity, t);

    // Emissive Blocks Boost
    this.currentEmissiveBoost = THREE.MathUtils.lerp(k0.emissiveBoost, k1.emissiveBoost, t);
  }

  /**
   * Applies the computed celestial lighting to the Three.js scene and components
   */
  public applyToScene(
    scene: THREE.Scene,
    dirLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    starParticles?: THREE.Points
  ) {
    // 1. Sky & Fog
    scene.background = this.currentSkyColor;
    if (scene.fog && scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(this.currentFogColor);
      scene.fog.density = this.currentFogDensity;
    }

    // 2. Directional Celestial Light (Sun by day, Moon by night)
    const solarFraction = (this.timeOfDay - 6.0) / 24.0;
    const sunAngle = solarFraction * Math.PI * 2;

    let posX = Math.cos(sunAngle) * this.celestialRadius;
    let posY = Math.sin(sunAngle) * this.celestialRadius;
    let posZ = Math.sin(sunAngle * 0.5) * 120 + 80;

    // If sun dips significantly below horizon, mirror to moonlight overhead
    if (posY < -10) {
      // Moon position is opposite to the sun
      posX = -posX;
      posY = Math.max(50, -posY * 0.85);
      posZ = -posZ;
    } else {
      posY = Math.max(30, posY);
    }

    dirLight.position.set(posX, posY, posZ);
    dirLight.color.copy(this.currentSunColor);
    dirLight.intensity = this.currentSunIntensity;

    // 3. Hemisphere Fill Light
    hemiLight.color.copy(this.currentHemiSkyColor);
    hemiLight.groundColor.copy(this.currentHemiGroundColor);
    hemiLight.intensity = this.currentHemiIntensity;

    // 4. Atmospheric Floating Particles
    if (starParticles && starParticles.material instanceof THREE.PointsMaterial) {
      starParticles.material.color.copy(this.currentParticleColor);
      // Subtle rhythmic twinkle in the particles
      const twinkle = 1.0 + Math.sin(this.totalElapsedTime * 2.5) * 0.15;
      starParticles.material.opacity = Math.min(1.0, this.currentParticleOpacity * twinkle);
      starParticles.material.size = 0.28 * (1.0 + this.currentNightFactor * 0.4);
    }
  }
}
