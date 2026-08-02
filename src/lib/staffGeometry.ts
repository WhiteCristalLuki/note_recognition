import type { NotePitch } from '../types'
import { ANSWER_RANGES, buildPool, fromMidi, isNatural } from './notes'

/** Индекс ступени: C=0 … B=6 (как в VexFlow) */
const STEP_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

/**
 * Номер «линии» VexFlow для ноты (keyProperties.line).
 * Используется с stave.getYForNote(line).
 */
export function noteLineForPitch(
  letter: string,
  octave: number,
  clef: 'treble' | 'bass',
): number {
  const index = STEP_INDEX[letter.toUpperCase()] ?? 0
  // Формула VexFlow Tables.keyProperties
  const baseIndex = octave * 7 - 4 * 7
  let line = (baseIndex + index) / 2
  if (clef === 'bass') line += 6
  return line
}

export function noteLineForMidi(midi: number, clef: 'treble' | 'bass'): number {
  const n = fromMidi(midi)
  return noteLineForPitch(n.letter, n.octave, clef)
}

export interface PitchPosition {
  midi: number
  note: NotePitch
  line: number
  y: number
}

/**
 * Y-координата ноты на стане (как VexFlow Stave.getYForNote).
 */
export function yForNoteLine(
  line: number,
  staveY: number,
  spacing: number,
  headroom: number,
): number {
  return staveY + headroom * spacing + 5 * spacing - line * spacing
}

/**
 * Обратное преобразование: Y → note line (дробное).
 */
export function noteLineFromY(
  y: number,
  staveY: number,
  spacing: number,
  headroom: number,
): number {
  return (staveY + headroom * spacing + 5 * spacing - y) / spacing
}

/**
 * Строит таблицу позиций натуральных нот для hit-testing.
 * @param getY — stave.getYForNote.bind(stave) или эквивалент
 */
export function buildPitchPositions(
  clef: 'treble' | 'bass',
  getY: (line: number) => number,
  minMidi?: number,
  maxMidi?: number,
): PitchPosition[] {
  const range = ANSWER_RANGES[clef]
  const lo = minMidi ?? range.minMidi
  const hi = maxMidi ?? range.maxMidi
  const midis = buildPool(lo, hi, false)

  return midis.map((midi) => {
    const note = fromMidi(midi)
    const line = noteLineForPitch(note.letter, note.octave, clef)
    return { midi, note, line, y: getY(line) }
  })
}

/** Ближайшая нота к вертикальной координате Y (горизонталь игнорируется). */
export function nearestPitchAtY(
  y: number,
  positions: PitchPosition[],
): PitchPosition | null {
  if (positions.length === 0) return null
  let best = positions[0]!
  let bestDist = Math.abs(y - best.y)
  for (let i = 1; i < positions.length; i++) {
    const p = positions[i]!
    const d = Math.abs(y - p.y)
    if (d < bestDist) {
      best = p
      bestDist = d
    }
  }
  return best
}

/** MIDI соседних натуральных ступеней (±1 step), для подсказки диапазона */
export function isNaturalMidi(midi: number): boolean {
  return isNatural(midi)
}
