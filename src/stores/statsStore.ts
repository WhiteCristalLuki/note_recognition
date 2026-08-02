import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LifetimeStats, SessionSummary } from '../types'

const MAX_RECENT = 20

const empty: LifetimeStats = {
  totalSessions: 0,
  totalNotes: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  bestStreak: 0,
  bestAccuracy: 0,
  errorsByNote: {},
  recentSessions: [],
}

interface StatsState extends LifetimeStats {
  recordSession: (summary: SessionSummary) => void
  resetStats: () => void
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      ...empty,

      recordSession: (summary) => {
        const prev = get()
        const errorsByNote = { ...prev.errorsByNote }
        for (const [note, count] of Object.entries(summary.errorsByNote)) {
          errorsByNote[note] = (errorsByNote[note] ?? 0) + count
        }

        const recentSessions = [summary, ...prev.recentSessions].slice(
          0,
          MAX_RECENT,
        )

        set({
          totalSessions: prev.totalSessions + 1,
          totalNotes: prev.totalNotes + summary.results.length,
          totalCorrect: prev.totalCorrect + summary.correct,
          totalIncorrect: prev.totalIncorrect + summary.incorrect,
          bestStreak: Math.max(prev.bestStreak, summary.maxStreak),
          bestAccuracy: Math.max(prev.bestAccuracy, summary.accuracy),
          errorsByNote,
          recentSessions,
        })
      },

      resetStats: () => set({ ...empty }),
    }),
    {
      name: 'note-trainer-stats',
    },
  ),
)
