import type { ClefType, GameMode, SessionConfig } from '../types'
import { fromMidi } from './notes'

/** Один диапазон внутри уровня (для grand staff — несколько) */
export interface LevelRange {
  minMidi: number
  maxMidi: number
  /** Предпочтительный ключ отрисовки нот из этого диапазона */
  displayClef?: 'treble' | 'bass'
}

export interface LevelDef {
  /** «1.1», «2.18», «3.9» */
  id: string
  part: 1 | 2 | 3
  /** Порядковый номер внутри части */
  index: number
  mode: GameMode
  clef: ClefType
  ranges: LevelRange[]
  noteCount: number
  isFinale: boolean
  /** Человекочитаемый диапазон */
  rangeLabel: string
  /** Краткое описание */
  hint?: string
}

export interface LevelPart {
  id: 1 | 2 | 3
  title: string
  subtitle: string
  clef: ClefType
}

export const LEVEL_PARTS: LevelPart[] = [
  {
    id: 1,
    title: 'Скрипичный ключ',
    subtitle: 'Часть 1 · Ми3–До6',
    clef: 'treble',
  },
  {
    id: 2,
    title: 'Басовый ключ',
    subtitle: 'Часть 2 · Соль1–Ми4',
    clef: 'bass',
  },
  {
    id: 3,
    title: 'Оба ключа',
    subtitle: 'Часть 3 · Grand staff',
    clef: 'both',
  },
]

const MODE_RU: Record<GameMode, string> = {
  reading: 'Чтение',
  writing: 'Запись',
  mixed: 'Смешанный',
}

/** MIDI: G3=55, B4=71, C5=72, C6=84, E3=52, G1=31, F2=41, G2=43, F3=53, E4=64, C3=48 */
const M = {
  G1: 31,
  F2: 41,
  G2: 43,
  C3: 48,
  E3: 52,
  F3: 53,
  G3: 55,
  B4: 71,
  C5: 72,
  E4: 64,
  C6: 84,
} as const

const N20 = 20
const N50 = 50

function L(
  id: string,
  part: 1 | 2 | 3,
  index: number,
  mode: GameMode,
  clef: ClefType,
  ranges: LevelRange[],
  rangeLabel: string,
  opts?: { finale?: boolean; hint?: string; noteCount?: number },
): LevelDef {
  const isFinale = opts?.finale ?? false
  return {
    id,
    part,
    index,
    mode,
    clef,
    ranges,
    rangeLabel,
    hint: opts?.hint,
    isFinale,
    noteCount: opts?.noteCount ?? (isFinale ? N50 : N20),
  }
}

/**
 * Каталог уровней.
 *
 * Скрипичный (часть 1):
 *   1.1–1.3  Соль3–Си4  (чтение → запись → смешанный)
 *   1.4–1.6  До5–До6
 *   1.7–1.9  Ми3–До6    (1.9 — финал, 50 нот)
 *
 * В ТЗ у смешанного До5–До6 был дубль номера «1.5»; здесь это 1.6,
 * поэтому финальный смешанный сдвинут на 1.9 (в ТЗ он был указан как 1.8).
 *
 * Басовый: 2.1–2.18, финал 2.18 · Оба ключа: 3.1–3.9, финал 3.9.
 */
