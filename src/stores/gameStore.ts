import { create } from 'zustand'
import type {
  AppScreen,
  FeedbackState,
  GameRound,
  NotePitch,
  RoundResult,
  SessionConfig,
  SessionSummary,
} from '../types'
import { createRound } from '../lib/noteGenerator'
import { DEFAULT_SESSION_CONFIG } from '../lib/presets'

interface GameState {
  screen: AppScreen
  config: SessionConfig
  round: GameRound | null
  /** Номер текущей ноты (1-based) */
  noteIndex: number
  results: RoundResult[]
  streak: number
  maxStreak: number
  feedback: FeedbackState
  /** Показывать правильный ответ после ошибки */
  revealedAnswer: NotePitch | null
  locked: boolean
  sessionStartedAt: number
  lastSummary: SessionSummary | null

  startSession: (config: SessionConfig) => void
  submitAnswer: (answer: NotePitch | null, timedOut?: boolean) => RoundResult | null
  nextRound: () => void
  endSession: () => SessionSummary | null
  goHome: () => void
  goResults: () => void
  clearFeedback: () => void
}

function buildSummary(
  config: SessionConfig,
  results: RoundResult[],
  maxStreak: number,
  startedAt: number,
): SessionSummary {
  const correct = results.filter((r) => r.correct).length
  const incorrect = results.length - correct
  const accuracy = results.length === 0 ? 0 : correct / results.length
  const totalMs = results.reduce((s, r) => s + r.responseMs, 0)
  const avgResponseMs = results.length === 0 ? 0 : totalMs / results.length

  const errorsByNote: Record<string, number> = {}
  for (const r of results) {
    if (!r.correct) {
      errorsByNote[r.target.name] = (errorsByNote[r.target.name] ?? 0) + 1
    }
  }

  return {
    config,
    results,
    correct,
    incorrect,
    maxStreak,
    accuracy,
    avgResponseMs,
    errorsByNote,
    startedAt,
    finishedAt: Date.now(),
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'home',
  config: DEFAULT_SESSION_CONFIG,
  round: null,
  noteIndex: 0,
  results: [],
  streak: 0,
  maxStreak: 0,
  feedback: 'idle',
  revealedAnswer: null,
  locked: false,
  sessionStartedAt: 0,
  lastSummary: null,

  startSession: (config) => {
    const round = createRound(config)
    set({
      screen: 'game',
      config,
      round,
      noteIndex: 1,
      results: [],
      streak: 0,
      maxStreak: 0,
      feedback: 'idle',
      revealedAnswer: null,
      locked: false,
      sessionStartedAt: Date.now(),
      lastSummary: null,
    })
  },

  submitAnswer: (answer, timedOut = false) => {
    const { round, locked, streak, maxStreak, results } = get()
    if (!round || locked) return null

    const responseMs = Date.now() - round.startedAt
    // Строгое сравнение по MIDI: До4 (60) ≠ До5 (72) — октава обязательна
    const correct =
      !timedOut && answer !== null && answer.midi === round.target.midi

    const result: RoundResult = {
      target: round.target,
      answer,
      correct,
      responseMs,
      displayClef: round.displayClef,
      mode: round.mode,
      timedOut,
    }

    const newStreak = correct ? streak + 1 : 0
    const newMax = Math.max(maxStreak, newStreak)

    set({
      results: [...results, result],
      streak: newStreak,
      maxStreak: newMax,
      feedback: timedOut ? 'timeout' : correct ? 'correct' : 'wrong',
      revealedAnswer: correct ? null : round.target,
      locked: true,
    })

    return result
  },

  nextRound: () => {
    const { config, results, noteIndex, sessionStartedAt, maxStreak } = get()

    // Конец сессии: фиксированное число нот
    if (config.noteCount > 0 && results.length >= config.noteCount) {
      const summary = buildSummary(
        config,
        results,
        maxStreak,
        sessionStartedAt,
      )
      set({
        screen: 'results',
        lastSummary: summary,
        round: null,
        locked: false,
        feedback: 'idle',
        revealedAnswer: null,
      })
      return
    }

    const prevMidi = results[results.length - 1]?.target.midi
    const round = createRound(config, prevMidi)
    set({
      round,
      noteIndex: noteIndex + 1,
      feedback: 'idle',
      revealedAnswer: null,
      locked: false,
    })
  },

  endSession: () => {
    const { config, results, maxStreak, sessionStartedAt } = get()
    if (results.length === 0) {
      set({
        screen: 'home',
        round: null,
        locked: false,
        feedback: 'idle',
      })
      return null
    }
    const summary = buildSummary(config, results, maxStreak, sessionStartedAt)
    set({
      screen: 'results',
      lastSummary: summary,
      round: null,
      locked: false,
      feedback: 'idle',
      revealedAnswer: null,
    })
    return summary
  },

  goHome: () =>
    set({
      screen: 'home',
      round: null,
      locked: false,
      feedback: 'idle',
      revealedAnswer: null,
    }),

  goResults: () => set({ screen: 'results' }),

  clearFeedback: () =>
    set({ feedback: 'idle', revealedAnswer: null, locked: false }),
}))
