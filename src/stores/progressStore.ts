import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LEVELS } from '../lib/levels'

interface ProgressState {
  /** ID пройденных уровней (100% верных ответов за полную попытку) */
  completedLevelIds: string[]
  /** Последний выбранный уровень */
  selectedLevelId: string
  /** Открытая часть на экране выбора */
  selectedPart: 1 | 2 | 3

  isCompleted: (levelId: string) => boolean
  markCompleted: (levelId: string) => void
  setSelectedLevelId: (id: string) => void
  setSelectedPart: (part: 1 | 2 | 3) => void
  completedCount: () => number
  completedInPart: (part: 1 | 2 | 3) => number
  resetProgress: () => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLevelIds: [],
      selectedLevelId: '1.1',
      selectedPart: 1,

      isCompleted: (levelId) => get().completedLevelIds.includes(levelId),

      markCompleted: (levelId) => {
        const { completedLevelIds } = get()
        if (completedLevelIds.includes(levelId)) return
        // Только известные уровни
        if (!LEVELS.some((l) => l.id === levelId)) return
        set({ completedLevelIds: [...completedLevelIds, levelId] })
      },

      setSelectedLevelId: (selectedLevelId) => set({ selectedLevelId }),

      setSelectedPart: (selectedPart) => set({ selectedPart }),

      completedCount: () => get().completedLevelIds.length,

      completedInPart: (part) => {
        const ids = new Set(get().completedLevelIds)
        return LEVELS.filter((l) => l.part === part && ids.has(l.id)).length
      },

      resetProgress: () =>
        set({ completedLevelIds: [], selectedLevelId: '1.1', selectedPart: 1 }),
    }),
    {
      name: 'note-trainer-progress',
    },
  ),
)

/**
 * Уровень пройден, если сессия полная и без ошибок.
 */
export function isPerfectClear(
  correct: number,
  incorrect: number,
  noteCount: number,
  answered: number,
): boolean {
  if (noteCount <= 0) return false
  if (answered < noteCount) return false
  return incorrect === 0 && correct === noteCount
}