export const LEVELS: LevelDef[] = [
  // ─── Часть 1: скрипичный ─────────────────────────────────
  L('1.1', 1, 1, 'reading', 'treble', [{ minMidi: M.G3, maxMidi: M.B4 }], 'Соль3 – Си4'),
  L('1.2', 1, 2, 'writing', 'treble', [{ minMidi: M.G3, maxMidi: M.B4 }], 'Соль3 – Си4'),
  L('1.3', 1, 3, 'mixed', 'treble', [{ minMidi: M.G3, maxMidi: M.B4 }], 'Соль3 – Си4'),

  L('1.4', 1, 4, 'reading', 'treble', [{ minMidi: M.C5, maxMidi: M.C6 }], 'До5 – До6', {
    hint: '5-я октава + До6',
  }),
  L('1.5', 1, 5, 'writing', 'treble', [{ minMidi: M.C5, maxMidi: M.C6 }], 'До5 – До6'),
  L('1.6', 1, 6, 'mixed', 'treble', [{ minMidi: M.C5, maxMidi: M.C6 }], 'До5 – До6'),

  L('1.7', 1, 7, 'reading', 'treble', [{ minMidi: M.E3, maxMidi: M.C6 }], 'Ми3 – До6', {
    hint: 'Весь диапазон скрипичного',
  }),
  L('1.8', 1, 8, 'writing', 'treble', [{ minMidi: M.E3, maxMidi: M.C6 }], 'Ми3 – До6'),
  L('1.9', 1, 9, 'mixed', 'treble', [{ minMidi: M.E3, maxMidi: M.C6 }], 'Ми3 – До6', {
    finale: true,
    hint: 'Заключительный уровень части 1 · 50 нот',
  }),

  // ─── Часть 2: басовый ────────────────────────────────────
  L('2.1', 2, 1, 'reading', 'bass', [{ minMidi: M.G1, maxMidi: M.F2 }], 'Соль1 – Фа2'),
  L('2.2', 2, 2, 'writing', 'bass', [{ minMidi: M.G1, maxMidi: M.F2 }], 'Соль1 – Фа2'),
  L('2.3', 2, 3, 'mixed', 'bass', [{ minMidi: M.G1, maxMidi: M.F2 }], 'Соль1 – Фа2'),

  L('2.4', 2, 4, 'reading', 'bass', [{ minMidi: M.G2, maxMidi: M.F3 }], 'Соль2 – Фа3'),
  L('2.5', 2, 5, 'writing', 'bass', [{ minMidi: M.G2, maxMidi: M.F3 }], 'Соль2 – Фа3'),
  L('2.6', 2, 6, 'mixed', 'bass', [{ minMidi: M.G2, maxMidi: M.F3 }], 'Соль2 – Фа3'),

  L('2.7', 2, 7, 'reading', 'bass', [{ minMidi: M.G3, maxMidi: M.E4 }], 'Соль3 – Ми4'),
  L('2.8', 2, 8, 'writing', 'bass', [{ minMidi: M.G3, maxMidi: M.E4 }], 'Соль3 – Ми4'),
  L('2.9', 2, 9, 'mixed', 'bass', [{ minMidi: M.G3, maxMidi: M.E4 }], 'Соль3 – Ми4'),

  L('2.10', 2, 10, 'reading', 'bass', [{ minMidi: M.G1, maxMidi: M.F3 }], 'Соль1 – Фа3', {
    hint: 'Комбинация 1–2-й групп',
  }),
  L('2.11', 2, 11, 'writing', 'bass', [{ minMidi: M.G1, maxMidi: M.F3 }], 'Соль1 – Фа3'),
  L('2.12', 2, 12, 'mixed', 'bass', [{ minMidi: M.G1, maxMidi: M.F3 }], 'Соль1 – Фа3'),

  L('2.13', 2, 13, 'reading', 'bass', [{ minMidi: M.G2, maxMidi: M.E4 }], 'Соль2 – Ми4', {
    hint: 'Комбинация 2–3-й групп',
  }),
  L('2.14', 2, 14, 'writing', 'bass', [{ minMidi: M.G2, maxMidi: M.E4 }], 'Соль2 – Ми4'),
  L('2.15', 2, 15, 'mixed', 'bass', [{ minMidi: M.G2, maxMidi: M.E4 }], 'Соль2 – Ми4'),

  L('2.16', 2, 16, 'reading', 'bass', [{ minMidi: M.G1, maxMidi: M.E4 }], 'Соль1 – Ми4', {
    hint: 'Весь диапазон басового',
  }),
  L('2.17', 2, 17, 'writing', 'bass', [{ minMidi: M.G1, maxMidi: M.E4 }], 'Соль1 – Ми4'),
  L('2.18', 2, 18, 'mixed', 'bass', [{ minMidi: M.G1, maxMidi: M.E4 }], 'Соль1 – Ми4', {
    finale: true,
    hint: 'Заключительный уровень части 2',
  }),

  // ─── Часть 3: оба ключа ──────────────────────────────────
  L(
    '3.1',
    3,
    1,
    'reading',
    'both',
    [
      { minMidi: M.G3, maxMidi: M.B4, displayClef: 'treble' },
      { minMidi: M.G1, maxMidi: M.C3, displayClef: 'bass' },
    ],
    'Соль3–Си4 + Соль1–До3',
  ),
  L(
    '3.2',
    3,
    2,
    'writing',
    'both',
    [
      { minMidi: M.G3, maxMidi: M.B4, displayClef: 'treble' },
      { minMidi: M.G1, maxMidi: M.C3, displayClef: 'bass' },
    ],
    'Соль3–Си4 + Соль1–До3',
  ),
  L(
    '3.3',
    3,
    3,
    'mixed',
    'both',
    [
      { minMidi: M.G3, maxMidi: M.B4, displayClef: 'treble' },
      { minMidi: M.G1, maxMidi: M.C3, displayClef: 'bass' },
    ],
    'Соль3–Си4 + Соль1–До3',
  ),

  L(
    '3.4',
    3,
    4,
    'reading',
    'both',
    [
      { minMidi: M.C5, maxMidi: M.C6, displayClef: 'treble' },
      { minMidi: M.C3, maxMidi: M.E4, displayClef: 'bass' },
    ],
    'До5–До6 + До3–Ми4',
  ),
  L(
    '3.5',
    3,
    5,
    'writing',
    'both',
    [
      { minMidi: M.C5, maxMidi: M.C6, displayClef: 'treble' },
      { minMidi: M.C3, maxMidi: M.E4, displayClef: 'bass' },
    ],
    'До5–До6 + До3–Ми4',
  ),
  L(
    '3.6',
    3,
    6,
    'mixed',
    'both',
    [
      { minMidi: M.C5, maxMidi: M.C6, displayClef: 'treble' },
      { minMidi: M.C3, maxMidi: M.E4, displayClef: 'bass' },
    ],
    'До5–До6 + До3–Ми4',
  ),

  L(
    '3.7',
    3,
    7,
    'reading',
    'both',
    [
      { minMidi: M.G3, maxMidi: M.C6, displayClef: 'treble' },
      { minMidi: M.G1, maxMidi: M.E4, displayClef: 'bass' },
    ],
    'Соль3–До6 + Соль1–Ми4',
    { hint: 'Широкий диапазон обоих ключей' },
  ),
  L(
    '3.8',
    3,
    8,
    'writing',
    'both',
    [
      { minMidi: M.G3, maxMidi: M.C6, displayClef: 'treble' },
      { minMidi: M.G1, maxMidi: M.E4, displayClef: 'bass' },
    ],
    'Соль3–До6 + Соль1–Ми4',
  ),
  L(
    '3.9',
    3,
    9,
    'mixed',
    'both',
    [
      { minMidi: M.G3, maxMidi: M.C6, displayClef: 'treble' },
      { minMidi: M.G1, maxMidi: M.E4, displayClef: 'bass' },
    ],
    'Соль3–До6 + Соль1–Ми4',
    {
      finale: true,
      hint: 'Заключительный уровень части 3',
    },
  ),
]

