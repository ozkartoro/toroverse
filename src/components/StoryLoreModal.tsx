/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { STORY_DIALOGUES } from '../data/marketplaceData';
import { sound } from '../audio/soundSystem';

interface StoryLoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  dialogueIndex: number;
  onNextDialogue: () => void;
  points: number;
}

export const StoryLoreModal: React.FC<StoryLoreModalProps> = ({
  isOpen,
  onClose,
  dialogueIndex,
  onNextDialogue,
  points,
}) => {
  if (!isOpen) return null;

  const currentStory = STORY_DIALOGUES[Math.min(dialogueIndex, STORY_DIALOGUES.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] my-auto overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Bitácora de Victoria Toro
              </h2>
              <p className="text-xs text-slate-400">
                La historia del Cataclismo Creativo y el Renacimiento del Toroverso
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

        {/* Narrative Box with Victoria's Portrait */}
        <div className="mt-5 rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5 flex gap-4 items-start">
          <div className="flex-shrink-0 flex flex-col items-center">
            {/* Victoria's Pixel Avatar Thumbnail */}
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-1 shadow-lg shadow-cyan-500/30 flex items-center justify-center text-slate-950 font-extrabold text-xl font-mono">
              VT
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 mt-1 uppercase">
              Victoria Toro
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-cyan-300">{currentStory.role}</span>
              <span className="text-[10px] font-mono text-slate-400">
                Entrada {dialogueIndex + 1} de {STORY_DIALOGUES.length}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed italic">
              "{currentStory.text}"
            </p>
          </div>
        </div>

        {/* Mission Objectives / Milestones */}
        <div className="mt-5 space-y-2">
          <div className="text-xs font-mono uppercase text-cyan-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> OBJETIVOS DE LA RECONSTRUCCIÓN DIGITAL
          </div>

          {[
            {
              title: 'Paso 1: Restaurar el Puente de la Isla Nexo',
              desc: 'Coloca bloques de madera o piedra para reparar la pasarela rota.',
              done: points >= 200,
            },
            {
              title: 'Paso 2: Activar el Super Salto hacia el Mirador',
              desc: 'Pisa la plataforma de salto de neón para alcanzar el faro superior.',
              done: points >= 500,
            },
            {
              title: 'Paso 3: Purificar el Fragmento Creativo Dorado',
              desc: 'Interactúa con el cristal dorado para generar 500 Puntos Toro.',
              done: points >= 1000,
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                step.done
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300'
              }`}
            >
              <div>
                <div className="font-bold">{step.title}</div>
                <div className="text-[11px] text-slate-400">{step.desc}</div>
              </div>
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white"
          >
            Cerrar
          </button>

          {dialogueIndex < STORY_DIALOGUES.length - 1 ? (
            <button
              onClick={() => {
                sound.playClick();
                onNextDialogue();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20"
            >
              Siguiente Entrada ➔
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
            >
              ¡Entendido, Victoria!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
