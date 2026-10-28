/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  X,
  Sparkles,
  User,
  Check,
  Palette,
  Scissors,
  Shirt,
  Shield,
  Smile,
  LayoutGrid,
} from 'lucide-react';
import { AvatarCustomization } from '../types/game';
import { createVoxelCharacter, VoxelCharacterInstance } from '../game/characterModel';
import {
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  SHIRT_COLORS,
  PANTS_COLORS,
  HEADWEAR_ITEMS,
  BACK_ACCESSORIES,
  FACE_EXPRESSIONS,
  AVATAR_PRESETS,
} from '../data/avatarOptions';
import { sound } from '../audio/soundSystem';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: AvatarCustomization;
  onSaveCustomization: (newConfig: AvatarCustomization) => void;
}

type TabType = 'presets' | 'piel' | 'cabello' | 'ropa' | 'cabeza' | 'espalda' | 'expresiones';

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  customization,
  onSaveCustomization,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [config, setConfig] = useState<AvatarCustomization>({ ...customization });
  const [currentAnim, setCurrentAnim] = useState<'idle' | 'walk' | 'jump' | 'dance'>('idle');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const characterRef = useRef<VoxelCharacterInstance | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Initialize 3D Live Preview
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = 280;
    const height = 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.35, 4.2);
    camera.lookAt(0, 1.15, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(amb);

    const dirLight = new THREE.DirectionalLight(0x00f5d4, 1.8);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xf72585, 1.2);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.15, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -0.08, 0);
    scene.add(pedestal);

    // Glowing circle on pedestal
    const ringGeo = new THREE.TorusGeometry(1.22, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.01, 0);
    scene.add(ring);

    // 3D character instance
    const char = createVoxelCharacter(config);
    scene.add(char.root);
    characterRef.current = char;

    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      if (char.root) {
        char.root.rotation.y += dt * 0.45;
      }

      const isMoving = currentAnim === 'walk';
      const isJumping = currentAnim === 'jump';
      char.updateAnimation(isMoving, isJumping, false, dt, currentAnim === 'dance' ? 'dance' : undefined);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, []);

  // Update 3D Character when config changes
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.updateCustomization(config);
    }
  }, [config]);

  const applyPreset = (presetConfig: AvatarCustomization) => {
    sound.playClick();
    setConfig({ ...presetConfig });
  };

  const handleSave = () => {
    sound.playFanfare();
    onSaveCustomization(config);
    onClose();
  };

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: 'presets', label: 'Plantillas', icon: LayoutGrid, count: AVATAR_PRESETS.length },
    { id: 'piel', label: 'Piel', icon: Palette, count: SKIN_TONES.length },
    { id: 'cabello', label: 'Cabello', icon: Scissors, count: HAIR_STYLES.length },
    { id: 'ropa', label: 'Ropa & Atuendo', icon: Shirt, count: SHIRT_COLORS.length },
    { id: 'cabeza', label: 'Sombreros & Cascos', icon: Shield, count: HEADWEAR_ITEMS.length },
    { id: 'espalda', label: 'Alas & Espalda', icon: Sparkles, count: BACK_ACCESSORIES.length },
    { id: 'expresiones', label: 'Expresiones', icon: Smile, count: FACE_EXPRESSIONS.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 md:p-6 select-none overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              Personalización Profunda de Avatar
              <span className="text-[11px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 hidden sm:inline">
                +140 Opciones
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personaliza cada faceta de Victoria Toro con más de 20 opciones por categoría
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Responsive Content: Flex row on desktop/tablet-landscape, Flex col on mobile */}
        <div className="mt-4 flex-1 flex flex-col md:flex-row gap-4 sm:gap-6 overflow-hidden min-h-0">
          {/* Left: 3D Preview Box */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 self-center md:self-start w-full md:w-[290px]">
            <div className="text-[11px] font-mono uppercase text-cyan-400 mb-1.5 flex items-center gap-1.5 font-bold">
              <User className="h-3.5 w-3.5" /> VISTA PREVIA 3D EN TIEMPO REAL
            </div>

            <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-inner bg-slate-950 w-[240px] h-[220px] sm:w-[280px] sm:h-[300px] flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Animation state buttons */}
            <div className="mt-2.5 flex items-center gap-1 w-full justify-center">
              {(['idle', 'walk', 'jump', 'dance'] as const).map((anim) => (
                <button
                  key={anim}
                  onClick={() => {
                    sound.playClick();
                    setCurrentAnim(anim);
                  }}
                  className={`px-2 py-1 text-[10px] sm:text-[11px] font-semibold rounded uppercase tracking-wider transition ${
                    currentAnim === anim
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {anim === 'idle' ? 'Quieto' : anim === 'walk' ? 'Caminar' : anim === 'jump' ? 'Salto' : 'Baile'}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Customization Controls with Category Tabs */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0">
            {/* Scrollable Tabs bar with Icons and Counts */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-thin flex-shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveTab(tab.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-800/80 text-slate-400">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body - Scrollable Container */}
            <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4">
              {/* 1. PRESETS */}
              {activeTab === 'presets' && (
                <div>
                  <div className="text-xs text-slate-400 mb-2.5">
                    Selecciona una plantilla completa inspirada en el universo de Victoria y el Cataclismo Creativo:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyPreset(p.config)}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-400 hover:bg-slate-900 text-left transition flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {p.badge}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 mb-1">{p.subtitle}</div>
                          <p className="text-[10px] text-slate-500 line-clamp-2">{p.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. PIEL (24 Skin Tones) */}
              {activeTab === 'piel' && (
                <div>
                  <div className="text-xs text-slate-400 mb-2.5">
                    Elige entre 24 tonos de piel vóxel (naturales, dorados de Victoria, cibernéticos y neón):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {SKIN_TONES.map((st) => {
                      const isSelected = config.skinColor === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => {
                            sound.playClick();
                            setConfig({ ...config, skinColor: st.id });
                          }}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2.5 ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/30 shadow-md shadow-cyan-950/40'
                              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className="h-7 w-7 rounded-lg border-2 border-slate-700/60 flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: st.value }}
                          />
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white truncate">{st.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{st.description}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-cyan-400 ml-auto flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. CABELLO (21 Styles + 22 Colors) */}
              {activeTab === 'cabello' && (
                <div className="space-y-4">
                  {/* Colors Palette */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Color de Cabello (22 tonalidades)
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      {HAIR_COLORS.map((hc) => {
                        const isSelected = config.hairColor === hc.id;
                        return (
                          <button
                            key={hc.id}
                            title={hc.name}
                            onClick={() => {
                              sound.playClick();
                              setConfig({ ...config, hairColor: hc.id });
                            }}
                            className={`h-7 w-7 rounded-lg border-2 transition ${
                              isSelected ? 'border-white scale-110 shadow-lg' : 'border-slate-700/60 hover:scale-105'
                            }`}
                            style={{ backgroundColor: hc.value }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Styles Grid */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Estilo de Peinado (21 cortes y peinados)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {HAIR_STYLES.map((hs) => {
                        const isSelected = config.hairStyle === hs.id;
                        return (
                          <button
                            key={hs.id}
                            onClick={() => {
                              sound.playClick();
                              setConfig({ ...config, hairStyle: hs.id });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-950/40 shadow-sm'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-white">{hs.name}</div>
                              <div className="text-[10px] text-slate-400">{hs.description}</div>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ROPA Y ATUENDO (24 Shirts + 24 Pants) */}
              {activeTab === 'ropa' && (
                <div className="space-y-4">
                  {/* Shirts & Jackets */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Camiseta / Chaqueta / Armadura (24 diseños)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {SHIRT_COLORS.map((sc) => {
                        const isSelected = config.shirtColor === sc.id;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => {
                              sound.playClick();
                              setConfig({ ...config, shirtColor: sc.id });
                            }}
                            className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-950/40'
                                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                            }`}
                          >
                            <div
                              className="h-6 w-6 rounded border border-slate-700/60 flex-shrink-0"
                              style={{ backgroundColor: sc.value }}
                            />
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-white truncate">{sc.name}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pants & Boots */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Pantalones / Botas / Armadura Inferior (24 colores)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {PANTS_COLORS.map((pc) => {
                        const isSelected = config.pantsColor === pc.id;
                        return (
                          <button
                            key={pc.id}
                            onClick={() => {
                              sound.playClick();
                              setConfig({ ...config, pantsColor: pc.id });
                            }}
                            className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-950/40'
                                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                            }`}
                          >
                            <div
                              className="h-6 w-6 rounded border border-slate-700/60 flex-shrink-0"
                              style={{ backgroundColor: pc.value }}
                            />
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-white truncate">{pc.name}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SOMBREROS Y CASCOS (21 Headwear items) */}
              {activeTab === 'cabeza' && (
                <div>
                  <div className="text-xs text-slate-400 mb-2.5">
                    Equipa visores holográficos, coronas, cascos y accesorios de cabeza (21 opciones):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {HEADWEAR_ITEMS.map((hw) => {
                      const isSelected = config.headwear === hw.id;
                      return (
                        <button
                          key={hw.id}
                          onClick={() => {
                            sound.playClick();
                            setConfig({ ...config, headwear: hw.id });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/40 shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{hw.name}</div>
                            <div className="text-[10px] text-slate-400">{hw.description}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. ALAS Y ESPALDA (21 Back Accessories) */}
              {activeTab === 'espalda' && (
                <div>
                  <div className="text-xs text-slate-400 mb-2.5">
                    Equipa alas que aletean en el aire, katanas, jetpacks o drones acompañantes (21 opciones):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {BACK_ACCESSORIES.map((ba) => {
                      const isSelected = config.backAccessory === ba.id;
                      return (
                        <button
                          key={ba.id}
                          onClick={() => {
                            sound.playClick();
                            setConfig({ ...config, backAccessory: ba.id });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/40 shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{ba.name}</div>
                            <div className="text-[10px] text-slate-400">{ba.description}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. EXPRESIONES FACIALES (21 Expressions) */}
              {activeTab === 'expresiones' && (
                <div>
                  <div className="text-xs text-slate-400 mb-2.5">
                    Modifica el rostro pixel-art procedural de tu avatar vóxel (21 expresiones):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {FACE_EXPRESSIONS.map((fe) => {
                      const isSelected = config.faceExpression === fe.id;
                      return (
                        <button
                          key={fe.id}
                          onClick={() => {
                            sound.playClick();
                            setConfig({ ...config, faceExpression: fe.id });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/40 shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{fe.name}</div>
                            <div className="text-[10px] text-slate-400">{fe.description}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer - Clean, Responsive, never cut off */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 flex-shrink-0">
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/30 transition whitespace-nowrap cursor-pointer active:scale-95"
              >
                <Check className="h-4 w-4" /> Guardar y Aplicar Avatar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
