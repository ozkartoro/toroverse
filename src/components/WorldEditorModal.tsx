/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Globe, Plus, Download, Upload, Save, Sparkles, Building2, Footprints, DoorClosed } from 'lucide-react';
import { VoxelWorldData } from '../types/game';
import { PRESET_WORLDS } from '../game/presetWorlds';
import { sound } from '../audio/soundSystem';

interface WorldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorld: VoxelWorldData;
  onSelectWorld: (world: VoxelWorldData) => void;
  onStampBlueprint: (blueprintId: string) => void;
  onSaveCurrentWorld: () => void;
  onImportWorldData: (jsonStr: string) => void;
}

export const WorldEditorModal: React.FC<WorldEditorModalProps> = ({
  isOpen,
  onClose,
  activeWorld,
  onSelectWorld,
  onStampBlueprint,
  onSaveCurrentWorld,
  onImportWorldData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'islas' | 'planos' | 'compartir'>('islas');
  const [importJson, setImportJson] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleExport = () => {
    sound.playClick();
    const dataStr = JSON.stringify(activeWorld);
    navigator.clipboard.writeText(dataStr);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    try {
      onImportWorldData(importJson);
      sound.playFanfare();
      setFeedback('¡Isla comunitaria importada con éxito!');
      setImportJson('');
    } catch (e) {
      setFeedback('Error: El formato de código de isla no es válido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 select-none overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] my-auto overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Editor de Mundos e Islas Colaborativas
              </h2>
              <p className="text-xs text-slate-400">
                Viaja entre las dimensiones fracturadas de Victoria Toro o estampa estructuras prediseñadas
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

        {/* Feedback message */}
        {feedback && (
          <div className="mt-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 px-3 py-2 text-xs text-cyan-300 flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-[10px] text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'islas', label: 'Islas del Universo' },
            { id: 'planos', label: 'Planos Arquitectónicos (Blueprints)' },
            { id: 'compartir', label: 'Exportar / Importar Código de Isla' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="mt-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {activeTab === 'islas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: 'isla_nexo',
                  name: 'Isla Nexo: El Origen de Victoria',
                  desc: 'El centro neurálgico de la reconstrucción con el faro cuántico y miradores flotantes.',
                  author: 'Victoria Toro',
                  badge: 'Campaña Principal',
                },
                {
                  id: 'ciudad_neon',
                  name: 'Ciudad Neón: Sector Voxelpunk',
                  desc: 'Rascacielos cibernéticos, circuitos de energía y desafíos de parkour vertical.',
                  author: 'Victoria & Co.',
                  badge: 'Zona de Parkour',
                },
                {
                  id: 'oasis_flotante',
                  name: 'Oasis Flotante: Cascadas Cuánticas',
                  desc: 'Aguas cristalinas de datos, árboles cúbicos y templos serenos.',
                  author: 'Comunidad',
                  badge: 'Exploración',
                },
                {
                  id: 'vacio_creativo',
                  name: 'El Vacío Creativo: Lienzo Libre',
                  desc: 'Espacio abierto sin límites para construir tu propia isla desde cero.',
                  author: 'Tú (Arquitecto)',
                  badge: 'Modo Sandbox',
                },
              ].map((world) => {
                const isActive = activeWorld.id === world.id;
                return (
                  <div
                    key={world.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                          {world.badge}
                        </span>
                        <span className="text-[10px] text-slate-400">Por {world.author}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{world.name}</h3>
                      <p className="text-xs text-slate-400 mb-3">{world.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      {isActive ? (
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" /> Isla Activa
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            sound.playTeleport();
                            const fn = PRESET_WORLDS[world.id];
                            if (fn) onSelectWorld(fn());
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-200 text-xs font-semibold transition"
                        >
                          Cargar e Ir a la Isla
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'planos' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Los planos te permiten construir estructuras complejas de golpe en tu posición actual:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'torre_victoria',
                    title: 'Faro de Victoria',
                    icon: Building2,
                    desc: 'Torre de 9 bloques con cristales dorados y faro iluminado.',
                  },
                  {
                    id: 'trampolin_obby',
                    title: 'Pista Obby Trampolines',
                    icon: Footprints,
                    desc: 'Escalones suspendidos con trampolines para parkour aéreo.',
                  },
                  {
                    id: 'arco_cibernetico',
                    title: 'Portal Monumental Neón',
                    icon: DoorClosed,
                    desc: 'Arco cibernético con luces de neón integradas.',
                  },
                ].map((bp) => {
                  const Icon = bp.icon;
                  return (
                    <div
                      key={bp.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-2">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1">{bp.title}</h4>
                        <p className="text-[11px] text-slate-400 mb-3">{bp.desc}</p>
                      </div>

                      <button
                        onClick={() => {
                          sound.playBlockPlace();
                          onStampBlueprint(bp.id);
                          onClose();
                        }}
                        className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20"
                      >
                        Estampar en mi Posición
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'compartir' && (
            <div className="space-y-4">
              {/* Export */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-cyan-400" /> Exportar Isla Actual
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Copia el código JSON de tu isla (bloques, scripts y posiciones) para compartirlo con otros jugadores en Discord o foros de la comunidad.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {copiedNotification ? '¡Copiado al Portapapeles!' : 'Copiar Código de Isla'}
                  </button>

                  <button
                    onClick={() => {
                      sound.playFanfare();
                      onSaveCurrentWorld();
                      setFeedback('¡Isla guardada localmente en tu almacenamiento persistente!');
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" /> Guardar Cambios Locales
                  </button>
                </div>
              </div>

              {/* Import */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-purple-400" /> Importar Isla Comunitaria
                </h4>
                <p className="text-xs text-slate-400 mb-2">
                  Pega aquí el código JSON de una isla creada por un amigo o colega para jugarla al instante:
                </p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Pega aquí el JSON exportado..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleImport}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" /> Cargar Isla en el Toroverso
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Bloques en esta isla: {Object.keys(activeWorld.blocks).length}</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
