import type { ReactNode } from 'react'
import { Flame, Target, Check, X, Timer } from 'lucide-react'

interface GameHUDProps {
  noteIndex: number
  noteCount: number
  correct: number
  incorrect: number
  streak: number
  remaining: number | null
  progress: number
}

export function GameHUD({
  noteIndex,
  noteCount,
  correct,
  incorrect,
  streak,
  remaining,
  progress,
}: GameHUDProps) {
  const total = correct + incorrect
  const accuracy = total === 0 ? 100 : Math.round((correct / total) * 100)
  const infinite = noteCount === 0

  return (
    <div className="space-y-3">
      {/* Прогресс сессии */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>
          Нота{' '}
          <span className="text-slate-800 dark:text-slate-200">
            {noteIndex}
            {infinite ? '' : ` / ${noteCount}`}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-3.5 w-3.5" />
          {accuracy}%
        </span>
      </div>

      {!infinite && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, ((noteIndex - 1) / noteCount) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Метрики */}
      <div className="grid grid-cols-4 gap-2">
        <Stat
          icon={<Check className="h-3.5 w-3.5 text-green-500" />}
          label="Верно"
          value={correct}
        />
        <Stat
          icon={<X className="h-3.5 w-3.5 text-red-500" />}
          label="Ошибки"
          value={incorrect}
        />
        <Stat
          icon={<Flame className="h-3.5 w-3.5 text-orange-500" />}
          label="Серия"
          value={streak}
        />
        <Stat
          icon={<Timer className="h-3.5 w-3.5 text-brand-500" />}
          label="Таймер"
          value={
            remaining === null
              ? '∞'
              : remaining <= 0
                ? '0.0'
                : remaining.toFixed(1)
          }
          highlight={remaining !== null && remaining < 3}
        />
      </div>

      {/* Таймер-бар */}
      {remaining !== null && (
        <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-[width] duration-75 ${
              progress < 0.25
                ? 'bg-red-500'
                : progress < 0.5
                  ? 'bg-amber-500'
                  : 'bg-brand-500'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: ReactNode
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-2 py-2 text-center ${
        highlight
          ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <div className="mb-0.5 flex items-center justify-center gap-1 opacity-70">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <div
        className={`text-lg font-bold tabular-nums ${
          highlight
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
