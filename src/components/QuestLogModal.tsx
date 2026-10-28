/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Gift,
  Compass,
  Hammer,
  Pickaxe,
  Sword,
  Zap,
  Sun,
  Shield,
  Sparkles,
  Flame,
  Globe,
  X,
  Award,
  ChevronRight,
} from 'lucide-react';
import { StoryQuest } from '../game/questSystem';
import { sound } from '../audio/soundSystem';

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: StoryQuest[];
  onClaimQuest: (questId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Hammer,
  Pickaxe,
  Sword,
  Zap,
  Sun,
  Shield,
  Sparkles,
  Flame,
  Globe,
};

export const QuestLogModal: React.FC<QuestLogModalProps> = ({
  isOpen,
  onClose,
  quests,
  onClaimQuest,
}) => {
  const [filterAct, setFilterAct] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  if (!isOpen) return null;

  const acts = [
    'Acto I: El Despertar',
    'Acto II: El Faro de la Esperanza',
    'Acto III: La Gran Restauración',
  ];

  const filteredQuests = quests.filter((q) => {
    if (filterAct !== 'all' && q.act !== filterAct) return false;
    if (filterStatus === 'pending' && q.completed) return false;
    if (filterStatus === 'completed' && !q.completed) return false;
    return true;
  });

  const totalCompleted = quests.filter((q) => q.completed).length;
  const unclaimedCount = quests.filter((q) => q.completed && !q.claimed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-950/95 border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_#00f5d4]">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Diario de Misiones
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300">
                  Victoria Toro
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reconstruye el universo digital paso a paso tras el Cataclismo Creativo.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Progreso de la Historia:</span>
            <span className="font-bold text-cyan-300 font-mono">
              {totalCompleted} / {quests.length} Misiones
            </span>
          </div>

          <div className="flex-1 max-w-xs h-2.5 rounded-full bg-slate-800 overflow-hidden relative border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_#00f5d4] transition-all duration-500 rounded-full"
              style={{ width: `${(totalCompleted / quests.length) * 100}%` }}
            />
          </div>

          {unclaimedCount > 0 && (
            <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Gift className="h-3.5 w-3.5" />
              <span>{unclaimedCount} Recompensa(s) Listas</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-900/30">
          {/* Act Filter */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => setFilterAct('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filterAct === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos los Actos
            </button>
            {acts.map((act) => (
              <button
                key={act}
                onClick={() => setFilterAct(act)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  filterAct === act
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {act.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterStatus === 'pending'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterStatus === 'completed'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completadas
            </button>
          </div>
        </div>

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
          {filteredQuests.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Award className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">No hay misiones en esta categoría.</p>
            </div>
          ) : (
            filteredQuests.map((quest) => {
              const IconComp = ICON_MAP[quest.icon] || Sparkles;
              const pct = Math.min(100, (quest.progress / quest.target) * 100);

              return (
                <div
                  key={quest.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    quest.claimed
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                      : quest.completed
                      ? 'bg-cyan-950/30 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${
                        quest.claimed
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : quest.completed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_#10b981]'
                          : 'bg-cyan-950 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                          {quest.act}
                        </span>
                        {quest.claimed && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Reclamada
                          </span>
                        )}
                        {quest.completed && !quest.claimed && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400 animate-pulse">
                            ¡Completada!
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{quest.description}</p>

                      {/* Progress bar */}
                      <div className="mt-2.5 flex items-center gap-2 max-w-md">
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              quest.completed
                                ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                                : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-300 font-bold tabular-nums">
                          {quest.progress} / {quest.target}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rewards & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-amber-300 font-extrabold flex items-center gap-0.5">
                        +{quest.rewardPoints} PTS
                      </span>
                      {quest.rewardFragments > 0 && (
                        <span className="text-cyan-300 font-bold flex items-center gap-0.5">
                          +{quest.rewardFragments} 💎
                        </span>
                      )}
                    </div>

                    {quest.completed && !quest.claimed ? (
                      <button
                        onClick={() => {
                          sound.playFanfare();
                          onClaimQuest(quest.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/30 active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Gift className="h-3.5 w-3.5" />
                        <span>Reclamar</span>
                      </button>
                    ) : quest.claimed ? (
                      <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Listo
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-slate-500">En progreso...</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
