/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Calendar, Flame, Trophy, Clock, CheckCircle, Gift, Sparkles } from 'lucide-react';
import { WeeklyEvent } from '../types/game';
import { sound } from '../audio/soundSystem';

interface WeeklyEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: WeeklyEvent;
  onClaimChallenge: (challengeId: string) => void;
}

export const WeeklyEventModal: React.FC<WeeklyEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onClaimChallenge,
}) => {
  if (!isOpen) return null;

  const pct = Math.min(100, Math.round((event.communityProgress / event.communityGoal) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 select-none overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] my-auto overflow-hidden rounded-2xl border border-pink-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{event.title}</h2>
                <span className="text-[10px] uppercase font-mono bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Quedan {event.timeLeftHours}h
                </span>
              </div>
              <p className="text-xs text-slate-400">{event.subtitle}</p>
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

        {/* Event Story Description */}
        <div className="mt-4 rounded-xl border border-pink-500/30 bg-pink-950/20 p-4 text-xs text-pink-200">
          <p>{event.description}</p>
        </div>

        {/* Global Community Goal Bar */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-400" /> Meta Global Comunitaria (Cross-Play Multijugador)
            </span>
            <span className="font-mono text-cyan-300 tabular-nums">
              {event.communityProgress.toLocaleString()} / {event.communityGoal.toLocaleString()} Bloques ({pct}%)
            </span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Milestones list */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            {event.milestones.map((ms, i) => (
              <div
                key={i}
                className={`rounded-lg p-2 text-xs border ${
                  ms.unlocked
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                  <span>{ms.target.toLocaleString()} BLOQUES</span>
                  {ms.unlocked ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Gift className="h-3.5 w-3.5" />}
                </div>
                <div className="font-semibold text-white">{ms.reward}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Challenges */}
        <div className="mt-4">
          <div className="text-xs font-mono uppercase text-cyan-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> TUS DESAFÍOS INDIVIDUALES DE LA SEMANA
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {event.challenges.map((ch) => {
              const isDone = ch.completed || ch.progress >= ch.target;
              return (
                <div
                  key={ch.id}
                  className={`rounded-xl border p-3 flex flex-col justify-between ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/70'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white mb-1">{ch.title}</div>
                    <div className="text-[11px] text-amber-300 font-mono">
                      Recompensa: +{ch.rewardPoints} Puntos Toro
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400">
                      Progreso: {ch.progress} / {ch.target}
                    </span>

                    {isDone ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Completado
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">En curso</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Volver a la Aventura
          </button>
        </div>
      </div>
    </div>
  );
};
