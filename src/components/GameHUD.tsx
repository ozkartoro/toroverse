/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  User,
  Globe,
  Zap,
  Flame,
  Pause,
  ChevronDown,
  ChevronUp,
  Pickaxe,
  Hammer,
  MessageSquare,
  Volume2,
  VolumeX,
  Smartphone,
  Heart,
  Sword,
  Crosshair,
  Shield,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Sparkles,
  CloudRain,
  CloudSnow,
  Wind,
  Cloud,
  BookOpen,
  Award,
  CheckCircle2,
  Package,
  Maximize2,
  Minimize2,
  Utensils,
} from 'lucide-react';
import { BlockId, MaterialId, MaterialInventory, VoxelWorldData, WeaponId } from '../types/game';
import { BLOCK_DEFINITIONS } from '../game/blockDefinitions';
import { WEAPON_DEFINITIONS } from '../game/combatAndCreatures';
import { sound } from '../audio/soundSystem';
import { DayNightState } from '../game/dayNightCycle';
import { MiniMap, MinimapPOI, MinimapEnemy } from './MiniMap';
import { WeatherConfig } from '../game/weatherSystem';
import { StoryQuest } from '../game/questSystem';

interface GameHUDProps {
  points: number;
  activeWorld: VoxelWorldData;
  activeBlock: BlockId;
  onSelectBlock: (blockId: BlockId) => void;
  toolMode: 'combat' | 'place' | 'mine' | 'script';
  onSetToolMode: (mode: 'combat' | 'place' | 'mine' | 'script') => void;
  health: number;
  maxHealth: number;
  equippedWeapon: WeaponId;
  onSelectWeapon: (weapon: WeaponId) => void;
  onAttack: () => void;
  onOpenAvatar: () => void;
  onOpenWorldEditor: () => void;
  onOpenScriptEditor: () => void;
  onOpenMarketplace: () => void;
  onOpenWeeklyEvent: () => void;
  onOpenStory: () => void;
  onOpenEmotes: () => void;
  activeEmote: string | null;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  recentChat: { sender: string; msg: string; platform: string } | null;
  notificationMessage: string | null;
  // Dynamic Day/Night Cycle controls
  dayNightState?: DayNightState | null;
  onAdvanceDayNightTime?: (hours: number) => void;
  onToggleDayNightAuto?: () => void;
  onSetDayNightHour?: (hour: number) => void;
  // Dynamic Weather System props
  weatherConfig?: WeatherConfig;
  onCycleWeather?: () => void;
  onToggleWeatherAuto?: () => void;
  // Dynamic Quest System props
  activeQuest?: StoryQuest;
  unclaimedQuestsCount?: number;
  onOpenQuestLog?: () => void;
  onClaimQuest?: (questId: string) => void;
  // Dynamic Mini-map radar props
  minimapEnemies?: MinimapEnemy[];
  minimapPois?: MinimapPOI[];
  playerX?: number;
  playerY?: number;
  playerZ?: number;
  playerYaw?: number;
  // Touch / Mobile handlers
  isMobileTouch: boolean;
  onTouchStickMove: (x: number, y: number) => void;
  onTouchJump: () => void;
  onTouchAction: () => void;
  // Material Inventory & Crafting
  materialInventory?: MaterialInventory;
  onOpenCrafting?: () => void;
  onEatFood?: () => void;
}

const HOTBAR_BLOCKS: BlockId[] = [
  'grass',
  'dirt',
  'stone',
  'wood',
  'neon_cyan',
  'neon_magenta',
  'crystal_gold',
  'quantum_tech',
  'jump_pad',
  'teleport_pad',
];

const WEAPONS_LIST: WeaponId[] = ['sword', 'blaster', 'hammer', 'bow'];

