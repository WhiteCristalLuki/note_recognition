import type {
  ClefType,
  GameRound,
  RoundMode,
  SessionConfig,
  SessionRange,
} from '../types'
import {
  buildAnswerButtons,
  buildPool,
  fromMidi,
  getAnswerRange,
  pickRandom,
} from './notes'

export interface PoolEntry {
  midi: number
  displayClef?: 'treble' | 'bass'
}

/**
 * Собирает пул MIDI из config.ranges или min/max.
 * Для grand staff у каждой ноты может быть предпочтительный ключ.
 */
export function buildSessionPool(config: SessionConfig): PoolEntry[] {
  const ranges: SessionRange[] =
    config.ranges && config.ranges.length > 0
      ? config.ranges
      : [{ minMidi: config.minMidi, maxMidi: config.maxMidi }]

  const map = new Map<number, PoolEntry>()

  for (const range of ranges) {
    const midis = buildPool(
      range.minMidi,
      range.maxMidi,
      config.includeAccidentals,
    )
    for (const midi of midis) {
      const prev = map.get(midi)
      // Если нота уже есть из другого диапазона — сохраняем первый displayClef
      if (!prev) {
        map.set(midi, { midi, displayClef: range.displayClef })
      }
    }
  }

  // Ограничиваем диапазоном кнопок ответа ключа
  const answerRange = getAnswerRange(config.clef)
  return [...map.values()]
    .filter(
      (e) => e.midi >= answerRange.minMidi && e.midi <= answerRange.maxMidi,
    )
    .sort((a, b) => a.midi - b.midi)
}

/**
 * Подбирает ключ для отображения ноты.
 */
export function pickDisplayClef(
  midi: number,
  clef: ClefType,
  preferred?: 'treble' | 'bass',
): 'treble' | 'bass' {
  if (clef === 'treble') return 'treble'
  if (clef === 'bass') return 'bass'
  if (preferred) return preferred

  if (midi < 55) return 'bass'
  if (midi > 67) return 'treble'
  return Math.random() < 0.5 ? 'treble' : 'bass'
}

export function pickRoundMode(mode: SessionConfig['mode']): RoundMode {
  if (mode === 'mixed') {
    return Math.random() < 0.5 ? 'reading' : 'writing'
  }
  return mode
}

/**
 * Создаёт следующий раунд.
 * Равномерное распределение по пулу уровня.
 * Reading: полный набор кнопок по ключу (октава = MIDI).
 * Writing: соседние позиции на стане.
 */
export function createRound(
  config: SessionConfig,
  previousMidi?: number,
): GameRound {
  const pool = buildSessionPool(config)

  if (pool.length === 0) {
    const target = fromMidi(60, true)
    return {
      target,
      displayClef: 'treble',
      mode: 'reading',
      options: buildAnswerButtons('treble', false),
      startedAt: Date.now(),
    }
  }

  let candidates = pool
  if (previousMidi !== undefined && pool.length > 1) {
    candidates = pool.filter((e) => e.midi !== previousMidi)
    if (candidates.length === 0) candidates = pool
  }

  const entry = pickRandom(candidates)
  const target = fromMidi(entry.midi, true)
  const displayClef = pickDisplayClef(
    entry.midi,
    config.clef,
    entry.displayClef,
  )
  const mode = pickRoundMode(config.mode)

  // Reading: сетка кнопок; Writing: интерактивный стан (options не нужны)
  const options =
    mode === 'reading'
      ? buildAnswerButtons(config.clef, config.includeAccidentals)
      : []

  return {
    target,
    displayClef,
    mode,
    options,
    startedAt: Date.now(),
  }
}
