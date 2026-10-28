/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Play, User, Globe, Sparkles, Gamepad2, Layers, Cpu, Maximize2, Minimize2 } from 'lucide-react';
import { sound } from '../audio/soundSystem';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenAvatarCustomizer: () => void;
  onOpenWorldEditor: () => void;
  onOpenStory: () => void;
  totalPoints: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenAvatarCustomizer,
  onOpenWorldEditor,
  onOpenStory,
  totalPoints,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    sound.playClick();
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const activeFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (!activeFs && !isFullscreen) {
      try {
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        }
      } catch {
        // Fallback state for mobile browsers
      }
      setIsFullscreen(true);
    } else {
      try {
        if (doc.exitFullscreen && doc.fullscreenElement) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen && doc.webkitFullscreenElement) {
          await doc.webkitExitFullscreen();
        }
      } catch {
        // Ignore
      }
      setIsFullscreen(false);
    }
  };

  // Listen for Enter or Space to quickly launch the game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        sound.playFanfare();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-6 md:p-10 select-none pointer-events-auto bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/85 overflow-y-auto">
      {/* Top Bar: Minimal spec badge and status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              TOROVERSE ENGINE · CROSS-PLAY 60FPS
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-2">
              <span>PC / Móvil / Tablet / Consola</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-amber-300 font-mono tabular-nums">{totalPoints.toLocaleString()} PTS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition cursor-pointer ${
              isFullscreen
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 hover:bg-amber-500/35'
                : 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 hover:bg-cyan-500/30'
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-amber-300" /> Modo Normal
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-cyan-300" /> Pantalla Completa
              </>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenStory();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 text-[11px] sm:text-xs font-semibold transition"
          >
            <Sparkles className="h-3.5 w-3.5" /> Bitácora de Victoria
          </button>
        </div>
      </div>

      {/* Center: Bespoke Inline SVG Title Lockup over negative space */}
      <div className="flex flex-col items-center justify-center text-center my-auto py-4">
        <div className="relative max-w-2xl px-4 py-2">
          {/* Bespoke SVG Title Lockup */}
          <svg viewBox="0 0 760 140" className="w-full h-auto drop-shadow-[0_10px_25px_rgba(0,245,212,0.35)]">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5d4" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#f72585" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fee440" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Stylized Voxel Blocks Icon Accent in SVG */}
            <g transform="translate(14, 25)">
              <polygon points="25,5 45,18 25,31 5,18" fill="#00f5d4" opacity="0.9" />
              <polygon points="5,18 25,31 25,55 5,42" fill="#00bbf9" opacity="0.9" />
              <polygon points="45,18 25,31 25,55 45,42" fill="#7209b7" opacity="0.9" />
            </g>

            {/* Main Wordmark */}
            <text
              x="75"
              y="62"
              fill="url(#titleGrad)"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="64"
              letterSpacing="6"
            >
              TOROVERSE
            </text>

            {/* Subtitle pill */}
            <rect x="78" y="78" width="560" height="28" rx="6" fill="#0f172a" opacity="0.85" stroke="#38bdf8" strokeWidth="1.5" />
            <text
              x="358"
              y="97"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, monospace"
              fontWeight="800"
              fontSize="14"
              letterSpacing="4"
              textAnchor="middle"
            >
              EL CATACLISMO CREATIVO · VICTORIA TORO
            </text>
          </svg>

          <p className="mt-3 text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Reconstruye el universo digital fracturado de Victoria Toro. Diseña islas colaborativas, programa mecanismos con scripting visual y personaliza tu avatar con Puntos Toro en el Mercado de Creadores.
          </p>
        </div>

        {/* Start Game CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <button
            onClick={() => {
              sound.playFanfare();
              sound.startAmbientMelody();
              onStartGame();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 font-black text-sm uppercase tracking-widest shadow-2xl shadow-cyan-400/50 hover:shadow-cyan-400/70 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Play className="h-5 w-5 fill-slate-950 group-hover:scale-110 transition" />
            Comenzar Aventura
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAvatarCustomizer();
            }}
            className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="h-4 w-4 text-cyan-400" />
            Personalizar Avatar
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenWorldEditor();
            }}
            className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-purple-400 text-slate-200 text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Globe className="h-4 w-4 text-purple-400" />
            Elegir Isla
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
        <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-cyan-400" />
          <span>WASD Mover · Espacio Salto · Click Minar/Construir · E Menú · Esc Pausa</span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono mt-2 sm:mt-0">
          Presiona <span className="text-cyan-400 font-bold border border-cyan-500/40 px-1.5 py-0.5 rounded bg-cyan-950/40">ESPACIO</span> o <span className="text-cyan-400 font-bold border border-cyan-500/40 px-1.5 py-0.5 rounded bg-cyan-950/40">ENTER</span> para jugar
        </div>
      </div>
    </div>
  );
};
