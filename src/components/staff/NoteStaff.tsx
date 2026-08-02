import { useCallback, useEffect, useRef, useState } from 'react'
import type { NotePitch } from '../../types'
import { renderGrandStaff, renderStaff } from '../../lib/vexflow'
import { useTheme } from '../../hooks/useTheme'

interface NoteStaffProps {
  note: NotePitch | null
  clef: 'treble' | 'bass'
  /** Показывать оба ключа (grand staff) */
  grand?: boolean
  showNote?: boolean
  feedback?: 'idle' | 'correct' | 'wrong' | 'timeout'
  className?: string
  /** Компактный режим для вариантов Writing */
  compact?: boolean
}

export function NoteStaff({
  note,
  clef,
  grand = false,
  showNote = true,
  feedback = 'idle',
  className = '',
  compact = false,
}: NoteStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDark = useTheme()
  const [widthTick, setWidthTick] = useState(0)

  const draw = useCallback(async () => {
    const el = containerRef.current
    if (!el) return

    const width = Math.min(el.clientWidth || 360, 520)
    const height = compact ? 120 : grand ? 220 : 180
    const color = isDark ? '#e2e8f0' : '#1e293b'

    if (grand && note) {
      await renderGrandStaff({
        container: el,
        note,
        displayClef: clef,
        width,
        height,
        color,
      })
    } else {
      await renderStaff({
        container: el,
        note,
        clef,
        width,
        height,
        color,
        showNote: showNote && !!note,
      })
    }
  }, [note, clef, grand, showNote, isDark, compact])

  useEffect(() => {
    void draw()
  }, [draw, feedback, widthTick])

  // Перерисовка при ресайзе
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let t: number | null = null
    const ro = new ResizeObserver(() => {
      if (t !== null) window.clearTimeout(t)
      t = window.setTimeout(() => setWidthTick((n) => n + 1), 80)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (t !== null) window.clearTimeout(t)
    }
  }, [])

  const feedbackClass =
    feedback === 'correct'
      ? 'feedback-correct ring-2 ring-green-500/50'
      : feedback === 'wrong' || feedback === 'timeout'
        ? 'feedback-wrong ring-2 ring-red-500/50'
        : ''

  const animClass =
    feedback === 'correct'
      ? 'animate-[pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]'
      : feedback === 'wrong' || feedback === 'timeout'
        ? 'animate-[shake_0.4s_ease-in-out]'
        : 'animate-[fade-in_0.3s_ease-out]'

  return (
    <div
      className={`staff-container overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition dark:border-slate-700 dark:bg-slate-900 ${feedbackClass} ${animClass} ${className}`}
    >
      <div
        ref={containerRef}
        className="mx-auto flex w-full max-w-lg items-center justify-center"
        style={{ minHeight: compact ? 100 : grand ? 200 : 160 }}
      />
    </div>
  )
}
