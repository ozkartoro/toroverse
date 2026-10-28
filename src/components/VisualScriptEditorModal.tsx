/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Play, Zap, ArrowRight, Sparkles, Volume2, MessageSquare, Compass, ShieldAlert } from 'lucide-react';
import { ScriptDefinition, ScriptTrigger, ScriptAction } from '../types/game';
import { sound } from '../audio/soundSystem';

interface VisualScriptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCoord: string;
  existingScript?: ScriptDefinition;
  onSaveScript: (script: ScriptDefinition) => void;
  onDeleteScript: (coord: string) => void;
}

export const VisualScriptEditorModal: React.FC<VisualScriptEditorModalProps> = ({
  isOpen,
  onClose,
  selectedCoord,
  existingScript,
  onSaveScript,
  onDeleteScript,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(existingScript?.name || 'Mecanismo Vóxel');
  const [trigger, setTrigger] = useState<ScriptTrigger>(existingScript?.trigger || 'on_step');
  const [action, setAction] = useState<ScriptAction>(existingScript?.action || 'bounce_player');
  const [paramNumber, setParamNumber] = useState<number>(existingScript?.paramNumber || 20);
  const [paramText, setParamText] = useState<string>(
    existingScript?.paramText || '¡Mecanismo activado con éxito!'
  );
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSave = () => {
    sound.playClick();
    onSaveScript({
      blockCoord: selectedCoord,
      name,
      trigger,
      action,
      paramNumber,
      paramText,
    });
    onClose();
  };

  const handleTest = () => {
    if (action === 'bounce_player') {
      sound.playBounce();
      setTestResult(`Simulación: Jugador impulsado a ${paramNumber}m/s de velocidad.`);
    } else if (action === 'give_points') {
      sound.playPointCollect();
      setTestResult(`Simulación: +${paramNumber} Puntos Toro otorgados con mensaje: "${paramText}"`);
    } else if (action === 'teleport_player') {
      sound.playTeleport();
      setTestResult('Simulación: Jugador teletransportado a la coordenada del spawn.');
    } else {
      sound.playFanfare();
      setTestResult('Simulación: Acción ejecutada correctamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] my-auto overflow-y-auto rounded-2xl border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl shadow-cyan-950/60 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Editor de Scripting Visual
                <span className="text-xs font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  Bloque [{selectedCoord}]
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Conecta nodos de eventos lógicos estilo Roblox/Scratch para dar vida a tus construcciones
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

        {/* Script Name */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre del Script / Mecanismo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
            placeholder="Ej. Trampolín de Salto 20m"
          />
        </div>

        {/* Node Flow Diagram Canvas */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 p-4 relative overflow-hidden">
          <div className="text-[10px] uppercase font-mono text-cyan-400/80 mb-3 tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> FLUJO DE NODOS LÓGICOS (TRIGGER ➔ CONDICIÓN ➔ ACCIÓN)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Node 1: Trigger */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 shadow-inner">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1 mb-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> 1. DISPARADOR (Trigger)
              </div>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as ScriptTrigger)}
                className="w-full bg-slate-900 border border-amber-500/30 rounded px-2.5 py-1.5 text-xs text-amber-200 focus:outline-none"
              >
                <option value="on_step">Al Pisar el Bloque</option>
                <option value="on_interact">Al Hacer Click / Interactuar</option>
                <option value="on_break">Al Destruir Bloque</option>
                <option value="timer_pulse">Pulso de Tiempo Continuo</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-2">
                {trigger === 'on_step' && 'Se activa cuando el avatar pisa la superficie del vóxel.'}
                {trigger === 'on_interact' && 'Se activa cuando el jugador presiona [F] o toca el bloque.'}
                {trigger === 'on_break' && 'Se activa cuando el bloque es minado o destruido.'}
                {trigger === 'timer_pulse' && 'Emite pulsos periódicos de ejecución en bucle.'}
              </p>
            </div>

            {/* Node 2: Connector Arrow */}
            <div className="flex flex-col items-center justify-center text-cyan-400 text-xs font-mono">
              <ArrowRight className="h-6 w-6 animate-pulse hidden md:block" />
              <div className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 mt-1">
                Conector Lógico
              </div>
            </div>

            {/* Node 3: Action */}
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3 shadow-inner">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1 mb-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> 2. ACCIÓN (Action)
              </div>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as ScriptAction)}
                className="w-full bg-slate-900 border border-cyan-500/30 rounded px-2.5 py-1.5 text-xs text-cyan-200 focus:outline-none"
              >
                <option value="bounce_player">Impulsar / Trampolín</option>
                <option value="teleport_player">Teletransportar al Spawn</option>
                <option value="give_points">Otorgar Puntos Toro</option>
                <option value="play_sound">Reproducir Sonido Especial</option>
                <option value="spawn_particles">Fuegos Artificiales Vóxel</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-2">
                {action === 'bounce_player' && 'Lanza al jugador hacia arriba simulando un trampolín.'}
                {action === 'teleport_player' && 'Warp instantáneo del avatar al punto de spawn.'}
                {action === 'give_points' && 'Recompensa de Puntos Toro para compras en el Mercado.'}
                {action === 'play_sound' && 'Genera efectos auditivos sintetizados por Web Audio.'}
                {action === 'spawn_particles' && 'Explosión de partículas cúbicas de neón radiante.'}
              </p>
            </div>
          </div>

          {/* Action Parameters */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
            {action === 'bounce_player' && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Fuerza de Salto: <span className="text-cyan-400 font-bold">{paramNumber} m/s</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="35"
                  value={paramNumber}
                  onChange={(e) => setParamNumber(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}

            {action === 'give_points' && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Puntos Toro a Otorgar: <span className="text-amber-400 font-bold">+{paramNumber} PTS</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={paramNumber}
                  onChange={(e) => setParamNumber(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Mensaje en Pantalla / Notificación al Jugador
              </label>
              <input
                type="text"
                value={paramText}
                onChange={(e) => setParamText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Test Result feedback */}
        {testResult && (
          <div className="mt-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 p-2.5 text-xs text-cyan-300 flex items-center justify-between">
            <span>{testResult}</span>
            <button
              onClick={() => setTestResult(null)}
              className="text-slate-400 hover:text-white text-[10px] ml-2"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-6 flex items-center justify-between pt-2">
          {existingScript ? (
            <button
              onClick={() => {
                sound.playClick();
                onDeleteScript(selectedCoord);
                onClose();
              }}
              className="text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded border border-red-500/30 hover:bg-red-950/30 transition"
            >
              Eliminar Script
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition"
            >
              <Play className="h-3.5 w-3.5 text-cyan-400" /> Probar Lógica
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> Guardar en Bloque
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