export const GameHUD: React.FC<GameHUDProps> = ({
  points,
  activeWorld,
  activeBlock,
  onSelectBlock,
  toolMode,
  onSetToolMode,
  health,
  maxHealth,
  equippedWeapon,
  onSelectWeapon,
  onAttack,
  onOpenAvatar,
  onOpenWorldEditor,
  onOpenScriptEditor,
  onOpenMarketplace,
  onOpenWeeklyEvent,
  onOpenStory,
  onOpenEmotes,
  activeEmote,
  onPause,
  isMuted,
  onToggleMute,
  recentChat,
  notificationMessage,
  dayNightState,
  onAdvanceDayNightTime,
  onToggleDayNightAuto,
  onSetDayNightHour,
  weatherConfig,
  onCycleWeather,
  onToggleWeatherAuto,
  activeQuest,
  unclaimedQuestsCount,
  onOpenQuestLog,
  onClaimQuest,
  minimapEnemies,
  minimapPois,
  playerX,
  playerY,
  playerZ,
  playerYaw,
  isMobileTouch,
  onTouchStickMove,
  onTouchJump,
  onTouchAction,
  materialInventory,
  onOpenCrafting,
  onEatFood,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(() => {
    return (
      isMobileTouch ||
      (typeof window !== 'undefined' && (window.innerWidth < 1024 || window.innerHeight < 600))
    );
  });
  const totalStoredMaterials = materialInventory
    ? (Object.values(materialInventory) as Array<number | undefined>).reduce<number>(
        (acc, v) => acc + (v ?? 0),
        0
      )
    : 0;
  const [forceTouchControls, setForceTouchControls] = useState<boolean>(() => {
    return (
      isMobileTouch ||
      (typeof window !== 'undefined' && (window.innerWidth < 1024 || window.innerHeight < 600))
    );
  });
  const [stickActive, setStickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state when user presses ESC or browser exits fullscreen
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement;
      if (!fsElement && isFullscreen) {
        setIsFullscreen(false);
        document.body.classList.remove('tv-pseudo-fullscreen');
      } else if (fsElement && !isFullscreen) {
        setIsFullscreen(true);
        document.body.classList.add('tv-pseudo-fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isFullscreen]);

  const handleToggleFullscreen = async () => {
    sound.playClick();
    const doc = document as any;
    const elem = document.documentElement as any;
    const isCurrentlyNativeFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (!isFullscreen && !isCurrentlyNativeFs) {
      setIsFullscreen(true);
      setDockCollapsed(true);
      document.body.classList.add('tv-pseudo-fullscreen');
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
      } catch (_) {
        // Fallback immersive mode on iOS Safari where native Fullscreen API is restricted
      }
    } else {
      setIsFullscreen(false);
      document.body.classList.remove('tv-pseudo-fullscreen');
      try {
        if (doc.exitFullscreen && doc.fullscreenElement) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen && doc.webkitFullscreenElement) {
          await doc.webkitExitFullscreen();
        }
      } catch (_) {}
    }
  };

  const showTouchControls = forceTouchControls || isMobileTouch;
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const isLowHealth = healthPercent < 30;

  const handleTouchStartStick = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateStick(touch.clientX - centerX, touch.clientY - centerY);
    setStickActive(true);
  };

  const handleTouchMoveStick = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!stickActive) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateStick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleTouchEndStick = () => {
    setStickActive(false);
    setStickPos({ x: 0, y: 0 });
    onTouchStickMove(0, 0);
  };

  const updateStick = (dx: number, dy: number) => {
    const maxR = 36;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;
    setStickPos({ x: nx, y: ny });
    onTouchStickMove(nx / maxR, ny / maxR);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-1.5 sm:p-3.5 md:p-5 overflow-hidden">
      {/* Reticle / Crosshair in Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <div className="relative w-6 h-6 flex items-center justify-center">
          {toolMode === 'combat' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e] border border-white" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f5d4]" />
          )}
          <div className="absolute w-5 h-0.5 bg-cyan-400/50" />
          <div className="absolute h-5 w-0.5 bg-cyan-400/50" />
        </div>
      </div>

      {/* Top Bar Perimeter Cluster (Compact on mobile to maximize 3D viewport) */}
      <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2 w-full z-20">
        {/* Top-Left: Player, Health Bar & Island Cluster */}
        <div className="pointer-events-auto flex flex-col gap-1 max-w-[235px] sm:max-w-md">
          {isFullscreen ? (
            /* Ultra-compact status pill in Fullscreen Mode */
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/75 border border-cyan-500/30 px-2.5 py-1 shadow-md backdrop-blur-sm">
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                <Heart className="h-3 w-3 fill-current" />
                <span>{health}/{maxHealth}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="text-[11px] font-mono font-extrabold text-amber-300 tabular-nums">
                {points.toLocaleString()} PTS
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 sm:gap-2 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-cyan-500/30 p-1.5 sm:p-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenStory();
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition text-left min-w-0"
                >
                  <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-[10px] sm:text-sm shadow-md shadow-cyan-500/30 flex-shrink-0">
                    VT
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="text-[11px] sm:text-sm font-bold text-white flex items-center gap-1 truncate">
                      <span className="truncate">Victoria Toro</span>
                      <span className="hidden sm:inline-block text-[9px] font-mono text-cyan-300 font-normal bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        Nivel 5
                      </span>
                    </div>
                    <div className="hidden sm:block text-[11px] text-slate-400 font-medium truncate">
                      {activeWorld.name.split(':')[0]}
                    </div>
                  </div>
                </button>

                <div className="h-4 sm:h-6 w-px bg-slate-800 mx-0.5 flex-shrink-0" />

                {/* In-game Points readout */}
                <div className="text-right flex-shrink-0">
                  <div className="hidden sm:block text-[9px] uppercase font-mono text-amber-400/80">Puntos Toro</div>
                  <div className="text-[10px] sm:text-sm font-extrabold text-amber-300 font-mono tabular-nums">
                    {points.toLocaleString()} PTS
                  </div>
                </div>
              </div>

              {/* Health Bar (Barra de Salud de Victoria) */}
              <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1 border-t border-slate-800/80">
                <div
                  className={`flex items-center justify-center rounded-md p-0.5 sm:p-1 ${
                    isLowHealth ? 'bg-rose-500/30 text-rose-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <Heart className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current" />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono leading-none">
                    <span className="font-bold text-slate-300">SALUD</span>
                    <span className={`font-bold ${isLowHealth ? 'text-rose-400 animate-bounce' : 'text-emerald-400'}`}>
                      {health}/{maxHealth} HP
                    </span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-800 overflow-hidden relative shadow-inner">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        healthPercent > 50
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_8px_#10b981]'
                          : healthPercent > 25
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_#f59e0b]'
                          : 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'
                      }`}
                      style={{ width: `${healthPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification message */}
          {notificationMessage && (
            <div className="rounded-lg sm:rounded-xl bg-cyan-950/90 border border-cyan-400/50 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs text-cyan-200 font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1.5 max-w-[230px] sm:max-w-sm truncate">
              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{notificationMessage}</span>
            </div>
          )}

          {/* Active Story Quest Tracker Widget */}
          {activeQuest && (
            <div
              onClick={() => {
                sound.playClick();
                onOpenQuestLog?.();
              }}
              className="cursor-pointer group rounded-2xl bg-slate-950/90 border border-amber-500/40 p-2.5 sm:p-3 shadow-xl backdrop-blur-sm transition-all hover:border-amber-400 hover:bg-slate-900/95"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition" />
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-300">
                    Misión Activa • {String(activeQuest.act) === '1' ? 'Acto I' : String(activeQuest.act) === '2' ? 'Acto II' : 'Acto III'}
                  </span>
                </div>
                {activeQuest.completed && !activeQuest.claimed ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playFanfare();
                      onClaimQuest?.(activeQuest.id);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider animate-bounce shadow-md shadow-emerald-500/40 hover:bg-emerald-400 transition"
                  >
                    ¡Reclamar!
                  </button>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {Math.min(activeQuest.target, Math.floor(activeQuest.progress))} / {activeQuest.target}
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-white group-hover:text-amber-200 transition line-clamp-1">
                {activeQuest.title}
              </div>
              <div className="text-[10px] text-slate-300 line-clamp-1 mb-1.5">
                {activeQuest.description}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative shadow-inner">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    activeQuest.completed
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_8px_#34d399]'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  }`}
                  style={{ width: `${Math.min(100, (activeQuest.progress / activeQuest.target) * 100)}%` }}
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Recompensa: +{activeQuest.rewardPoints} PTS</span>
                <span className="text-amber-300/80 group-hover:underline">Ver Diario [J] →</span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Day/Night Celestial Clock Bar (Hidden in Fullscreen mode to maximize 3D view) */}
        {dayNightState && !isFullscreen && (
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800/80 p-1 sm:px-3 sm:py-2 shadow-lg backdrop-blur-sm">
            <button
              onClick={() => {
                sound.playClick();
                onAdvanceDayNightTime?.(3);
              }}
              title="Avanzar 3 horas en el ciclo celestre"
              className="flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition group"
            >
              <div
                className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all ${
                  dayNightState.phase === 'dawn'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_#f59e0b]'
                    : dayNightState.phase === 'day'
                    ? 'bg-sky-500/20 text-yellow-300 border-sky-400/40 shadow-[0_0_12px_#38bdf8]'
                    : dayNightState.phase === 'dusk'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_#f43f5e]'
                    : 'bg-indigo-950 text-cyan-300 border-indigo-500/40 shadow-[0_0_12px_#6366f1]'
                }`}
              >
                {dayNightState.phase === 'dawn' && <Sunrise className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />}
                {dayNightState.phase === 'day' && <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin-slow" />}
                {dayNightState.phase === 'dusk' && <Sunset className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />}
                {dayNightState.phase === 'night' && <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />}
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="font-mono font-extrabold text-white text-[11px] sm:text-sm tracking-wide">
                    {dayNightState.formattedTime}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border font-mono hidden md:inline-block ${
                      dayNightState.phase === 'dawn'
                        ? 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                        : dayNightState.phase === 'day'
                        ? 'bg-sky-950/70 text-sky-300 border-sky-500/30'
                        : dayNightState.phase === 'dusk'
                        ? 'bg-rose-950/70 text-rose-300 border-rose-500/30'
                        : 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {dayNightState.phaseLabel}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium hidden lg:block">
                  {dayNightState.isAutoAdvancing ? 'Ciclo continuo (24h)' : 'Tiempo fijado'}
                </div>
              </div>
            </button>

            {/* Quick celestial presets & Auto toggle (Hidden on small mobile screens to save space) */}
            <div className="hidden lg:flex items-center gap-1 border-l border-slate-800/90 pl-2 ml-1">
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleDayNightAuto?.();
                }}
                title={dayNightState.isAutoAdvancing ? 'Pausar ciclo dinámico' : 'Reanudar ciclo dinámico'}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                  dayNightState.isAutoAdvancing
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {dayNightState.isAutoAdvancing ? 'AUTO' : 'FIJO'}
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onSetDayNightHour?.(6.25);
                }}
                title="Amanecer (06:15)"
                className="p-1.5 rounded-lg hover:bg-slate-900 text-amber-400/80 hover:text-amber-300 transition"
              >
                <Sunrise className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onSetDayNightHour?.(12.0);
                }}
                title="Mediodía Solar (12:00)"
                className="p-1.5 rounded-lg hover:bg-slate-900 text-yellow-400/80 hover:text-yellow-300 transition"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onSetDayNightHour?.(18.75);
                }}
                title="Atardecer Carmesí (18:45)"
                className="p-1.5 rounded-lg hover:bg-slate-900 text-rose-400/80 hover:text-rose-300 transition"
              >
                <Sunset className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onSetDayNightHour?.(0.0);
                }}
                title="Noche Cuántica (00:00)"
                className="p-1.5 rounded-lg hover:bg-slate-900 text-indigo-400/80 hover:text-indigo-300 transition"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Weather System Indicator & Controls */}
        {weatherConfig && !isFullscreen && (
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-slate-950/85 border border-slate-800/80 p-1.5 sm:px-3 sm:py-2 shadow-xl backdrop-blur-sm">
            <button
              onClick={() => {
                sound.playClick();
                onCycleWeather?.();
              }}
              title="Cambiar Clima Dinámico (Despejado / Lluvia / Nieve / Tormenta de Arena)"
              className="flex items-center gap-2 hover:opacity-90 transition group text-left"
            >
              <div
                className={`p-1.5 rounded-xl border flex items-center justify-center transition-all ${
                  weatherConfig.type === 'rain'
                    ? 'bg-blue-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_#38bdf8]'
                    : weatherConfig.type === 'snow'
                    ? 'bg-sky-200/20 text-white border-sky-300/40 shadow-[0_0_12px_#bae6fd]'
                    : weatherConfig.type === 'sandstorm'
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_#f59e0b]'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_#10b981]'
                }`}
              >
                {weatherConfig.type === 'rain' && <CloudRain className="h-4 w-4 animate-bounce text-cyan-400" />}
                {weatherConfig.type === 'snow' && <CloudSnow className="h-4 w-4 animate-pulse text-sky-200" />}
                {weatherConfig.type === 'sandstorm' && <Wind className="h-4 w-4 animate-spin-slow text-amber-400" />}
                {weatherConfig.type === 'clear' && <Cloud className="h-4 w-4 text-emerald-400" />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-white text-xs sm:text-sm tracking-wide">
                    {weatherConfig.name}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border font-mono ${
                      weatherConfig.speedMultiplier < 1.0
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {weatherConfig.speedMultiplier < 1.0
                      ? `-${Math.round((1 - weatherConfig.speedMultiplier) * 100)}% Vel`
                      : '100% Vel'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium hidden sm:block">
                  {weatherConfig.description}
                </div>
              </div>
            </button>

            {onToggleWeatherAuto && (
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleWeatherAuto();
                }}
                title="Cambiar modo de clima automático/manual"
                className="px-1.5 py-1 ml-1 rounded-lg text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/40 transition"
              >
                CICLAR
              </button>
            )}
          </div>
        )}

        {/* Top-Right: Action Icons & Mini-Map Column */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            {/* Primary Fullscreen / Normal Mode Toggle Button (First for maximum visibility) */}
            <button
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Volver al Modo Normal' : 'Ver en Pantalla Completa'}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-extrabold transition shadow-lg backdrop-blur-sm cursor-pointer ${
                isFullscreen
                  ? 'bg-gradient-to-r from-amber-500/35 to-orange-500/35 border-amber-300 text-amber-100 hover:from-amber-500/50 hover:to-orange-500/50 shadow-amber-500/30 ring-1 ring-amber-400/50'
                  : 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 border-cyan-300/80 text-cyan-100 hover:from-cyan-500/45 hover:to-blue-600/45 shadow-cyan-500/25'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 animate-pulse" />
                  <span>Modo Normal</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-300" />
                  <span>Pantalla Completa</span>
                </>
              )}
            </button>

            {/* Storage & Crafting Button */}
            {onOpenCrafting && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenCrafting();
                }}
                className="relative flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 border border-emerald-400/60 text-emerald-300 hover:bg-emerald-900/60 text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm cursor-pointer"
              >
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span className="hidden sm:inline">Almacén /</span>
                <span>Unir</span>
                <span className="rounded-md bg-emerald-500/25 border border-emerald-400/40 px-1 py-0.2 text-[9px] sm:text-[10px] font-mono font-black text-emerald-200">
                  {totalStoredMaterials}
                </span>
              </button>
            )}

            {/* Quick Eat Food Button */}
            {onEatFood && (materialInventory?.neon_meat ?? 0) > 0 && (
              <button
                onClick={onEatFood}
                title="Consumir Carne Neón [Q] (+28 HP)"
                className="relative flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl bg-gradient-to-r from-rose-950/90 to-amber-950/90 border border-rose-400/60 text-rose-200 hover:bg-rose-900/60 text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm cursor-pointer animate-pulse"
              >
                <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-400" />
                <span>Comer</span>
                <span className="rounded-md bg-rose-500/30 border border-rose-400/40 px-1 py-0.2 text-[9px] sm:text-[10px] font-mono font-black text-rose-100">
                  x{materialInventory?.neon_meat}
                </span>
              </button>
            )}

            {/* Story Quest Log Button (Compact on desktop) */}
            {onOpenQuestLog && !isFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenQuestLog();
                }}
                className="hidden md:flex relative items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl bg-slate-950/85 border border-amber-500/40 text-amber-300 hover:bg-amber-950/40 text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                <span className="hidden md:inline">Diario [J]</span>
                {(unclaimedQuestsCount ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-bounce shadow-[0_0_8px_#ef4444]">
                    {unclaimedQuestsCount}
                  </span>
                )}
              </button>
            )}

            {/* Weekly Event Pill Button */}
            {!isFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenWeeklyEvent();
                }}
                className="hidden md:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl bg-slate-950/85 border border-pink-500/40 text-pink-300 hover:bg-pink-950/40 text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm"
              >
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-400 animate-pulse" />
                <span className="hidden md:inline">Evento Neón</span>
              </button>
            )}

            {/* Marketplace Button */}
            {!isFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenMarketplace();
                }}
                className="hidden md:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl bg-slate-950/85 border border-amber-500/40 text-amber-300 hover:bg-amber-950/40 text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm"
              >
                <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                <span className="hidden md:inline">Mercado</span>
              </button>
            )}

            {/* Avatar Customizer Button */}
            {!isFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAvatar();
                }}
                className="hidden md:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl bg-slate-950/85 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Avatar</span>
              </button>
            )}

            {/* World Editor Button */}
            {!isFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenWorldEditor();
                }}
                className="hidden md:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl bg-slate-950/85 border border-purple-500/40 text-purple-300 hover:bg-purple-950/40 text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm"
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Islas</span>
              </button>
            )}

            {/* Emotes Button */}
            {!isFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenEmotes();
                }}
                className={`hidden md:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition shadow-lg backdrop-blur-sm ${
                  activeEmote
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border border-pink-300 shadow-pink-500/40 animate-pulse'
                    : 'bg-slate-950/85 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-950/40'
                }`}
              >
                <span className="text-xs sm:text-sm">💃</span>
                <span className="hidden md:inline">Emotes [B]</span>
              </button>
            )}

            {/* Toggle Touch Controls Button */}
            <button
              onClick={() => {
                sound.playClick();
                setForceTouchControls(!forceTouchControls);
              }}
              title="Activar/Desactivar Controles Táctiles en Pantalla"
              className={`p-1.5 sm:p-2 rounded-xl border transition shadow-lg backdrop-blur-sm ${
                showTouchControls
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-950/85 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {/* Audio toggle */}
            <button
              onClick={() => {
                onToggleMute();
                sound.playClick();
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-950/85 border border-slate-800 text-slate-300 hover:text-white transition shadow-lg backdrop-blur-sm"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />}
            </button>

            {/* Pause Button */}
            <button
              onClick={() => {
                sound.playClick();
                onPause();
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-950/85 border border-slate-800 text-slate-300 hover:text-white transition shadow-lg backdrop-blur-sm"
            >
              <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Dynamic Radar Mini-Map (Starts collapsed as a sleek pill on mobile, hidden in Fullscreen mode) */}
          {!isFullscreen && (
            <MiniMap
              playerX={playerX ?? 0}
              playerY={playerY ?? 0}
              playerZ={playerZ ?? 0}
              playerYaw={playerYaw ?? 0}
              enemies={minimapEnemies ?? []}
              pois={minimapPois ?? []}
              islandName={activeWorld.name}
            />
          )}
        </div>
      </div>

      {/* Middle-Left: Unobtrusive Chat Ticker (Hidden on compact mobile screens and Fullscreen mode to keep 3D view clear) */}
      {recentChat && !isFullscreen && (
        <div className="hidden md:block pointer-events-none my-auto max-w-xs sm:max-w-sm rounded-xl bg-slate-950/75 border border-slate-800 p-2 sm:p-2.5 text-xs text-slate-200 shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-[10px] sm:text-[11px] mb-0.5">
            <MessageSquare className="h-3 w-3" />
            <span>{recentChat.sender}</span>
            <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">
              {recentChat.platform}
            </span>
          </div>
          <p className="text-slate-300 text-[11px] sm:text-xs">{recentChat.msg}</p>
        </div>
      )}

      {/* Touch Controls Layer (Anchored safely above bottom bezel & safe-areas so buttons are NEVER cut off) */}
      {showTouchControls && (
        <div
          className="fixed pointer-events-none z-30 flex justify-between items-end"
          style={{
            bottom: 'max(14px, calc(env(safe-area-inset-bottom) + 10px))',
            left: 'max(14px, calc(env(safe-area-inset-left) + 8px))',
            right: 'max(14px, calc(env(safe-area-inset-right) + 8px))',
          }}
        >
          {/* Left: Ergonomic Virtual Joystick */}
          <div
            onTouchStart={handleTouchStartStick}
            onTouchMove={handleTouchMoveStick}
            onTouchEnd={handleTouchEndStick}
            className="pointer-events-auto h-20 w-20 rounded-full bg-slate-900/80 border-2 border-cyan-400/60 relative flex items-center justify-center touch-none shadow-2xl backdrop-blur-md"
          >
            <div
              className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border-2 border-white shadow-lg transition-transform duration-75 flex items-center justify-center text-[9px] font-mono font-black text-slate-950"
              style={{ transform: `translate(${stickPos.x * 0.8}px, ${stickPos.y * 0.8}px)` }}
            >
              MOVE
            </div>
          </div>

          {/* Right: Low-profile Ergonomic Action Cluster (Never cut off or hidden) */}
          <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2">
            {/* Quick Eat (if available) */}
            {onEatFood && (materialInventory?.neon_meat ?? 0) > 0 && (
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  onEatFood();
                }}
                onClick={() => onEatFood()}
                title="Comer Carne Neón (+28 HP)"
                className="h-11 w-11 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 text-white font-black text-[9px] shadow-lg flex flex-col items-center justify-center active:scale-95 cursor-pointer border border-amber-300 backdrop-blur-md"
              >
                <Utensils className="h-4 w-4" />
                <span className="text-[7px] leading-tight font-black">COMER</span>
              </button>
            )}

            {/* Weapon Switcher Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                const nextIdx = (WEAPONS_LIST.indexOf(equippedWeapon) + 1) % WEAPONS_LIST.length;
                onSelectWeapon(WEAPONS_LIST[nextIdx]);
                onSetToolMode('combat');
              }}
              onClick={() => {
                const nextIdx = (WEAPONS_LIST.indexOf(equippedWeapon) + 1) % WEAPONS_LIST.length;
                onSelectWeapon(WEAPONS_LIST[nextIdx]);
                onSetToolMode('combat');
              }}
              title="Cambiar Arma"
              className="h-11 px-2.5 rounded-2xl bg-slate-900/90 border border-purple-500/60 text-purple-200 font-bold text-[9px] shadow-lg flex flex-col items-center justify-center active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="text-[7px] text-purple-400 font-mono">ARMA</span>
              <span className="text-white font-black">{WEAPON_DEFINITIONS[equippedWeapon].name.split(' ')[0]}</span>
            </button>

            {/* Mode Switcher Button (Cycles: Combate -> Minar -> Construir) */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                sound.playClick();
                const modes: Array<'combat' | 'mine' | 'place'> = ['combat', 'mine', 'place'];
                const nextMode = modes[(modes.indexOf(toolMode as any) + 1) % modes.length];
                onSetToolMode(nextMode);
              }}
              onClick={() => {
                sound.playClick();
                const modes: Array<'combat' | 'mine' | 'place'> = ['combat', 'mine', 'place'];
                const nextMode = modes[(modes.indexOf(toolMode as any) + 1) % modes.length];
                onSetToolMode(nextMode);
              }}
              title="Cambiar Modo (Combate / Minar / Construir)"
              className="h-11 px-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/60 text-cyan-200 font-bold text-[9px] shadow-lg flex flex-col items-center justify-center active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="text-[7px] text-cyan-400 font-mono">MODO</span>
              <span className="text-white font-black">
                {toolMode === 'combat' ? '⚔️ Combate' : toolMode === 'mine' ? '⛏️ Minar' : '🔨 Poner'}
              </span>
            </button>

            {/* Jump Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onTouchJump();
              }}
              onClick={() => onTouchJump()}
              title="Salto"
              className="h-12 w-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black text-[10px] shadow-xl shadow-cyan-500/40 flex flex-col items-center justify-center active:scale-95 cursor-pointer border-2 border-white/70 backdrop-blur-md"
            >
              <span className="text-xs">⏫</span>
              <span className="text-[8px] leading-tight font-black">SALTO</span>
            </button>

            {/* Primary Action Button (Dynamic: Attack / Mine / Place) */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                if (toolMode === 'combat') {
                  onAttack();
                } else {
                  onTouchAction();
                }
              }}
              onClick={() => {
                if (toolMode === 'combat') {
                  onAttack();
                } else {
                  onTouchAction();
                }
              }}
              title={toolMode === 'combat' ? 'Atacar' : toolMode === 'mine' ? 'Minar' : 'Poner Bloque'}
              className={`h-14 w-14 rounded-full font-black text-[10px] shadow-2xl flex flex-col items-center justify-center active:scale-95 cursor-pointer border-2 transition-transform ${
                toolMode === 'combat'
                  ? 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white border-rose-300 shadow-rose-600/50'
                  : toolMode === 'mine'
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 border-amber-200 shadow-amber-500/50'
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 border-emerald-200 shadow-emerald-500/50'
              }`}
            >
              {toolMode === 'combat' ? (
                <>
                  <Sword className="h-5 w-5 mb-0.5" />
                  <span className="text-[9px] leading-tight">ATACAR</span>
                </>
              ) : toolMode === 'mine' ? (
                <>
                  <Pickaxe className="h-5 w-5 mb-0.5" />
                  <span className="text-[9px] leading-tight">MINAR</span>
                </>
              ) : (
                <>
                  <Hammer className="h-5 w-5 mb-0.5" />
                  <span className="text-[9px] leading-tight">PONER</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Unified Bottom Control Dock (Consolidated, Zero-occlusion, Collapsible on Desktop) */}
      <div className={`pointer-events-auto mx-auto w-full max-w-4xl flex flex-col items-center mt-auto z-20 ${showTouchControls ? 'hidden sm:flex' : 'flex'}`}>
        {/* Collapse / Expand Tab Button */}
        <button
          onClick={() => {
            sound.playClick();
            setDockCollapsed(!dockCollapsed);
          }}
          className="rounded-t-xl bg-slate-950/90 border-t border-x border-cyan-500/40 px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-cyan-300 hover:text-white transition flex items-center gap-1 shadow-md"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Mostrar Barra de Armas y Construcción
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Ocultar Barra (Modo Cine)
            </>
          )}
        </button>

        {/* The Dock */}
        {!dockCollapsed && (
          <div className="w-full rounded-2xl border border-cyan-500/40 bg-slate-950/90 p-2 sm:p-2.5 shadow-2xl backdrop-blur-md flex flex-col gap-2">
            {/* Top row: Mode selector & Weapons quick bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              {/* Tool Mode selector */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-shrink-0">
                <button
                  onClick={() => {
                    sound.playClick();
                    onSetToolMode('combat');
                  }}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    toolMode === 'combat'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sword className="h-3.5 w-3.5" /> Combate
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onSetToolMode('place');
                  }}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    toolMode === 'place'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hammer className="h-3.5 w-3.5" /> Construir
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onSetToolMode('mine');
                  }}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    toolMode === 'mine'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Pickaxe className="h-3.5 w-3.5" /> Minar
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onSetToolMode('script');
                    onOpenScriptEditor();
                  }}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    toolMode === 'script'
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" /> Scripting
                </button>

                {onOpenCrafting && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenCrafting();
                    }}
                    className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  >
                    <Package className="h-3.5 w-3.5" /> Unir [E] ({totalStoredMaterials})
                  </button>
                )}
              </div>

              {/* Weapons Arsenal selector */}
              <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                <span className="text-[10px] font-mono text-slate-400 px-1 hidden sm:inline">ARMA:</span>
                {WEAPONS_LIST.map((wId) => {
                  const wDef = WEAPON_DEFINITIONS[wId];
                  const isEquipped = equippedWeapon === wId;
                  return (
                    <button
                      key={wId}
                      onClick={() => {
                        sound.playClick();
                        onSelectWeapon(wId);
                        onSetToolMode('combat');
                      }}
                      title={`${wDef.name} (Daño: ${wDef.damage})`}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        isEquipped
                          ? 'bg-slate-800 text-white border border-rose-500 shadow-md shadow-rose-500/20'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: wDef.color }} />
                      <span>{wDef.name.split(' ')[0]}</span>
                      <span className="text-[9px] font-mono text-rose-400">{wDef.damage} DMG</span>
                    </button>
                  );
                })}

                {/* Direct Action trigger */}
                <button
                  onClick={() => onAttack()}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold shadow transition flex items-center gap-1 cursor-pointer"
                >
                  <Sword className="h-3 w-3" /> [F] Atacar
                </button>
              </div>
            </div>

            {/* Bottom row: Block Quick Slots (1-10) with horizontal scroll */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline flex-shrink-0">
                BLOQUES [1-9]:
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full pb-0.5 scrollbar-thin">
                {HOTBAR_BLOCKS.map((bId, idx) => {
                  const def = BLOCK_DEFINITIONS[bId];
                  const isSelected = activeBlock === bId && toolMode === 'place';
                  const storedCount = materialInventory?.[bId as MaterialId] ?? 0;
                  return (
                    <button
                      key={bId}
                      onClick={() => {
                        sound.playClick();
                        onSelectBlock(bId);
                        onSetToolMode('place');
                      }}
                      title={`${def.name} (Tecla ${idx + 1}) • Stock: ${storedCount}`}
                      className={`relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-xl border-2 transition flex items-center justify-center flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-white scale-110 shadow-lg shadow-cyan-400/50'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                      style={{ backgroundColor: def.color }}
                    >
                      <span className="absolute top-0.5 left-0.5 sm:left-1 text-[8px] sm:text-[9px] font-mono font-bold text-slate-950 bg-white/75 px-0.5 sm:px-1 rounded-sm">
                        {idx + 1}
                      </span>
                      <span className="absolute bottom-0 right-0.5 text-[8px] font-mono font-black text-white bg-slate-950/85 px-1 rounded-sm">
                        {storedCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
