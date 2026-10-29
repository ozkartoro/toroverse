/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Package,
  Hammer,
  Sparkles,
  Plus,
  ArrowRight,
  Layers,
  Shield,
  Sword,
  Heart,
  Skull,
  Pickaxe,
  Flame,
} from 'lucide-react';
import {
  BlockId,
  CraftingRecipe,
  MaterialDefinition,
  MaterialId,
  MaterialInventory,
} from '../types/game';
import {
  CRAFTING_RECIPES,
  fuseTwoMaterials,
  MATERIAL_DEFINITIONS,
  MATERIAL_LIST,
} from '../data/materialsAndCrafting';
import { sound } from '../audio/soundSystem';

interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: MaterialInventory;
  onUpdateInventory: (next: MaterialInventory) => void;
  onEquipBlock: (blockId: BlockId) => void;
  onHealPlayer: (amount: number) => void;
  onUpgradeMaxHp: (amount: number) => void;
  onUpgradeWeaponDamage: () => void;
  weaponDamageMultiplier: number;
  onEarnPoints: (points: number, reason: string) => void;
  onEquipArmor?: (piece: 'helmet' | 'chestplate') => void;
  onSpawnNpcWave?: () => void;
  onSpawnAnimalHerd?: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
  onEquipBlock,
  onHealPlayer,
  onUpgradeMaxHp,
  onUpgradeWeaponDamage,
  weaponDamageMultiplier,
  onEarnPoints,
  onEquipArmor,
  onSpawnNpcWave,
  onSpawnAnimalHerd,
}) => {
  const [activeTab, setActiveTab] = useState<'fusion' | 'recipes' | 'smelting' | 'storage'>('fusion');
  const [recipeFilter, setRecipeFilter] = useState<'todos' | 'bloques' | 'mecanismos' | 'supervivencia' | 'armas'>('todos');
  const [materialFilter, setMaterialFilter] = useState<
    'todos' | 'disponibles' | 'bloque_natural' | 'bloque_avanzado' | 'recurso_animal' | 'botin_enemigo'
  >('todos');
  const [slotA, setSlotA] = useState<MaterialId | null>('wood');
  const [slotB, setSlotB] = useState<MaterialId | null>('quantum_wool');
  const [craftFeedback, setCraftFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalMaterialsCount = (Object.values(inventory) as Array<number | undefined>).reduce<number>(
    (acc, val) => acc + (val ?? 0),
    0
  );

  const showTempFeedback = (msg: string) => {
    setCraftFeedback(msg);
    setTimeout(() => {
      setCraftFeedback((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Select a material into Slot A or Slot B for 2-material fusion
  const handleSelectForFusion = (matId: MaterialId) => {
    sound.playClick();
    if (!slotA || (slotA && slotB)) {
      setSlotA(matId);
      if (slotA && slotB) setSlotB(null);
    } else {
      setSlotB(matId);
    }
  };

  // Execute 2-material free fusion
  const handleFuseTwo = () => {
    if (!slotA || !slotB) return;
    const countA = inventory[slotA] ?? 0;
    const countB = inventory[slotB] ?? 0;

    if (slotA === slotB && countA < 2) {
      showTempFeedback('⚠️ Necesitas al menos 2 unidades de este mismo material para unirlo consigo mismo.');
      return;
    }
    if (countA < 1 || countB < 1) {
      showTempFeedback('⚠️ No tienes suficientes unidades almacenadas de los materiales seleccionados.');
      return;
    }

    const result = fuseTwoMaterials(slotA, slotB);
    const nextInv: MaterialInventory = { ...inventory };
    nextInv[slotA] = Math.max(0, (nextInv[slotA] ?? 0) - 1);
    nextInv[slotB] = Math.max(0, (nextInv[slotB] ?? 0) - 1);
    nextInv[result.outputMaterialId] = (nextInv[result.outputMaterialId] ?? 0) + result.outputCount;

    onUpdateInventory(nextInv);
    sound.playFanfare();
    onEarnPoints(result.bonusPoints, result.message);
    showTempFeedback(`✨ ${result.message} (+${result.outputCount} ${MATERIAL_DEFINITIONS[result.outputMaterialId].name})`);
  };

  // Check if player can afford a recipe
  const canAffordRecipe = (recipe: CraftingRecipe): boolean => {
    return recipe.ingredients.every((ing) => (inventory[ing.materialId] ?? 0) >= ing.count);
  };

  // Craft a recipe
  const handleCraftRecipe = (recipe: CraftingRecipe) => {
    if (!canAffordRecipe(recipe)) {
      showTempFeedback('⚠️ Te faltan materiales en el almacén para esta receta.');
      return;
    }

    const nextInv: MaterialInventory = { ...inventory };
    for (const ing of recipe.ingredients) {
      nextInv[ing.materialId] = Math.max(0, (nextInv[ing.materialId] ?? 0) - ing.count);
    }

    if (recipe.resultType === 'material' && recipe.outputMaterialId) {
      nextInv[recipe.outputMaterialId] = (nextInv[recipe.outputMaterialId] ?? 0) + recipe.outputCount;
      const outDef = MATERIAL_DEFINITIONS[recipe.outputMaterialId];
      showTempFeedback(`🔨 ¡Creado! +${recipe.outputCount}x ${outDef.name} guardado en tu almacén.`);
    } else if (recipe.resultType === 'heal') {
      onHealPlayer(recipe.outputCount);
      showTempFeedback(`🍖 ¡Banquete consumido! Recuperaste +${recipe.outputCount} HP.`);
    } else if (recipe.resultType === 'max_hp') {
      onUpgradeMaxHp(recipe.outputCount);
      if (recipe.id === 'craft_cyber_helmet') {
        onEquipArmor?.('helmet');
        showTempFeedback(`🪖 ¡Casco Sombra equipado! +30 Salud Máx y +25% Reducción de Daño.`);
      } else if (recipe.id === 'craft_nano_armor') {
        onEquipArmor?.('chestplate');
        showTempFeedback(`🛡️ ¡Pechera Nano equipada! +25 Salud Máx y +35% Reducción de Daño.`);
      } else {
        showTempFeedback(`🛡️ ¡Blindaje equipado! Salud máxima aumentada en +${recipe.outputCount} HP.`);
      }
    } else if (recipe.resultType === 'weapon_upgrade') {
      onUpgradeWeaponDamage();
      showTempFeedback(`⚔️ ¡Armas sobrecargadas! Daño de todas tus armas aumentado +25%.`);
    }

    onUpdateInventory(nextInv);
    sound.playFanfare();
    onEarnPoints(recipe.bonusPoints, `Crafteo: ${recipe.name}`);
  };

  // Consume raw neon meat directly
  const handleEatMeat = () => {
    const count = inventory.neon_meat ?? 0;
    if (count < 1) return;
    const nextInv: MaterialInventory = {
      ...inventory,
      neon_meat: count - 1,
    };
    onUpdateInventory(nextInv);
    onHealPlayer(25);
    sound.playPointCollect();
    showTempFeedback('🥩 Consumiste 1x Carne Energética (+25 HP).');
  };

  const filteredRecipes = CRAFTING_RECIPES.filter((r) =>
    recipeFilter === 'todos' ? true : r.category === recipeFilter
  );

  // Preview of current 2-material fusion
  const fusionPreview = slotA && slotB ? fuseTwoMaterials(slotA, slotB) : null;
  const fusionOutDef = fusionPreview ? MATERIAL_DEFINITIONS[fusionPreview.outputMaterialId] : null;

  const renderMaterialCard = (mat: MaterialDefinition, isCompact = false) => {
    const count = inventory[mat.id] ?? 0;
    const isSelectedA = slotA === mat.id;
    const isSelectedB = slotB === mat.id;

    return (
      <div
        key={mat.id}
        onClick={() => handleSelectForFusion(mat.id)}
        className={`group relative min-w-0 overflow-hidden rounded-xl border p-2.5 transition-all cursor-pointer flex flex-col justify-between ${
          isSelectedA || isSelectedB
            ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,245,212,0.25)]'
            : count > 0
            ? 'bg-slate-900/85 border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800/80'
            : 'bg-slate-950/50 border-slate-800/50 opacity-55 hover:opacity-85'
        }`}
      >
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-base shadow-inner border border-white/15 flex-shrink-0"
              style={{ backgroundColor: mat.color }}
            >
              {mat.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white leading-tight truncate group-hover:text-cyan-300 transition">
                {mat.name}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {mat.category === 'bloque_natural' && 'Bloque Natural'}
                {mat.category === 'bloque_avanzado' && 'Bloque Avanzado'}
                {mat.category === 'recurso_animal' && 'Recurso Animal'}
                {mat.category === 'botin_enemigo' && 'Botín NPC/Enemigo'}
              </div>
            </div>
          </div>

          <span
            className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-black ${
              count > 0
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            x{count}
          </span>
        </div>

        {!isCompact && (
          <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2">{mat.description}</p>
        )}

        {/* Quick actions footer */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            {isSelectedA && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 truncate">
                RANURA A
              </span>
            )}
            {isSelectedB && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 truncate">
                RANURA B
              </span>
            )}
            {!isSelectedA && !isSelectedB && (
              <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-300 truncate">
                Clic para unir
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {mat.placeableBlockId && count > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  onEquipBlock(mat.placeableBlockId!);
                  showTempFeedback(`🧱 Equipado ${mat.name} para construir.`);
                }}
                className="px-2 py-0.5 rounded bg-emerald-600/85 hover:bg-emerald-500 text-white text-[9px] font-bold transition"
              >
                Equipar
              </button>
            )}
            {mat.id === 'neon_meat' && count > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEatMeat();
                }}
                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold transition"
              >
                Comer (+25 HP)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-cyan-500/40 bg-slate-950 shadow-[0_0_50px_rgba(0,245,212,0.18)]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-slate-950 shadow-lg shadow-amber-500/30">
              <Hammer className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                ALMACÉN Y MESA DE UNIÓN CUÁNTICA
                <span className="rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-xs font-mono text-cyan-300">
                  {totalMaterialsCount} Materiales Guardados
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mina bloques del mundo, recolecta recursos de animales o elimina NPCs enemigos para almacenar y unir materiales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSpawnAnimalHerd && (
              <button
                onClick={() => {
                  sound.playClick();
                  onSpawnAnimalHerd();
                  showTempFeedback('🐑 ¡Manada de animales cuánticos atraída cerca de tu posición!');
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/70 transition cursor-pointer"
              >
                <span>🐑</span> +Manada Animales
              </button>
            )}
            {onSpawnNpcWave && (
              <button
                onClick={() => {
                  sound.playClick();
                  onSpawnNpcWave();
                  showTempFeedback('⚔️ ¡Escuadrón de NPCs enemigos desplegado cerca de ti! Elimínalos para obtener botín.');
                }}
                className="flex items-center gap-1.5 rounded-xl bg-rose-950/90 border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/70 transition cursor-pointer"
              >
                <Skull className="h-3.5 w-3.5 text-rose-400" /> +Patrulla NPCs
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/40 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('fusion');
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'fusion'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Sparkles className="h-4 w-4" /> Unir 2 Materiales (Fusión Libre)
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('recipes');
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Hammer className="h-4 w-4" /> Recetas Tipo Minecraft ({CRAFTING_RECIPES.length})
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('smelting');
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'smelting'
                  ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-orange-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Flame className="h-4 w-4 text-orange-400 animate-pulse" /> Horno y Cocina Cuántica
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('storage');
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'storage'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Package className="h-4 w-4" /> Inventario por Categorías
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <Sword className="h-3.5 w-3.5" /> Bono Daño Armas: x{weaponDamageMultiplier.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Feedback Banner */}
        {craftFeedback && (
          <div className="bg-cyan-950/90 border-b border-cyan-400/50 px-5 py-2 text-xs font-bold text-cyan-200 flex items-center justify-between">
            <span>{craftFeedback}</span>
            <button onClick={() => setCraftFeedback(null)} className="text-cyan-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: FREE 2-MATERIAL FUSION + QUICK INVENTORY */}
          {activeTab === 'fusion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Fusion Workbench */}
              <div className="lg:col-span-5 min-w-0 overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900/70 p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 min-w-0">
                      <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">Sintetizador: Unir Materiales</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      Elige 2 a la derecha
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3.5 leading-relaxed">
                    Combina cualquier par de materiales recolectados (bloques, lana, cuero, esencia glitch o acero oscuro) para sintetizar bloques avanzados y mecanismos.
                  </p>

                  {/* Structured 2-Row Synthesizer Container (Prevents horizontal overflow) */}
                  <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                    {/* Top Row: Slot A + Slot B */}
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
                      {/* Slot A */}
                      <div
                        onClick={() => setSlotA(null)}
                        title="Haz clic para vaciar Ranura A"
                        className={`min-w-0 overflow-hidden rounded-xl border-2 p-2.5 text-center cursor-pointer transition flex flex-col justify-between ${
                          slotA
                            ? 'border-cyan-400 bg-cyan-950/40'
                            : 'border-dashed border-slate-700 bg-slate-900/40'
                        }`}
                      >
                        <div className="text-[9px] font-mono font-bold text-cyan-400 uppercase mb-1">
                          Material A
                        </div>
                        {slotA ? (
                          <div className="min-w-0">
                            <div className="text-2xl mb-0.5">{MATERIAL_DEFINITIONS[slotA].emoji}</div>
                            <div className="text-xs font-bold text-white truncate px-1">
                              {MATERIAL_DEFINITIONS[slotA].name}
                            </div>
                            <div
                              className={`text-[10px] font-mono font-semibold mt-0.5 ${
                                (inventory[slotA] ?? 0) > 0 ? 'text-cyan-300' : 'text-rose-400'
                              }`}
                            >
                              Stock: {inventory[slotA] ?? 0}
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 text-xs text-slate-500">Elige Material</div>
                        )}
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="h-7 w-7 rounded-full bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>

                      {/* Slot B */}
                      <div
                        onClick={() => setSlotB(null)}
                        title="Haz clic para vaciar Ranura B"
                        className={`min-w-0 overflow-hidden rounded-xl border-2 p-2.5 text-center cursor-pointer transition flex flex-col justify-between ${
                          slotB
                            ? 'border-amber-400 bg-amber-950/40'
                            : 'border-dashed border-slate-700 bg-slate-900/40'
                        }`}
                      >
                        <div className="text-[9px] font-mono font-bold text-amber-400 uppercase mb-1">
                          Material B
                        </div>
                        {slotB ? (
                          <div className="min-w-0">
                            <div className="text-2xl mb-0.5">{MATERIAL_DEFINITIONS[slotB].emoji}</div>
                            <div className="text-xs font-bold text-white truncate px-1">
                              {MATERIAL_DEFINITIONS[slotB].name}
                            </div>
                            <div
                              className={`text-[10px] font-mono font-semibold mt-0.5 ${
                                (inventory[slotB] ?? 0) > 0 ? 'text-amber-300' : 'text-rose-400'
                              }`}
                            >
                              Stock: {inventory[slotB] ?? 0}
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 text-xs text-slate-500">Elige Material</div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Full-width Result Preview Box */}
                    <div className="rounded-xl border-2 border-emerald-500/60 bg-emerald-950/35 px-3.5 py-2.5 flex items-center justify-between gap-3 min-w-0">
                      {fusionOutDef && fusionPreview ? (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-md border border-white/20 flex-shrink-0"
                              style={{ backgroundColor: fusionOutDef.color }}
                            >
                              {fusionOutDef.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                                Resultado de la Unión
                              </div>
                              <div className="text-xs sm:text-sm font-black text-white truncate">
                                {fusionOutDef.name}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/50 text-xs font-mono font-black text-emerald-200">
                              +{fusionPreview.outputCount} ud.
                            </span>
                            <span className="text-[10px] font-mono text-amber-300 font-bold mt-0.5">
                              +{fusionPreview.bonusPoints} PTS
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full py-1.5 text-center text-xs text-slate-400 font-mono">
                          Selecciona Material A y Material B para ver el resultado de la unión
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fusion Trigger Button & Hint combinations */}
                <div className="space-y-3">
                  <button
                    onClick={handleFuseTwo}
                    disabled={!slotA || !slotB}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 flex-shrink-0" /> Unir Materiales Seleccionados
                  </button>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 text-[11px] text-slate-300 space-y-1">
                    <div className="font-bold text-amber-300 text-xs mb-1">
                      💡 Combinaciones Destacadas:
                    </div>
                    <div className="truncate">• 🪵 Madera + 🪨 Piedra → 💎 2x Neón Cian</div>
                    <div className="truncate">• 🧶 Lana Cuántica + 💎 Neón Cian → 🚀 Plataforma de Salto</div>
                    <div className="truncate">• 👾 Esencia Glitch + 🪨 Piedra → 🔮 2x Magma Magenta</div>
                    <div className="truncate">• 🪶 Pluma Fotónica + 🪨 Piedra → 💡 2x Faro de Victoria</div>
                    <div className="truncate">• ⚔️ Aleación Sombra + 🔋 Célula Plasma → ⚙️ 2x Núcleo Cuántico</div>
                  </div>
                </div>
              </div>

              {/* Right Column: All Materials Grid to select & inspect */}
              <div className="lg:col-span-7 min-w-0 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Tus Materiales Almacenados (Clic para elegir Ranura A / B)</span>
                  </h3>
                </div>

                {/* Quick Filter Pills so nothing is crowded */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'todos', label: 'Todos (20)' },
                      { id: 'disponibles', label: 'Con Stock (>0)' },
                      { id: 'bloque_natural', label: '🌲 Naturales' },
                      { id: 'bloque_avanzado', label: '💎 Avanzados' },
                      { id: 'recurso_animal', label: '🐑 Animales' },
                      { id: 'botin_enemigo', label: '👾 Botín NPC' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        sound.playClick();
                        setMaterialFilter(f.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                        materialFilter === f.id
                          ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[430px] overflow-y-auto pr-1">
                  {MATERIAL_LIST.filter((mat) => {
                    if (materialFilter === 'todos') return true;
                    if (materialFilter === 'disponibles') return (inventory[mat.id] ?? 0) > 0;
                    return mat.category === materialFilter;
                  }).map((mat) => renderMaterialCard(mat, true))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRUCTURED CRAFTING RECIPES */}
          {activeTab === 'recipes' && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {(['todos', 'bloques', 'mecanismos', 'supervivencia', 'armas'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClick();
                      setRecipeFilter(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase font-mono transition cursor-pointer ${
                      recipeFilter === cat
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredRecipes.map((recipe) => {
                  const affordable = canAffordRecipe(recipe);
                  return (
                    <div
                      key={recipe.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition ${
                        affordable
                          ? 'bg-slate-900/90 border-amber-500/50 shadow-lg'
                          : 'bg-slate-950/70 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                              {recipe.emoji}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white">{recipe.name}</h4>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                                {recipe.category} • +{recipe.bonusPoints} PTS
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 mt-2">{recipe.description}</p>
                      </div>

                      {/* Ingredients List */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Materiales Requeridos:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {recipe.ingredients.map((ing) => {
                            const matDef = MATERIAL_DEFINITIONS[ing.materialId];
                            const have = inventory[ing.materialId] ?? 0;
                            const ok = have >= ing.count;
                            return (
                              <span
                                key={ing.materialId}
                                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border ${
                                  ok
                                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                }`}
                              >
                                <span>{matDef.emoji}</span>
                                <span>{matDef.name}:</span>
                                <span>
                                  {have}/{ing.count}
                                </span>
                              </span>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handleCraftRecipe(recipe)}
                          disabled={!affordable}
                          className={`w-full mt-2 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            affordable
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/25'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Hammer className="h-3.5 w-3.5" />
                          {affordable ? 'Unir y Fabricar Ahora' : 'Faltan Materiales'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: HORNO Y COCINA CUÁNTICA */}
          {activeTab === 'smelting' && (
            <div className="space-y-4">
              {/* Furnace Header & Fuel Display */}
              <div className="rounded-2xl border-2 border-orange-500/40 bg-gradient-to-r from-orange-950/40 via-slate-950/90 to-rose-950/40 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30 border border-amber-300">
                    🔥
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      Horno Cuántico de Fundición y Cocina
                    </h3>
                    <p className="text-xs text-slate-300">
                      Usa 🪵 Madera Digital como combustible para cocinar carne y fundir minerales a alta temperatura.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-mono">
                  <span className="text-slate-400">Combustible disponible:</span>
                  <span className="font-black text-amber-300">
                    🪵 {(inventory.wood ?? 0)}x Madera
                  </span>
                </div>
              </div>

              {/* Smelting Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CRAFTING_RECIPES.filter(
                  (r) =>
                    r.id.startsWith('craft_smelt_') ||
                    r.id === 'craft_torches' ||
                    r.id === 'craft_heal_feast'
                ).map((recipe) => {
                  const affordable = canAffordRecipe(recipe);
                  return (
                    <div
                      key={recipe.id}
                      className="rounded-2xl border border-orange-500/30 bg-slate-950/80 p-4 shadow-lg hover:border-orange-400/60 transition flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                              {recipe.emoji}
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-sm">
                                {recipe.name}
                              </div>
                              <div className="text-[10px] font-mono text-orange-300">
                                Fundición & Cocina en Horno
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-200 text-xs font-mono font-bold">
                            +{recipe.bonusPoints} PTS
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Ingredientes y Combustible:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {recipe.ingredients.map((ing) => {
                            const matDef = MATERIAL_DEFINITIONS[ing.materialId];
                            const have = inventory[ing.materialId] ?? 0;
                            const ok = have >= ing.count;
                            return (
                              <span
                                key={ing.materialId}
                                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border ${
                                  ok
                                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                }`}
                              >
                                <span>{matDef.emoji}</span>
                                <span>{matDef.name}:</span>
                                <span>
                                  {have}/{ing.count}
                                </span>
                              </span>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handleCraftRecipe(recipe)}
                          disabled={!affordable}
                          className={`w-full mt-2 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            affordable
                              ? 'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white shadow-md shadow-orange-500/30'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Flame className="h-3.5 w-3.5 text-yellow-300" />
                          {affordable ? '🔥 Fundir / Cocinar en Horno' : 'Faltan Ingredientes'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FULL CATEGORIZED STORAGE */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {(
                [
                  { key: 'bloque_natural', title: '🌲 Bloques Naturales (Obtenidos Minando el Terreno)' },
                  { key: 'recurso_animal', title: '🐑 Recursos de Animales (Obtenidos de Fauna Tipo Minecraft)' },
                  { key: 'botin_enemigo', title: '👾 Botín de NPCs Enemigos y Criaturas Hostiles' },
                  { key: 'bloque_avanzado', title: '💠 Bloques Avanzados y Mecanismos Sintetizados' },
                ] as const
              ).map((group) => {
                const items = MATERIAL_LIST.filter((m) => m.category === group.key);
                return (
                  <div key={group.key} className="space-y-2.5">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 border-b border-slate-800 pb-1">
                      {group.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {items.map((mat) => renderMaterialCard(mat, false))}
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
