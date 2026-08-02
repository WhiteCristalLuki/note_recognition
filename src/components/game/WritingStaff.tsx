import { useCallback, useEffect, useRef, useState } from 'react'
import type { FeedbackState, NotePitch } from '../../types'
import { ANSWER_RANGES } from '../../lib/notes'
import { nearestPitchAtY, type PitchPosition } from '../../lib/staffGeometry'
import { renderWritingStaff, type DrawnNote } from '../../lib/vexflow'
import { useTheme } from '../../hooks/useTheme'

interface WritingStaffProps {
  clef: 'treble' | 'bass'
  /** Целевая нота (для feedback / подписи) */
  target: NotePitch
  disabled?: boolean
  feedback: FeedbackState
  /** Выбранный пользователем ответ (после клика) */
  selected: NotePitch | null
  onSelect: (note: NotePitch) => void
  className?: string
}

/**
 * Режим «Запись»: клик по вертикали стана ставит целую ноту.
 * Hover — блёклая «призрачная» нота; клик — фиксация; ошибка — красная + правильная чёрная.
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
  const [widthTick, setWidthTick] = useState(0)
  const [hoverNote, setHoverNote] = useState<NotePitch | null>(null)

  const staffColor = isDark ? '#e2e8f0' : '#1e293b'
  const ghostColor = isDark ? 'rgba(148, 163, 184, 0.55)' : 'rgba(148, 163, 184, 0.7)'
  const lockedColor = isDark ? '#f1f5f9' : '#0f172a'
  const wrongColor = '#ef4444'
  const correctColor = isDark ? '#f1f5f9' : '#0f172a'

  const range = ANSWER_RANGES[clef]

  const buildNotes = useCallback((): DrawnNote[] => {
    // После ответа
    if (feedback === 'correct' && selected) {
      return [{ note: selected, color: lockedColor }]
    }
    if (feedback === 'wrong' || feedback === 'timeout') {
      const list: DrawnNote[] = []
      if (selected) {
        list.push({ note: selected, color: wrongColor })
      }
      // Правильная нота — чёрная (если не совпала с выбранной)
      if (!selected || selected.midi !== target.midi) {
        list.push({ note: target, color: correctColor })
      }
      return list
    }
    // Ожидание: призрачная нота при наведении
    if (hoverNote && !disabled) {
      return [{ note: hoverNote, color: ghostColor }]
    }
    return []
  }, [
    feedback,
    selected,
    target,
    hoverNote,
    disabled,
    lockedColor,
    wrongColor,
    correctColor,
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

  // Сброс hover при смене раунда / блокировке
  useEffect(() => {
    setHoverNote(null)
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
    // VexFlow рисует в пикселях 1:1; при CSS-масштабировании пересчитываем
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
    setHoverNote((prev) => {
      if (prev?.midi === note?.midi) return prev
      return note
    })
  }

  const onPointerLeave = () => {
    if (feedback !== 'idle') return
    setHoverNote(null)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || feedback !== 'idle') return
    e.preventDefault()
    const note = pitchFromEvent(e.clientY)
    if (note) {
      setHoverNote(null)
      onSelect(note)
    }
  }

  const feedbackRing =
    feedback === 'correct'
      ? 'ring-2 ring-green-500/50'
      : feedback === 'wrong' || feedback === 'timeout'
        ? 'ring-2 ring-red-500/50'
        : ''

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-700 dark:bg-slate-900 ${feedbackRing} ${className}`}
    >
      <div
        ref={containerRef}
        role="img"
        aria-label="Интерактивный нотный стан"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        className={`mx-auto w-full max-w-2xl touch-none select-none ${
          disabled || feedback !== 'idle'
            ? 'cursor-default'
            : 'cursor-crosshair'
        }`}
        style={{ minHeight: 240 }}
      />
    </div>
  )
}
