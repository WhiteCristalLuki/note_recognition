import type { NotePitch } from '../types'
import {
  buildPitchPositions,
  noteLineForPitch,
  type PitchPosition,
} from './staffGeometry'

export interface RenderStaffOptions {
  container: HTMLDivElement
  note: NotePitch | null
  clef: 'treble' | 'bass'
  width: number
  height: number
  /** Цвет элементов (линии + нота) */
  color: string
  /** Показать ноту (false — пустой стан) */
  showNote?: boolean
}

export interface DrawnNote {
  note: NotePitch
  /** fill/stroke цвет ноты */
  color: string
}

export interface WritingStaffRenderResult {
  positions: PitchPosition[]
  width: number
  height: number
}

const STAVE_X = 10
const STAVE_OPTIONS = {
  spaceAboveStaffLn: 5,
  spaceBelowStaffLn: 5,
  spacingBetweenLinesPx: 12,
}

/**
 * Рисует нотный стан с одной целой нотой через VexFlow 5.
 */
export async function renderStaff(opts: RenderStaffOptions): Promise<void> {
  const {
    container,
    note,
    clef,
    width,
    height,
    color,
    showNote = true,
  } = opts

  const notes: DrawnNote[] =
    showNote && note ? [{ note, color }] : []

  await renderStaffNotes({
    container,
    clef,
    width,
    height,
    staffColor: color,
    notes,
  })
}

/**
 * Рисует grand staff (скрипичный + басовый) с одной нотой на подходящем ключе.
 */
export async function renderGrandStaff(opts: {
  container: HTMLDivElement
  note: NotePitch
  displayClef: 'treble' | 'bass'
  width: number
  height: number
  color: string
}): Promise<void> {
  const { container, note, displayClef, width, height, color } = opts

  const {
    Accidental,
    Formatter,
    Renderer,
    Stave,
    StaveConnector,
    StaveNote,
  } = await import('vexflow')

  container.innerHTML = ''

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const ctx = renderer.getContext()
  ctx.setFillStyle(color)
  ctx.setStrokeStyle(color)

  const staffWidth = Math.max(width - 20, 80)
  const treble = new Stave(STAVE_X, 30, staffWidth, STAVE_OPTIONS)
  treble.addClef('treble')
  treble.setStyle({ fillStyle: color, strokeStyle: color })
  treble.setContext(ctx).draw()

  const bass = new Stave(STAVE_X, 140, staffWidth, STAVE_OPTIONS)
  bass.addClef('bass')
  bass.setStyle({ fillStyle: color, strokeStyle: color })
  bass.setContext(ctx).draw()

  const connector = new StaveConnector(treble, bass)
  connector.setType('brace')
  connector.setStyle({ fillStyle: color, strokeStyle: color })
  connector.setContext(ctx).draw()

  const active = displayClef === 'treble' ? treble : bass
  const staveNote = makeStaveNote(StaveNote, Accidental, note, displayClef, color)
  Formatter.FormatAndDraw(ctx, active, [staveNote])
}

/**
 * Интерактивный / feedback-стан для режима «Запись»:
 * пустой стан + произвольный набор целых нот с цветами.
 * Возвращает позиции натуральных нот для hit-testing по Y.
 */
export async function renderWritingStaff(opts: {
  container: HTMLDivElement
  clef: 'treble' | 'bass'
  width: number
  height: number
  staffColor: string
  notes: DrawnNote[]
  minMidi?: number
  maxMidi?: number
}): Promise<WritingStaffRenderResult> {
  const { container, clef, width, height, staffColor, notes, minMidi, maxMidi } =
    opts

  const { Formatter, Renderer, Stave } = await import('vexflow')
  const { Accidental, StaveNote } = await import('vexflow')

  container.innerHTML = ''

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const ctx = renderer.getContext()
  ctx.setFillStyle(staffColor)
  ctx.setStrokeStyle(staffColor)

  const staveY = Math.max(24, Math.floor(height * 0.12))
  const stave = new Stave(
    STAVE_X,
    staveY,
    Math.max(width - 20, 80),
    STAVE_OPTIONS,
  )
  stave.addClef(clef)
  stave.setStyle({ fillStyle: staffColor, strokeStyle: staffColor })
  stave.setContext(ctx).draw()

  if (notes.length > 0) {
    const staveNotes = notes.map((n) =>
      makeStaveNote(StaveNote, Accidental, n.note, clef, n.color),
    )
    Formatter.FormatAndDraw(ctx, stave, staveNotes)
  }

  const positions = buildPitchPositions(
    clef,
    (line) => stave.getYForNote(line),
    minMidi,
    maxMidi,
  )

  return { positions, width, height }
}

/** Внутренний рендер стана + нот (Reading и прочее) */
async function renderStaffNotes(opts: {
  container: HTMLDivElement
  clef: 'treble' | 'bass'
  width: number
  height: number
  staffColor: string
  notes: DrawnNote[]
}): Promise<void> {
  const { container, clef, width, height, staffColor, notes } = opts

  const {
    Accidental,
    Formatter,
    Renderer,
    Stave,
    StaveNote,
  } = await import('vexflow')

  container.innerHTML = ''

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const ctx = renderer.getContext()
  ctx.setFillStyle(staffColor)
  ctx.setStrokeStyle(staffColor)

  const staveY = height > 160 ? 40 : 20
  const stave = new Stave(STAVE_X, staveY, Math.max(width - 20, 80))
  stave.addClef(clef)
  stave.setStyle({ fillStyle: staffColor, strokeStyle: staffColor })
  stave.setContext(ctx).draw()

  if (notes.length === 0) return

  const staveNotes = notes.map((n) =>
    makeStaveNote(StaveNote, Accidental, n.note, clef, n.color),
  )
  Formatter.FormatAndDraw(ctx, stave, staveNotes)
}

function makeStaveNote(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StaveNote: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Accidental: any,
  note: NotePitch,
  clef: 'treble' | 'bass',
  color: string,
) {
  const staveNote = new StaveNote({
    keys: [note.vexKey],
    duration: 'w',
    clef,
    autoStem: true,
  })

  if (note.accidental === '#') {
    staveNote.addModifier(new Accidental('#'), 0)
  } else if (note.accidental === 'b') {
    staveNote.addModifier(new Accidental('b'), 0)
  }

  staveNote.setStyle({ fillStyle: color, strokeStyle: color })
  return staveNote
}

/** Экспорт для тестов / отладки */
export { noteLineForPitch }
