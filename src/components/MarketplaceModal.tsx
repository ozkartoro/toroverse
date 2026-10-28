/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShoppingBag, Sparkles, PlusCircle, Check, Crown, Zap, Shield, Layers } from 'lucide-react';
import { MarketplaceItem, AvatarCustomization } from '../types/game';
import { sound } from '../audio/soundSystem';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerPoints: number;
  items: MarketplaceItem[];
  onBuyItem: (item: MarketplaceItem) => boolean;
  onPublishCustomItem: (title: string, category: MarketplaceItem['category'], price: number, desc: string) => void;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  isOpen,
  onClose,
  playerPoints,
  items,
  onBuyItem,
  onPublishCustomItem,
}) => {
  if (!isOpen) return null;

  const [filterCategory, setFilterCategory] = useState<'all' | 'cosmetico' | 'plano' | 'script'>('all');
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishCategory, setPublishCategory] = useState<MarketplaceItem['category']>('plano');
  const [publishPrice, setPublishPrice] = useState(300);
  const [publishDesc, setPublishDesc] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredItems = items.filter(
    (item) => filterCategory === 'all' || item.category === filterCategory
  );

  const handleBuy = (item: MarketplaceItem) => {
    if (item.purchased) return;
    if (playerPoints < item.price) {
      sound.playClick();
      setFeedback(`No tienes suficientes Puntos Toro. Necesitas ${item.price} PTS (Tienes: ${playerPoints}).`);
      return;
    }

    const success = onBuyItem(item);
    if (success) {
      sound.playPointCollect();
      setFeedback(`¡Has adquirido "${item.title}" por ${item.price} Puntos Toro!`);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTitle.trim()) return;

    onPublishCustomItem(publishTitle, publishCategory, publishPrice, publishDesc);
    sound.playFanfare();
    setShowPublishForm(false);
    setPublishTitle('');
    setPublishDesc('');
    setFeedback('¡Tu activo digital ha sido publicado en el Mercado del Toroverso! Ganarás regalías.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 select-none overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] my-auto overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 p-3.5 sm:p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 flex-shrink-0">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                Mercado del Toroverso
                <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  100% Puntos
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Todo se adquiere con Puntos Toro ganados jugando. ¡Cero dinero real!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* Player Points Readout */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-2.5 sm:px-3.5 py-1 text-right">
              <div className="text-[9px] uppercase font-mono text-amber-300/80">Tus Puntos</div>
              <div className="text-xs sm:text-base font-extrabold text-amber-300 font-mono tabular-nums">
                {playerPoints.toLocaleString()} PTS
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="rounded-lg p-1.5 sm:p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="mt-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 px-3 py-2 text-xs text-cyan-300 flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-[10px] text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Toolbar: Categories + Publish CTA */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'cosmetico', label: 'Cosméticos de Avatar' },
              { id: 'plano', label: 'Planos & Blueprints' },
              { id: 'script', label: 'Módulos de Scripting' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setFilterCategory(cat.id as any);
                  setShowPublishForm(false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  filterCategory === cat.id && !showPublishForm
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setShowPublishForm(!showPublishForm);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {showPublishForm ? 'Ver Catálogo' : 'Publicar Tu Creación (+Regalías)'}
          </button>
        </div>

        {/* Body content */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {showPublishForm ? (
            /* Publish Asset Form */
            <form onSubmit={handlePublish} className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-5 space-y-4">
              <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Publicar un Activo Digital Único al Mercado Comunitario
              </div>
              <p className="text-xs text-slate-400">
                Comparte tus planos arquitectónicos o scripts lógicos con jugadores de todas las plataformas integradas. Cada vez que otro jugador lo descargue, recibirás una comisión del 70% en Puntos Toro.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Título del Activo</label>
                  <input
                    type="text"
                    required
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    placeholder="Ej. Castillo Flotante de Neón"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={publishCategory}
                    onChange={(e) => setPublishCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="plano">Plano Arquitectónico (Blueprint)</option>
                    <option value="script">Módulo de Scripting Visual</option>
                    <option value="cosmetico">Diseño Cosmético</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Precio en Puntos Toro: <span className="font-bold text-amber-300">{publishPrice} PTS</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Descripción</label>
                  <input
                    type="text"
                    value={publishDesc}
                    onChange={(e) => setPublishDesc(e.target.value)}
                    placeholder="Ej. Incluye trampolines ocultos y circuitos de luces neón"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPublishForm(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/25"
                >
                  Publicar en la Red de Victoria
                </button>
              </div>
            </form>
          ) : (
            /* Items Catalog Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => {
                const canAfford = playerPoints >= item.price;
                const isOwned = item.purchased;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                      isOwned
                        ? 'bg-slate-900/40 border-slate-800 opacity-80'
                        : item.rarity === 'legendario'
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                        : item.rarity === 'épico'
                        ? 'bg-purple-950/20 border-purple-500/30'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top tags */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            item.rarity === 'legendario'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.rarity === 'épico'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {item.rarity}
                        </span>

                        <span className="text-[10px] text-slate-400">Por {item.author}</span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{item.description}</p>
                    </div>

                    {/* Bottom Buy bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <div className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                        {item.price} PTS
                      </div>

                      {isOwned ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <Check className="h-3.5 w-3.5" /> Adquirido
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Comprar con Puntos
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
