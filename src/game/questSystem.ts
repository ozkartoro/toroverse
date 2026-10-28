/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StoryQuest {
  id: string;
  act: 'Acto I: El Despertar' | 'Acto II: El Faro de la Esperanza' | 'Acto III: La Gran Restauración';
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardPoints: number;
  rewardFragments: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
  type: 'explore' | 'build' | 'mine' | 'kill' | 'jump' | 'beacon' | 'titan' | 'points' | 'emote' | 'world';
}

export const INITIAL_STORY_QUESTS: StoryQuest[] = [
  // Acto I
  {
    id: 'q1_explore',
    act: 'Acto I: El Despertar',
    title: 'Exploración Cuántica',
    description: 'Explora los alrededores del Nexo de Victoria Toro (recorre 60 metros).',
    target: 60,
    progress: 0,
    rewardPoints: 120,
    rewardFragments: 5,
    completed: false,
    claimed: false,
    icon: 'Compass',
    type: 'explore',
  },
  {
    id: 'q2_build',
    act: 'Acto I: El Despertar',
    title: 'Primeros Cimientos',
    description: 'Coloca 8 bloques para reconstruir el universo tras el Cataclismo Creativo.',
    target: 8,
    progress: 0,
    rewardPoints: 150,
    rewardFragments: 10,
    completed: false,
    claimed: false,
    icon: 'Hammer',
    type: 'build',
  },
  {
    id: 'q3_mine',
    act: 'Acto I: El Despertar',
    title: 'Despejar el Cataclismo',
    description: 'Mina 5 bloques corrompidos o roca residual en la isla.',
    target: 5,
    progress: 0,
    rewardPoints: 130,
    rewardFragments: 8,
    completed: false,
    claimed: false,
    icon: 'Pickaxe',
    type: 'mine',
  },
  {
    id: 'q4_first_kill',
    act: 'Acto I: El Despertar',
    title: 'Defensa del Nexo',
    description: 'Derrota a tu primera anomalía hostil (Araña Glitch o Bestia Sombría).',
    target: 1,
    progress: 0,
    rewardPoints: 200,
    rewardFragments: 15,
    completed: false,
    claimed: false,
    icon: 'Sword',
    type: 'kill',
  },

  // Acto II
  {
    id: 'q5_jump',
    act: 'Acto II: El Faro de la Esperanza',
    title: 'Propulsión Cuántica',
    description: 'Usa una plataforma de salto (jump_pad) para elevarte a gran altura.',
    target: 1,
    progress: 0,
    rewardPoints: 150,
    rewardFragments: 10,
    completed: false,
    claimed: false,
    icon: 'Zap',
    type: 'jump',
  },
  {
    id: 'q6_beacon',
    act: 'Acto II: El Faro de la Esperanza',
    title: 'El Faro de Victoria',
    description: 'Coloca o activa un bloque Faro de Victoria (light_block) para iluminar el universo.',
    target: 1,
    progress: 0,
    rewardPoints: 250,
    rewardFragments: 20,
    completed: false,
    claimed: false,
    icon: 'Sun',
    type: 'beacon',
  },
  {
    id: 'q7_titan',
    act: 'Acto II: El Faro de la Esperanza',
    title: 'La Caída del Titán',
    description: 'Derrota al colosal Gólem del Vacío que custodia la anomalía central.',
    target: 1,
    progress: 0,
    rewardPoints: 500,
    rewardFragments: 35,
    completed: false,
    claimed: false,
    icon: 'Shield',
    type: 'titan',
  },

  // Acto III
  {
    id: 'q8_points',
    act: 'Acto III: La Gran Restauración',
    title: 'Maestría Creativa',
    description: 'Acumula un total de 1,000 Puntos Toro completando acciones.',
    target: 1000,
    progress: 0,
    rewardPoints: 400,
    rewardFragments: 25,
    completed: false,
    claimed: false,
    icon: 'Sparkles',
    type: 'points',
  },
  {
    id: 'q9_emote',
    act: 'Acto III: La Gran Restauración',
    title: 'Celebración Insular',
    description: 'Realiza cualquier emote o baile de Victoria Toro en la isla.',
    target: 1,
    progress: 0,
    rewardPoints: 100,
    rewardFragments: 5,
    completed: false,
    claimed: false,
    icon: 'Flame',
    type: 'emote',
  },
  {
    id: 'q10_world',
    act: 'Acto III: La Gran Restauración',
    title: 'Viajera Multiversal',
    description: 'Viaja a otra isla del Toroverse desde el Gestor de Islas.',
    target: 1,
    progress: 0,
    rewardPoints: 300,
    rewardFragments: 20,
    completed: false,
    claimed: false,
    icon: 'Globe',
    type: 'world',
  },
];

export class QuestSystem {
  private quests: StoryQuest[] = [];

  constructor() {
    this.load();
  }

  public load() {
    try {
      const saved = localStorage.getItem('toroverse_quests_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with initial in case new quests were added
        this.quests = INITIAL_STORY_QUESTS.map((initQ) => {
          const found = parsed.find((p: StoryQuest) => p.id === initQ.id);
          return found ? { ...initQ, ...found } : initQ;
        });
      } else {
        this.quests = JSON.parse(JSON.stringify(INITIAL_STORY_QUESTS));
      }
    } catch (_) {
      this.quests = JSON.parse(JSON.stringify(INITIAL_STORY_QUESTS));
    }
  }

  public save() {
    try {
      localStorage.setItem('toroverse_quests_v2', JSON.stringify(this.quests));
    } catch (e) {
      console.warn('[QuestSystem] Storage save skipped:', e);
    }
  }

  public getQuests(): StoryQuest[] {
    return this.quests;
  }

  public getUnclaimedCount(): number {
    return this.quests.filter((q) => q.completed && !q.claimed).length;
  }

  public getActiveQuest(): StoryQuest | undefined {
    return this.quests.find((q) => !q.completed) || this.quests.find((q) => !q.claimed);
  }

  /**
   * Advances progress on matching quest type
   * Returns newly completed quests
   */
  public advance(type: StoryQuest['type'], amount: number = 1): StoryQuest[] {
    const newlyCompleted: StoryQuest[] = [];

    this.quests.forEach((q) => {
      if (q.type === type && !q.completed) {
        if (type === 'points') {
          q.progress = Math.min(q.target, amount); // direct set for accumulated points
        } else {
          q.progress = Math.min(q.target, q.progress + amount);
        }

        if (q.progress >= q.target) {
          q.completed = true;
          newlyCompleted.push(q);
        }
      }
    });

    if (newlyCompleted.length > 0) {
      this.save();
    }
    return newlyCompleted;
  }

  /**
   * Claims a completed quest reward
   */
  public claimReward(questId: string): StoryQuest | null {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || !q.completed || q.claimed) return null;
    q.claimed = true;
    this.save();
    return q;
  }
}

export const questSystem = new QuestSystem();
