/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  Hand,
  PartyPopper,
  Zap,
  Smile,
  Navigation,
  Laugh,
  RotateCw,
  StopCircle,
} from 'lucide-react';
import { GAME_EMOTES, EmoteDefinition } from '../data/emotesData';
import { sound } from '../audio/soundSystem';

interface EmoteSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEmote: string | null;
  onSelectEmote: (emote: EmoteDefinition) => void;
  onStopEmote: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Hand,
  PartyPopper,
  Zap,
  Smile,
  Navigation,
  Laugh,
  RotateCw,
};

export const EmoteSelectorModal: React.FC<EmoteSelectorModalProps> = ({
  isOpen,
  onClose,
  activeEmote,
  onSelectEmote,
  onStopEmote,
}) => {
  // Listen for keyboard number shortcuts 1-8 while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < GAME_EMOTES.length) {
        sound.playClick();
        onSelectEmote(GAME_EMOTES[idx]);
        onClose();
      } else if (e.key === 'Escape' || e.code === 'KeyB') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSelectEmote, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 select-none overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Selector de Emotes Multijugador
                <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  Tecla [B]
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Exprésate con animaciones rápidas e interactúa con otros jugadores en tiempo real
              </p>
            </div>
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

        {/* Active Emote Status & Stop Button */}
        {activeEmote && (
          <div className="mt-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>
                Emote activo:{' '}
                <strong className="text-white">
                  {GAME_EMOTES.find((e) => e.id === activeEmote)?.name || activeEmote}
                </strong>{' '}
                (Caminar o saltar lo cancela)
              </span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onStopEmote();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow"
            >
              <StopCircle className="h-3.5 w-3.5" /> Detener
            </button>
          </div>
        )}

        {/* Emotes Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GAME_EMOTES.map((emote) => {
            const Icon = ICON_MAP[emote.iconName] || Sparkles;
            const isPlaying = activeEmote === emote.id;

            return (
              <button
                key={emote.id}
                onClick={() => {
                  sound.playClick();
                  onSelectEmote(emote);
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group cursor-pointer active:scale-95 ${
                  isPlaying
                    ? 'border-cyan-400 bg-cyan-950/50 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg shadow-inner"
                    style={{ backgroundColor: `${emote.color}25`, color: emote.color }}
                  >
                    {emote.emoji}
                  </div>
                  {emote.shortcutKey && (
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                      [{emote.shortcutKey}]
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1">
                    {emote.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {emote.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Los jugadores cercanos reaccionarán a tus emotes en el chat</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
