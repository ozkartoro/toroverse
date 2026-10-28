/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EmoteDefinition {
  id: string;
  name: string;
  emoji: string;
  iconName: string;
  description: string;
  chatText: string;
  durationSeconds: number;
  shortcutKey?: string;
  color: string;
}

export const GAME_EMOTES: EmoteDefinition[] = [
  {
    id: 'dance',
    name: 'Baile Neón',
    emoji: '💃',
    iconName: 'Sparkles',
    description: 'Baile electro con pasos rítmicos y movimiento de brazos',
    chatText: 'baila con energía al ritmo del Toroverso 💃✨',
    durationSeconds: 6,
    shortcutKey: '1',
    color: '#00f5d4',
  },
  {
    id: 'wave',
    name: 'Saludar',
    emoji: '👋',
    iconName: 'Hand',
    description: 'Levanta el brazo derecho y saluda alegremente a los jugadores',
    chatText: 'saluda cordialmente a toda la comunidad 👋',
    durationSeconds: 3.5,
    shortcutKey: '2',
    color: '#38bdf8',
  },
  {
    id: 'cheer',
    name: 'Celebrar',
    emoji: '🎉',
    iconName: 'PartyPopper',
    description: 'Brazos al cielo y saltos de alegría por la reconstrucción',
    chatText: 'celebra con entusiasmo la restauración de la isla 🎉!',
    durationSeconds: 4,
    shortcutKey: '3',
    color: '#f43f5e',
  },
  {
    id: 'flex',
    name: 'Posar Músculos',
    emoji: '💪',
    iconName: 'Zap',
    description: 'Pose de fuerza de constructora experta en bloques',
    chatText: 'flexiona los bíceps demostrando su fuerza de constructora 💪',
    durationSeconds: 4,
    shortcutKey: '4',
    color: '#f59e0b',
  },
  {
    id: 'bow',
    name: 'Reverencia',
    emoji: '🙇',
    iconName: 'Smile',
    description: 'Inclinación de respeto oriental hacia los compañeros',
    chatText: 'hace una reverencia solemne de respeto mutuo 🙇',
    durationSeconds: 3.5,
    shortcutKey: '5',
    color: '#8b5cf6',
  },
  {
    id: 'point',
    name: 'Señalar',
    emoji: '👉',
    iconName: 'Navigation',
    description: 'Apunta con el brazo extendido hacia un objetivo o bloque',
    chatText: 'señala con decisión hacia nuevos fragmentos de datos 👉',
    durationSeconds: 3,
    shortcutKey: '6',
    color: '#10b981',
  },
  {
    id: 'laugh',
    name: 'Carcajada',
    emoji: '😆',
    iconName: 'Laugh',
    description: 'Risa contagiosa con movimiento de torso',
    chatText: 'se ríe a carcajadas con sus amigos en el servidor 😆',
    durationSeconds: 3.5,
    shortcutKey: '7',
    color: '#fee440',
  },
  {
    id: 'spin',
    name: 'Giro 360°',
    emoji: '✨',
    iconName: 'RotateCw',
    description: 'Pirueta acrobática completa en el aire',
    chatText: 'ejecuta un giro acrobático de 360° en gravedad cero ✨',
    durationSeconds: 3,
    shortcutKey: '8',
    color: '#ec4899',
  },
];
