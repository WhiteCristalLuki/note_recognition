import { Midi, Note } from 'tonal'
import type { ClefType, NotePitch } from '../types'

/** C4 = 60 — средняя до */
export const MIDI_C4 = 60

const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11] as const // C D E F G A B
const SHARP_PC = [1, 3, 6, 8, 10] as const // C# D# F# G# A#

/** Русские названия ступеней */
const RU_LETTER: Record<string, string> = {
  C: 'До',
  D: 'Ре',
  E: 'Ми',
  F: 'Фа',
  G: 'Соль',
  A: 'Ля',
  B: 'Си',
}

const RU_ACC: Record<string, string> = {
  '#': '♯',
  b: '♭',
  '': '',
}

/**
 * Диапазоны кнопок ответа по ключу (натуральные ноты):
 * - скрипичный: Ми3–До6
 * - басовый:    Соль1–Ми4
 * - оба:        Соль1–До6
 */
export const ANSWER_RANGES = {
  treble: { minMidi: 52, maxMidi: 84 }, // E3–C6
  bass: { minMidi: 31, maxMidi: 64 }, // G1–E4
  both: { minMidi: 31, maxMidi: 84 }, // G1–C6
} as const

/** Русское имя ноты: «До4», «Ми♯3», «Си♭2» */
export function toRuName(
  letter: string,
  accidental: '' | '#' | 'b',
  octave: number,
): string {
  const base = RU_LETTER[letter.toUpperCase()] ?? letter
  const acc = RU_ACC[accidental] ?? ''
  return `${base}${acc}${octave}`
}

/**
 * Создаёт NotePitch из MIDI-номера.
 * @param preferSharps — при альтерациях предпочитать диезы (иначе бемоли)
 */
export function fromMidi(midi: number, preferSharps = true): NotePitch {
  const engName = Midi.midiToNoteName(midi, {
    sharps: preferSharps,
    pitchClass: false,
  })
  const parsed = Note.get(engName)

  const letter = (parsed.letter ?? 'C').toUpperCase()
  const accidental = (parsed.acc === '#' || parsed.acc === 'b' ? parsed.acc : '') as
    | ''
    | '#'
    | 'b'
  const octave = parsed.oct ?? 4

  // VexFlow: 'c/4', 'c#/4', 'bb/3'
  const vexAcc = accidental === 'b' ? 'b' : accidental === '#' ? '#' : ''
  const vexKey = `${letter.toLowerCase()}${vexAcc}/${octave}`

  const name = toRuName(letter, accidental, octave)

  return {
    midi,
    name,
    engName: parsed.name || engName,
    letter,
    accidental,
    octave,
    vexKey,
  }
}

/** MIDI из имени ноты (tonal / английское) */
export function toMidi(name: string): number | null {
  return Midi.toMidi(name)
}

/** Является ли MIDI натуральной нотой (без альтерации) */
export function isNatural(midi: number): boolean {
  return NATURAL_PC.includes((midi % 12) as (typeof NATURAL_PC)[number])
}

/** Список всех MIDI в диапазоне с учётом accidentals */
export function buildPool(
  minMidi: number,
  maxMidi: number,
  includeAccidentals: boolean,
): number[] {
  const lo = Math.min(minMidi, maxMidi)
  const hi = Math.max(minMidi, maxMidi)
  const pool: number[] = []

  for (let m = lo; m <= hi; m++) {
    if (includeAccidentals || isNatural(m)) {
      pool.push(m)
    }
  }
  return pool
}

/** Диапазон кнопок ответа для выбранного ключа */
export function getAnswerRange(clef: ClefType): {
  minMidi: number
  maxMidi: number
} {
  return ANSWER_RANGES[clef]
}

/**
 * Полный набор кнопок ответа по ключу (Ми3–До6 / Соль1–Ми4 / Соль1–До6).
 * Всегда включает exact pitch — проверка идёт по MIDI (октава обязательна).
 */
export function buildAnswerButtons(
  clef: ClefType,
  includeAccidentals = false,
): NotePitch[] {
  const { minMidi, maxMidi } = getAnswerRange(clef)
  return buildPool(minMidi, maxMidi, includeAccidentals).map((m) =>
    fromMidi(m, true),
  )
}

/**
 * Группирует ноты по октавам (для раскладки кнопок строками).
 * Порядок внутри октавы: До → Си.
 */
export function groupByOctave(notes: NotePitch[]): {
  octave: number
  notes: NotePitch[]
}[] {
  const map = new Map<number, NotePitch[]>()
  for (const n of notes) {
    const list = map.get(n.octave) ?? []
    list.push(n)
    map.set(n.octave, list)
  }

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([octave, list]) => ({
      octave,
      notes: list.sort((a, b) => a.midi - b.midi),
    }))
}

/**
 * Ближайшие варианты для Writing (мини-станы): окно вокруг правильной ноты
 * из пула кнопок ответа.
 */
export function generateNearbyOptions(
  correctMidi: number,
  pool: number[],
  count = 8,
  preferSharps = true,
): NotePitch[] {
  if (pool.length === 0) {
    return [fromMidi(correctMidi, preferSharps)]
  }

  const unique = [...new Set(pool)].sort((a, b) => a - b)
  let work = unique
  let correctIdx = unique.indexOf(correctMidi)
  if (correctIdx < 0) {
    work = [...unique, correctMidi].sort((a, b) => a - b)
    correctIdx = work.indexOf(correctMidi)
  }

  if (work.length <= count) {
    return work.map((m) => fromMidi(m, preferSharps))
  }

  const half = Math.floor(count / 2)
  let start = Math.max(0, correctIdx - half)
  let end = start + count
  if (end > work.length) {
    end = work.length
    start = Math.max(0, end - count)
  }

  const slice = work.slice(start, end)
  if (!slice.includes(correctMidi)) {
    slice[Math.floor(slice.length / 2)] = correctMidi
    slice.sort((a, b) => a - b)
  }

  return slice.map((m) => fromMidi(m, preferSharps))
}

/** @deprecated используйте buildAnswerButtons / generateNearbyOptions */
export function generateOptions(
  correctMidi: number,
  pool: number[],
  count = 7,
  preferSharps = true,
): NotePitch[] {
  return generateNearbyOptions(correctMidi, pool, count, preferSharps)
}

/** Случайный элемент массива */
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/** Перемешать (Fisher–Yates) */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Человекочитаемое имя (русское) */
export function formatNoteLabel(note: NotePitch): string {
  return note.name
}

/** Все натуральные ноты октавы (C..B) для научной октавы */
export function naturalOctave(octave: number): NotePitch[] {
  const cMidi = (octave + 1) * 12
  return NATURAL_PC.map((pc) => fromMidi(cMidi + pc))
}

export { NATURAL_PC, SHARP_PC, RU_LETTER }
