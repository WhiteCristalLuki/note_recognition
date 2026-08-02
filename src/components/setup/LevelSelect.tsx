import {
  BookOpen,
  Check,
  Crown,
  Music2,
  PenLine,
  Shuffle,
} from 'lucide-react'
import type { GameMode } from '../../types'
import {
  getLevelsByPart,
  LEVEL_PARTS,
  modeLabel,
  type LevelDef,
} from '../../lib/levels'
import { useProgressStore } from '../../stores/progressStore'

interface LevelSelectProps {
  selectedLevelId: string
  onSelect: (level: LevelDef) => void
}

const MODE_ICON: Record<GameMode, typeof BookOpen> = {
  reading: BookOpen,
  writing: PenLine,
  mixed: Shuffle,
}

export function LevelSelect({ selectedLevelId, onSelect }: LevelSelectProps) {
  const selectedPart = useProgressStore((s) => s.selectedPart)
  const setSelectedPart = useProgressStore((s) => s.setSelectedPart)
  const isCompleted = useProgressStore((s) => s.isCompleted)
  const completedInPart = useProgressStore((s) => s.completedInPart)

  const levels = getLevelsByPart(selectedPart)

  return (
    <div className="space-y-4">
      {/* Вкладки частей */}
      <div className="grid grid-cols-3 gap-2">
        {LEVEL_PARTS.map((part) => {
          const done = completedInPart(part.id)
          const total = getLevelsByPart(part.id).length
          const active = selectedPart === part.id
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => setSelectedPart(part.id)}
              className={`rounded-2xl border-2 px-2 py-3 text-left transition sm:px-3 ${
                active
                  ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10 dark:border-brand-400 dark:bg-brand-950/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
              }`}
            >
              <p
                className={`text-xs font-bold sm:text-sm ${
                  active
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {part.id}. {part.title}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                {done}/{total} пройдено
              </p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {LEVEL_PARTS.find((p) => p.id === selectedPart)?.subtitle}. Все уровни
        доступны. Пройденный — 100% верных ответов за попытку.
      </p>

      {/* Список уровней */}
      <div className="space-y-2">
        {levels.map((level) => {
          const completed = isCompleted(level.id)
          const selected = selectedLevelId === level.id
          const ModeIcon = MODE_ICON[level.mode]

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onSelect(level)}
              className={`group flex w-full items-stretch gap-3 rounded-2xl border-2 p-3 text-left transition sm:p-3.5 ${
                selected
                  ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10 dark:border-brand-400 dark:bg-brand-950/50'
                  : completed
                    ? 'border-green-300/80 bg-green-50/80 hover:border-green-400 dark:border-green-800 dark:bg-green-950/30 dark:hover:border-green-700'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
              }`}
            >
              {/* Статус */}
              <div
                className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                  completed
                    ? 'bg-green-500 text-white'
                    : selected
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {completed ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : level.isFinale ? (
                  <Crown className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-black">{level.id}</span>
                )}
                {completed && (
                  <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">
                    OK
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={`text-sm font-bold ${
                      selected
                        ? 'text-brand-800 dark:text-brand-200'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    Уровень {level.id}
                  </span>
                  {level.isFinale && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Финал · {level.noteCount} нот
                    </span>
                  )}
                  {completed && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800 dark:bg-green-950 dark:text-green-300">
                      Пройден
                    </span>
                  )}
                  {!completed && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Не пройден
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {level.rangeLabel}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <ModeIcon className="h-3.5 w-3.5" />
                    {modeLabel(level.mode)}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Music2 className="h-3.5 w-3.5" />
                    {level.noteCount} нот
                  </span>
                  {level.hint && (
                    <>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden text-slate-400 sm:inline">
                        {level.hint}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
