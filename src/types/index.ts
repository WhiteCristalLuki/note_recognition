/** Тип ключа нотного стана */
export type ClefType = 'treble' | 'bass' | 'both'

/** Режим тренировки */
export type GameMode = 'reading' | 'writing' | 'mixed'

/** Режим одного раунда (после раскрытия Mixed) */
export type RoundMode = 'reading' | 'writing'

/** Тема интерфейса */
export type ThemeMode = 'light' | 'dark' | 'system'

/** Источник конфигурации сессии */
export type DifficultyId = 'level' | 'custom'

/** Экраны приложения */
export type AppScreen = 'home' | 'game' | 'results'

/** Полное описание ноты (MIDI + имена) */
export interface NotePitch {
  /** MIDI-номер (C4 = 60) — сравнение ответов строго по MIDI (октава важна) */
  midi: number
  /** Русское имя с октавой, напр. «До4», «Соль♯5» */
  name: string
  /** Английское имя (C4, F#5) — для отладки / tonal */
  engName: string
  /** Буква ступени: C, D, E, F, G, A, B */
  letter: string
  /** Диез/бемоль: "#", "b" или пустая строка */
  accidental: '' | '#' | 'b'
  /** Октава (научная: 4 = средняя) */
  octave: number
  /** Ключ для VexFlow, напр. "c/4", "c#/4" */
  vexKey: string
}

/** Диапазон нот (для уровней с несколькими зонами / grand staff) */
export interface SessionRange {
  minMidi: number
  maxMidi: number
  displayClef?: 'treble' | 'bass'
}

/** Конфигурация игровой сессии */
export interface SessionConfig {
  mode: GameMode
  clef: ClefType
  /** Минимальный MIDI (включительно) — общий bounding box */
  minMidi: number
  /** Максимальный MIDI (включительно) */
  maxMidi: number
  /**
   * Несколько диапазонов (уровни 3.x и точные пулы).
   * Если задано — генерация идёт из объединения ranges.
   */
  ranges?: SessionRange[]
  /** Кол-во нот в сессии; 0 = бесконечно */
  noteCount: number
  /** Лимит времени на ответ (сек); 0 = без лимита */
  timeLimitSec: number
  /** Пауза между нотами (мс) */
  intervalMs: number
  /** Включать диезы/бемоли */
  includeAccidentals: boolean
  difficultyId: DifficultyId
  /** ID уровня («1.1» …), null для custom */
  levelId?: string | null
}

/** Один раунд (одна нота) */
export interface GameRound {
  target: NotePitch
  /** Ключ, на котором рисуем ноту */
  displayClef: 'treble' | 'bass'
  mode: RoundMode
  /**
   * Варианты ответа (Reading: кнопки по октавам).
   * Writing: пусто — ответ через клик по стану.
   */
  options: NotePitch[]
  startedAt: number
}

/** Результат ответа на раунд */
export interface RoundResult {
  target: NotePitch
  answer: NotePitch | null
  correct: boolean
  responseMs: number
  displayClef: 'treble' | 'bass'
  mode: RoundMode
  timedOut: boolean
}

/** Статистика текущей / завершённой сессии */
export interface SessionSummary {
  config: SessionConfig
  results: RoundResult[]
  correct: number
  incorrect: number
  maxStreak: number
  accuracy: number
  avgResponseMs: number
  /** Ошибки по имени ноты (с октавой) */
  errorsByNote: Record<string, number>
  startedAt: number
  finishedAt: number
}

/** Накопленная статистика (persist) */
export interface LifetimeStats {
  totalSessions: number
  totalNotes: number
  totalCorrect: number
  totalIncorrect: number
  bestStreak: number
  bestAccuracy: number
  /** Счётчик ошибок по нотам за всё время */
  errorsByNote: Record<string, number>
  /** История последних сессий */
  recentSessions: SessionSummary[]
}

/** Состояние обратной связи после ответа */
export type FeedbackState = 'idle' | 'correct' | 'wrong' | 'timeout'
