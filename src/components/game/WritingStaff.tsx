import { useCallback, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { FeedbackState, NotePitch } from '../../types'
import { ANSWER_RANGES } from '../../lib/notes'
import { nearestPitchAtY, type PitchPosition } from '../../lib/staffGeometry'
import { renderWritingStaff, type DrawnNote } from '../../lib/vexflow'
import { useTheme } from '../../hooks/useTheme'
import {
  needsWriteConfirm,
  useCoarsePointer,
} from '../../hooks/useCoarsePointer'

interface WritingStaffProps {
  clef: 'treble' | 'bass'
  /** Целевая нота (для feedback / подписи) */
  target: NotePitch
  disabled?: boolean
  feedback: FeedbackState
  /** Выбранный пользователем ответ (после подтверждения) */
  selected: NotePitch | null
  onSelect: (note: NotePitch) => void
  className?: string
}

/**
 * Режим «Запись»: клик/тап по вертикали стана ставит целую ноту.
 * ПК (мышь): клик сразу засчитывает ответ.
 * Телефон/планшет: тап выбирает позицию, ответ — по кнопке «Подтвердить».
 */
export function WritingStaff({
  clef,
  target,
  disabled = false,
  feedback,
  selected,
  onSelect,
  className = '',
}: WritingStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const positionsRef = useRef<PitchPosition[]>([])
  const isDark = useTheme()
  const isCoarse = useCoarsePointer()
  const [widthTick, setWidthTick] = useState(0)
  /** Призрачная нота при наведении мышью */
  const [hoverNote, setHoverNote] = useState<NotePitch | null>(null)
  /** Выбранная, но ещё не подтверждённая нота (тач) */
  const [pendingNote, setPendingNote] = useState<NotePitch | null>(null)
  /** Тянем пальцем по стану */
  const draggingRef = useRef(false)

  const staffColor = isDark ? '#e2e8f0' : '#1e293b'
  const ghostColor = isDark
    ? 'rgba(148, 163, 184, 0.55)'
    : 'rgba(148, 163, 184, 0.7)'
  const pendingColor = isDark ? '#94a3b8' : '#64748b'
  const lockedColor = isDark ? '#f1f5f9' : '#0f172a'
  const wrongColor = '#ef4444'
  const correctColor = isDark ? '#f1f5f9' : '#0f172a'

  const range = ANSWER_RANGES[clef]

  const buildNotes = useCallback((): DrawnNote[] => {
    if (feedback === 'correct' && selected) {
      return [{ note: selected, color: lockedColor }]
    }
    if (feedback === 'wrong' || feedback === 'timeout') {
      const list: DrawnNote[] = []
      if (selected) {
        list.push({ note: selected, color: wrongColor })
      }
      if (!selected || selected.midi !== target.midi) {
        list.push({ note: target, color: correctColor })
      }
      return list
    }
    // Ожидание подтверждения на тач-устройстве
    if (pendingNote && !disabled) {
      return [{ note: pendingNote, color: pendingColor }]
    }
    // Призрак при наведении мышью
    if (hoverNote && !disabled) {
      return [{ note: hoverNote, color: ghostColor }]
    }
    return []
  }, [
    feedback,
    selected,
    target,
    pendingNote,
    hoverNote,
    disabled,
    lockedColor,
    wrongColor,
    correctColor,
    pendingColor,
    ghostColor,
  ])

  const draw = useCallback(async () => {
    const el = containerRef.current
    if (!el) return

    const width = Math.min(el.clientWidth || 400, 640)
    const height = 260

    const result = await renderWritingStaff({
      container: el,
      clef,
      width,
      height,
      staffColor,
      notes: buildNotes(),
      minMidi: range.minMidi,
      maxMidi: range.maxMidi,
    })
    positionsRef.current = result.positions
  }, [clef, staffColor, buildNotes, range.minMidi, range.maxMidi])

  useEffect(() => {
    void draw()
  }, [draw, widthTick])

  useEffect(() => {
    setHoverNote(null)
    setPendingNote(null)
    draggingRef.current = false
  }, [target.midi, disabled, feedback])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let t: number | null = null
    const ro = new ResizeObserver(() => {
      if (t !== null) window.clearTimeout(t)
      t = window.setTimeout(() => setWidthTick((n) => n + 1), 80)
    })
    ro.observe(el.parentElement ?? el)
    return () => {
      ro.disconnect()
      if (t !== null) window.clearTimeout(t)
    }
  }, [])

  const clientYToLocal = (clientY: number): number | null => {
    const el = containerRef.current
    if (!el) return null
    const svg = el.querySelector('svg')
    const box = (svg ?? el).getBoundingClientRect()
    const renderH =
      svg instanceof SVGSVGElement
        ? Number(svg.getAttribute('height')) || box.height
        : box.height
    const sy = box.height > 0 ? renderH / box.height : 1
    return (clientY - box.top) * sy
  }

  const pitchFromEvent = (clientY: number): NotePitch | null => {
    const y = clientYToLocal(clientY)
    if (y === null) return null
    const pos = nearestPitchAtY(y, positionsRef.current)
    return pos?.note ?? null
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || feedback !== 'idle') return

    const note = pitchFromEvent(e.clientY)
    if (!note) return

    // На таче при перетаскивании обновляем предварительный выбор
    if (needsWriteConfirm(e.pointerType)) {
      if (draggingRef.current || pendingNote) {
        setPendingNote((prev) =>
          prev?.midi === note.midi ? prev : note,
        )
      }
      return
    }

    // Мышь: призрачная нота
    setHoverNote((prev) => (prev?.midi === note.midi ? prev : note))
  }

  const onPointerLeave = () => {
    if (feedback !== 'idle') return
    setHoverNote(null)
    draggingRef.current = false
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || feedback !== 'idle') return
    e.preventDefault()

    const note = pitchFromEvent(e.clientY)
    if (!note) return

    if (needsWriteConfirm(e.pointerType)) {
      // Тач/стилус: только предварительный выбор
      draggingRef.current = true
      setHoverNote(null)
      setPendingNote(note)
      try {
        containerRef.current?.setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
      return
    }

    // Мышь: сразу ответ
    setHoverNote(null)
    setPendingNote(null)
    onSelect(note)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (needsWriteConfirm(e.pointerType)) {
      draggingRef.current = false
      try {
        containerRef.current?.releasePointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    }
  }

  const confirmPending = () => {
    if (!pendingNote || disabled || feedback !== 'idle') return
    const note = pendingNote
    setPendingNote(null)
    onSelect(note)
  }

  const feedbackRing =
    feedback === 'correct'
      ? 'ring-2 ring-green-500/50'
      : feedback === 'wrong' || feedback === 'timeout'
        ? 'ring-2 ring-red-500/50'
        : ''

  // Кнопка видна, когда есть предварительный выбор (тач/стилус)
  const showConfirm =
    !disabled && feedback === 'idle' && pendingNote !== null

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-700 dark:bg-slate-900 ${feedbackRing}`}
      >
        <div
          ref={containerRef}
          role="img"
          aria-label="Интерактивный нотный стан"
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`mx-auto w-full max-w-2xl touch-none select-none ${
            disabled || feedback !== 'idle'
              ? 'cursor-default'
              : 'cursor-crosshair'
          }`}
          style={{ minHeight: 240 }}
        />
      </div>

      {/* Кнопка подтверждения — для тач-выбора */}
      {showConfirm && (
        <button
          type="button"
          onClick={confirmPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500 active:scale-[0.98] sm:py-3.5"
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
          Подтвердить
          {pendingNote ? (
            <span className="rounded-lg bg-white/15 px-2 py-0.5 text-sm font-semibold">
              {pendingNote.name}
            </span>
          ) : null}
        </button>
      )}

      {isCoarse && !disabled && feedback === 'idle' && !pendingNote && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Коснитесь стана, чтобы выбрать позицию, затем нажмите «Подтвердить»
        </p>
      )}
    </div>
  )
}
