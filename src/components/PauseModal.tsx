/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Volume2, VolumeX, Eye, Gamepad2, Keyboard, Smartphone, LogOut } from 'lucide-react';
import { sound } from '../audio/soundSystem';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onExitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFirstPerson: boolean;
  onToggleFirstPerson: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onExitToTitle,
  isMuted,
  onToggleMute,
  isFirstPerson,
  onToggleFirstPerson,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 select-none overflow-y-auto">
      <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col space-y-4 sm:space-y-5">
        {/* Title */}
        <div className="text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            TOROVERSE: EL CATACLISMO CREATIVO
          </div>
          <h2 className="text-2xl font-black text-white tracking-wider">JUEGO EN PAUSA</h2>
        </div>

        {/* Buttons List */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition"
          >
            <Play className="h-4 w-4 fill-white" /> Reanudar Juego
          </button>

          <button
            onClick={() => {
              onToggleMute();
              sound.playClick();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            {isMuted ? (
              <>
                <VolumeX className="h-4 w-4 text-red-400" /> Sonido: Silenciado
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-cyan-400" /> Sonido: Activado
              </>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleFirstPerson();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Eye className="h-4 w-4 text-purple-400" />
            Cámara: {isFirstPerson ? 'Primera Persona (FPS)' : 'Tercera Persona (Orbital)'}
          </button>
        </div>

        {/* Controls Reference */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs space-y-2">
          <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Gamepad2 className="h-3.5 w-3.5 text-cyan-400" /> Controles Multiplataforma
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5 text-slate-300" />
              <span>WASD / Espacio: Mover / Saltar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-cyan-300">Click Izq/Der:</span>
              <span>Minar / Construir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-slate-300" />
              <span>Móvil: Joystick Virtual + Botones</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="h-3.5 w-3.5 text-slate-300" />
              <span>Consola: Gamepad LS/RS + A/RT</span>
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={() => {
            sound.playClick();
            onExitToTitle();
          }}
          className="w-full py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-500/20 transition flex items-center justify-center gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" /> Salir a la Pantalla de Inicio
        </button>
      </div>
    </div>
  );
};