export function getLevel(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function getLevelsByPart(part: 1 | 2 | 3): LevelDef[] {
  return LEVELS.filter((l) => l.part === part)
}

export function modeLabel(mode: GameMode): string {
  return MODE_RU[mode]
}

/** Объединённый min/max для совместимости со старым API */
export function levelBounds(level: LevelDef): { minMidi: number; maxMidi: number } {
  let minMidi = Infinity
  let maxMidi = -Infinity
  for (const r of level.ranges) {
    minMidi = Math.min(minMidi, r.minMidi)
    maxMidi = Math.max(maxMidi, r.maxMidi)
  }
  return { minMidi, maxMidi }
}

/** SessionConfig из определения уровня */
export function configFromLevel(level: LevelDef): SessionConfig {
  const { minMidi, maxMidi } = levelBounds(level)
  return {
    mode: level.mode,
    clef: level.clef,
    minMidi,
    maxMidi,
    noteCount: level.noteCount,
    timeLimitSec: 0,
    intervalMs: 600,
    includeAccidentals: false,
    difficultyId: 'level',
    levelId: level.id,
    ranges: level.ranges,
  }
}

export function formatLevelTitle(level: LevelDef): string {
  return `Уровень ${level.id}`
}

export function formatLevelSubtitle(level: LevelDef): string {
  return `${level.rangeLabel} · ${modeLabel(level.mode)}`
}

/** Подпись диапазона уровня для UI (с MIDI-именами) */
export function formatRangeDebug(level: LevelDef): string {
  return level.ranges
    .map((r) => `${fromMidi(r.minMidi).name}–${fromMidi(r.maxMidi).name}`)
    .join(' + ')
}

export const DEFAULT_LEVEL_ID = '1.1'
