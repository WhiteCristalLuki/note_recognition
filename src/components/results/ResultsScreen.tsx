import { useEffect, useRef, type ReactNode } from 'react'
import {
  Home,
  RotateCcw,
  Trophy,
  Clock,
  Target,
  Flame,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useStatsStore } from '../../stores/statsStore'
import {
  isPerfectClear,
  useProgressStore,
} from '../../stores/progressStore'
import {
  configFromLevel,
  getLevel,
  LEVELS,
  modeLabel,
} from '../../lib/levels'
import { initAudio } from '../../lib/audio'

export function ResultsScreen() {
  const summary = useGameStore((s) => s.lastSummary)
  const goHome = useGameStore((s) => s.goHome)
  const startSession = useGameStore((s) => s.startSession)
  const sessionConfig = useSettingsStore((s) => s.sessionConfig)
  const setSessionConfig = useSettingsStore((s) => s.setSessionConfig)
  const recordSession = useStatsStore((s) => s.recordSession)
  const markCompleted = useProgressStore((s) => s.markCompleted)
  const isCompleted = useProgressStore((s) => s.isCompleted)
  const setSelectedLevelId = useProgressStore((s) => s.setSelectedLevelId)
  const recordedRef = useRef<number | null>(null)

  const levelId = summary?.config.levelId ?? null
  const level = levelId ? getLevel(levelId) : undefined

  // Сохраняем статистику + прогресс уровня один раз
  useEffect(() => {
    if (!summary) return
    if (recordedRef.current === summary.finishedAt) return
    recordedRef.current = summary.finishedAt
    recordSession(summary)

    const id = summary.config.levelId
    if (
      id &&
      isPerfectClear(
        summary.correct,
        summary.incorrect,
        summary.config.noteCount,
        summary.results.length,
      )
    ) {
      markCompleted(id)
    }
  }, [summary, recordSession, markCompleted])

  if (!summary) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-slate-500">Нет данных сессии</p>
        <button
          type="button"
          onClick={goHome}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          В меню
        </button>
      </div>
    )
  }

  const accuracyPct = Math.round(summary.accuracy * 100)
  const avgSec = (summary.avgResponseMs / 1000).toFixed(2)
  const errorEntries = Object.entries(summary.errorsByNote).sort(
    (a, b) => b[1] - a[1],
  )

  const perfect = isPerfectClear(
    summary.correct,
    summary.incorrect,
    summary.config.noteCount,
    summary.results.length,
  )
  const justCompleted = Boolean(levelId && perfect)
  const alreadyWasCompleted = Boolean(
    levelId && isCompleted(levelId) && !perfect,
  )

  const restart = async () => {
    await initAudio()
    if (level) {
      const cfg = configFromLevel(level)
      setSessionConfig(cfg)
      startSession(cfg)
    } else {
      startSession(sessionConfig)
    }
  }

  const nextLevel = level
    ? getLevel(
        // следующий по каталогу
        findNextLevelId(level.id),
      )
    : undefined

  const startNext = async () => {
    if (!nextLevel) return
    await initAudio()
    setSelectedLevelId(nextLevel.id)
    const cfg = configFromLevel(nextLevel)
    setSessionConfig(cfg)
    startSession(cfg)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 animate-[fade-in_0.3s_ease-out]">
      {/* Hero result */}
      <section
        className={`rounded-3xl border p-6 text-center shadow-sm sm:p-8 ${
          perfect
            ? 'border-green-300 bg-gradient-to-b from-green-50 to-white dark:border-green-800 dark:from-green-950/50 dark:to-slate-900'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <div
          className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
            perfect
              ? 'bg-green-500 text-white'
              : 'bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
          }`}
        >
          {perfect ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : (
            <Trophy className="h-7 w-7" />
          )}
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {perfect ? 'Уровень пройден!' : 'Сессия завершена'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {level
            ? `Уровень ${level.id} · ${level.rangeLabel} · ${modeLabel(level.mode)}`
            : `${summary.results.length} нот · ${summary.config.mode}`}
        </p>
        {justCompleted && (
          <p className="mt-2 text-sm font-semibold text-green-700 dark:text-green-300">
            Все {summary.config.noteCount} нот верно — уровень отмечен как
            пройденный
          </p>
        )}
        {!perfect && level && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
            <XCircle className="h-4 w-4" />
            Для прохождения нужны все ответы верными
            {alreadyWasCompleted ? ' (уровень уже был пройден ранее)' : ''}
          </p>
        )}

        <p
          className={`mt-4 text-5xl font-black tabular-nums ${
            accuracyPct === 100
              ? 'text-green-500'
              : accuracyPct >= 80
                ? 'text-green-500'
                : accuracyPct >= 50
                  ? 'text-amber-500'
                  : 'text-red-500'
          }`}
        >
          {accuracyPct}%
        </p>
        <p className="text-sm text-slate-400">точность</p>
      </section>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card
          icon={<Target className="h-4 w-4 text-green-500" />}
          label="Верно"
          value={summary.correct}
        />
        <Card
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Ошибки"
          value={summary.incorrect}
        />
        <Card
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Макс. серия"
          value={summary.maxStreak}
        />
        <Card
          icon={<Clock className="h-4 w-4 text-brand-500" />}
          label="Ср. время"
          value={`${avgSec}с`}
        />
      </div>

      {/* Ошибки по нотам */}
      {errorEntries.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            Ошибки по нотам
          </h3>
          <ul className="space-y-2">
            {errorEntries.map(([note, count]) => {
              const max = errorEntries[0]?.[1] ?? 1
              return (
                <li key={note} className="flex items-center gap-3">
                  <span className="w-14 text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {note}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-red-400"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-slate-400">
                    {count}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {errorEntries.length === 0 && summary.results.length > 0 && (
        <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          Идеально — ни одной ошибки!
        </p>
      )}

      {/* История ответов */}
      {summary.results.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            Ответы
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {summary.results.map((r, i) => (
              <span
                key={i}
                title={`${r.target.name}${r.answer ? ` → ${r.answer.name}` : ' (таймаут)'} · ${(r.responseMs / 1000).toFixed(2)}с`}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-bold ${
                  r.correct
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {r.target.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="sticky bottom-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void restart()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500"
        >
          <RotateCcw className="h-4 w-4" />
          Ещё раз
        </button>
        {perfect && nextLevel && (
          <button
            type="button"
            onClick={() => void startNext()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-green-300 bg-green-50 px-6 py-3.5 text-sm font-bold text-green-800 transition hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-200 dark:hover:bg-green-900"
          >
            Уровень {nextLevel.id}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={goHome}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          В меню
        </button>
      </div>
    </div>
  )
}

function findNextLevelId(currentId: string): string {
  const idx = LEVELS.findIndex((l) => l.id === currentId)
  if (idx < 0 || idx >= LEVELS.length - 1) return currentId
  return LEVELS[idx + 1]!.id
}

function Card({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-center gap-1 opacity-80">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}
