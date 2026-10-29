/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpatialAudioParams {
  refDistance?: number;
  maxDistance?: number;
  rolloff?: number;
  baseVolume?: number;
}

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // C major pentatonic
  private noteIdx = 0;

  // 3D Listener State (Player / Camera)
  private listenerPos = { x: 0, y: 0, z: 0 };
  private listenerForward = { x: 0, y: 0, z: 1 };
  private listenerRight = { x: 1, y: 0, z: 0 };

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateListener(
    pos: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    right?: { x: number; y: number; z: number }
  ) {
    this.listenerPos.x = pos.x;
    this.listenerPos.y = pos.y;
    this.listenerPos.z = pos.z;

    this.listenerForward.x = forward.x;
    this.listenerForward.y = forward.y;
    this.listenerForward.z = forward.z;

    if (right) {
      this.listenerRight.x = right.x;
      this.listenerRight.y = right.y;
      this.listenerRight.z = right.z;
    } else {
      // Calculate perpendicular right vector on XZ plane: (-forward.z, 0, forward.x)
      const len = Math.hypot(forward.x, forward.z) || 1;
      this.listenerRight.x = -forward.z / len;
      this.listenerRight.y = 0;
      this.listenerRight.z = forward.x / len;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    if (this.isMuted && this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
      this.musicPlaying = false;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Builds a spatial audio node chain:
   * Source Node -> Lowpass Filter (Air Absorption) -> Distance Attenuated Gain -> Stereo Panner -> Master Gain
   * Returns null if sound is beyond maxDistance, saving CPU resources.
   */
  private createSpatialChain(
    x: number,
    y: number,
    z: number,
    params: SpatialAudioParams = {}
  ): { filter: BiquadFilterNode; gain: GainNode; pan: StereoPannerNode | GainNode; now: number } | null {
    if (this.isMuted) return null;
    this.initContext();
    if (!this.ctx || !this.masterGain) return null;

    const refDist = params.refDistance ?? 2.5;
    const maxDist = params.maxDistance ?? 48.0;
    const rolloff = params.rolloff ?? 1.25;
    const baseVolume = params.baseVolume ?? 1.0;

    // 1. Calculate 3D Distance
    const dx = x - this.listenerPos.x;
    const dy = y - this.listenerPos.y;
    const dz = z - this.listenerPos.z;
    const dist = Math.hypot(dx, dy, dz);

    // Early out if beyond hearing range
    if (dist >= maxDist) return null;

    // 2. Distance Attenuation (Inverse distance with smooth clamp)
    const clampedDist = Math.max(refDist, dist);
    const distanceFactor = 1 / (1 + rolloff * ((clampedDist - refDist) / refDist));
    const finalVolume = Math.max(0, Math.min(1, distanceFactor * baseVolume));

    if (finalVolume < 0.002) return null;

    // 3. Directional Stereo Panning
    const horizontalDist = Math.hypot(dx, dz);
    let panValue = 0;
    if (horizontalDist > 0.05) {
      const normDx = dx / horizontalDist;
      const normDz = dz / horizontalDist;
      panValue = normDx * this.listenerRight.x + normDz * this.listenerRight.z;
      panValue = Math.max(-1.0, Math.min(1.0, panValue));
    }

    // 4. Air Absorption / High-frequency muffling
    // Distant sounds naturally lose highs (18000Hz down to 1600Hz at max distance)
    const distFraction = Math.min(1.0, dist / maxDist);
    const cutoffFreq = Math.max(1600, 18000 * (1 - distFraction * 0.88));

    const now = this.ctx.currentTime;

    // Filter Node
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffFreq, now);

    // Gain Node for distance volume
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(finalVolume, now);

    // Stereo Panner (with fallback if unavailable)
    let pannerNode: StereoPannerNode | GainNode;
    if (typeof this.ctx.createStereoPanner === 'function') {
      const sp = this.ctx.createStereoPanner();
      sp.pan.setValueAtTime(panValue, now);
      pannerNode = sp;
    } else {
      pannerNode = this.ctx.createGain();
    }

    // Connect chain
    filter.connect(gain);
    gain.connect(pannerNode);
    pannerNode.connect(this.masterGain);

    return { filter, gain, pan: pannerNode, now };
  }

  // ==========================================
  // POSITIONAL SOUNDS (Attenuated by Distance)
  // ==========================================

  /**
   * Footsteps with surface-dependent acoustics (grass, stone, wood, dirt, neon, water)
   */
  public playPositionalFootstep(
    x: number,
    y: number,
    z: number,
    surface: string = 'grass',
    isCreature: boolean = false
  ) {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: isCreature ? 3.0 : 1.5,
      maxDistance: isCreature ? 32.0 : 24.0,
      baseVolume: isCreature ? 0.35 : 0.22,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;
    const duration = isCreature ? 0.09 : 0.07;
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.15;

    // Surface-specific acoustic synthesis
    if (surface === 'stone' || surface === 'void_rock') {
      // Crisp click + noise
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(40 * pitchJitter, now + duration);
      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      osc.stop(now + duration);
    } else if (surface === 'wood') {
      // Warm resonant wood knock
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(80 * pitchJitter, now + duration);
      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      osc.stop(now + duration);
    } else if (surface === 'neon_cyan' || surface === 'neon_magenta' || surface === 'quantum_tech') {
      // Cybernetic glass / resonant energy pulse
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(180 * pitchJitter, now + duration);
      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      osc.stop(now + duration);
    } else {
      // Grass / Dirt: soft natural thud
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(30 * pitchJitter, now + duration);
      oscGain.gain.setValueAtTime(0.28, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      osc.stop(now + duration);
    }
  }

  /**
   * Hostile monster roars and growls (Void Golem, Shadow Beast, Glitch Spider)
   */
  public playPositionalGrowl(x: number, y: number, z: number, enemyType: string) {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 4.0,
      maxDistance: 55.0, // Long hearing radius for menacing atmosphere
      baseVolume: enemyType === 'void_golem' ? 0.75 : 0.55,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;

    if (enemyType === 'void_golem') {
      // Colossal Seismic Sub-Bass Grinding Roar
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(85, now);
      osc1.frequency.exponentialRampToValueAtTime(28, now + 0.65);

      osc2.frequency.setValueAtTime(42, now);
      osc2.frequency.exponentialRampToValueAtTime(18, now + 0.65);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(filter);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } else if (enemyType === 'glitch_spider') {
      // Rapid Electronic Glitch Skitter & Hiss
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.08);
      osc.frequency.linearRampToValueAtTime(600, now + 0.18);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.28);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + 0.32);
    } else {
      // Shadow Beast: Guttural dark growl
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.45);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  }

  /**
   * Block mining / shattering with 3D spatial attenuation
   */
  public playPositionalBlockMine(x: number, y: number, z: number, _blockId: string = 'stone') {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 2.5,
      maxDistance: 45.0,
      baseVolume: 0.5,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;

    // Noise buffer for block shatter
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const blockFilter = this.ctx.createBiquadFilter();
    blockFilter.type = 'bandpass';
    blockFilter.frequency.setValueAtTime(750, now);
    blockFilter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(blockFilter);
    blockFilter.connect(gain);
    gain.connect(filter);

    noise.start(now);
    noise.stop(now + 0.07);
  }

  /**
   * Block placement with 3D spatial attenuation
   */
  public playPositionalBlockPlace(x: number, y: number, z: number, _blockId: string = 'stone') {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 2.5,
      maxDistance: 40.0,
      baseVolume: 0.45,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Animal sounds (Cyber Dog, Quantum Sheep, Robo Chicken) with 3D spatial attenuation
   */
  public playPositionalAnimalSound(x: number, y: number, z: number, type: string) {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 2.5,
      maxDistance: 38.0,
      baseVolume: 0.4,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'cyber_dog') {
      // Bark: short sharp burst
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.09);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'robo_chicken') {
      // Cluck: brief chirpy pitch modulation
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Quantum Sheep: gentle cyber bleat
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(310, now + 0.22);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  /**
   * Enemy hit sound at exact world coordinates
   */
  public playPositionalEnemyHit(x: number, y: number, z: number) {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 3.0,
      maxDistance: 45.0,
      baseVolume: 0.5,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.setValueAtTime(130, now + 0.04);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Monster defeat sound at coordinates
   */
  public playPositionalMonsterDefeat(x: number, y: number, z: number, _enemyType?: string) {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 4.0,
      maxDistance: 60.0,
      baseVolume: 0.6,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;
    const notes = [329.63, 440, 587.33, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  /**
   * Jump pad spring sound at coordinates
   */
  public playPositionalBounce(x: number, y: number, z: number) {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 3.0,
      maxDistance: 45.0,
      baseVolume: 0.55,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.22);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Teleport pad vortex sound at coordinates
   */
  public playPositionalTeleport(x: number, y: number, z: number) {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 3.5,
      maxDistance: 50.0,
      baseVolume: 0.5,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.32);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Projectile wall/block impact sound at coordinates
   */
  public playPositionalImpact(x: number, y: number, z: number, weaponId: string = 'blaster') {
    const chain = this.createSpatialChain(x, y, z, {
      refDistance: 3.0,
      maxDistance: 45.0,
      baseVolume: 0.45,
    });
    if (!chain || !this.ctx) return;

    const { filter, now } = chain;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (weaponId === 'blaster') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    }

    osc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // ==========================================
  // NON-POSITIONAL / UI / LOCAL PLAYER SOUNDS
  // (Maintained for full backward compatibility)
  // ==========================================

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playBlockPlace(x?: number, y?: number, z?: number) {
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.playPositionalBlockPlace(x, y, z);
      return;
    }
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playBlockMine(x?: number, y?: number, z?: number) {
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.playPositionalBlockMine(x, y, z);
      return;
    }
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.06);
  }

  public playPointCollect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.06);
    osc.frequency.setValueAtTime(783.99, now + 0.12);
    osc.frequency.setValueAtTime(1046.5, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playBounce(x?: number, y?: number, z?: number) {
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.playPositionalBounce(x, y, z);
      return;
    }
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playTeleport(x?: number, y?: number, z?: number) {
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.playPositionalTeleport(x, y, z);
      return;
    }
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playSwordSlash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playLaserBlaster() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHammerSmash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBowShoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playEnemyHit(x?: number, y?: number, z?: number) {
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.playPositionalEnemyHit(x, y, z);
      return;
    }
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playPlayerHurt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playMonsterDefeat(x?: number, y?: number, z?: number) {
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.playPositionalMonsterDefeat(x, y, z);
      return;
    }
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [329.63, 440, 587.33, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playAnimalSound(type: string, x?: number, y?: number, z?: number) {
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.playPositionalAnimalSound(x, y, z, type);
      return;
    }
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'cyber_dog') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Minecraft-style Eating / Munching sound effect with satisfying swallow
   */
  public playEat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const baseNow = this.ctx.currentTime;
    // 3 crunchy bites
    [0, 0.09, 0.18].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const now = baseNow + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 240, now);
      osc.frequency.exponentialRampToValueAtTime(140 + Math.random() * 80, now + 0.07);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 + Math.random() * 600, now);
      filter.Q.setValueAtTime(2.5, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    });

    // Satisfying swallow chime
    const swallowNow = baseNow + 0.26;
    const oscSwallow = this.ctx.createOscillator();
    const gainSwallow = this.ctx.createGain();
    oscSwallow.type = 'sine';
    oscSwallow.frequency.setValueAtTime(440, swallowNow);
    oscSwallow.frequency.exponentialRampToValueAtTime(680, swallowNow + 0.16);
    gainSwallow.gain.setValueAtTime(0.22, swallowNow);
    gainSwallow.gain.exponentialRampToValueAtTime(0.001, swallowNow + 0.18);

    oscSwallow.connect(gainSwallow);
    gainSwallow.connect(this.masterGain);
    oscSwallow.start(swallowNow);
    oscSwallow.stop(swallowNow + 0.18);
  }

  /**
   * Dog/Wolf taming success chime (hearts melody)
   */
  public playTame() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const baseNow = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const now = baseNow + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.22);
    });
  }

  /**
   * Block chipping sound while progressively mining
   */
  public playBlockChip(surface: string = 'stone') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'wood') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260 + Math.random() * 50, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(750 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);
      gain.gain.setValueAtTime(0.18, now);
    }

    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Armor deflection sound when cyber-armor absorbs damage
   */
  public playArmorDefend() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.14);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public startAmbientMelody() {
    if (this.isMuted || this.musicPlaying) return;
    this.initContext();
    if (!this.ctx) return;
    this.musicPlaying = true;

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const freq = this.musicNotes[this.noteIdx % this.musicNotes.length];
      this.noteIdx = (this.noteIdx + 1 + Math.floor(Math.random() * 2)) % this.musicNotes.length;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.8);
    }, 900);
  }

  public stopAmbientMelody() {
    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicPlaying = false;
  }
}

export const sound = new SoundSystem();
