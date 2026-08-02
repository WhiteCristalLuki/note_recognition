import { useState, type ReactNode } from 'react'
import {
  Play,
  Settings2,
  BarChart3,
  BookOpen,
  PenLine,
  Shuffle,
  Trophy,
} from 'lucide-react'
import {
  configFromLevel,
  DEFAULT_LEVEL_ID,
  getLevel,
  LEVELS,
  modeLabel,
} from '../../lib/levels'
import { CUSTOM_SESSION_CONFIG } from '../../lib/presets'
import { useSettingsStore } from '../../stores/settingsStore'
import { useStatsStore } from '../../stores/statsStore'
import { useProgressStore } from '../../stores/progressStore'
import { useGameStore } from '../../stores/gameStore'
import { initAudio } from '../../lib/audio'
import { CustomSettings } from './CustomSettings'
import { LevelSelect } from './LevelSelect'
import type { LevelDef } from '../../lib/levels'

export function HomeScreen() {
  const sessionConfig = useSettingsStore((s) => s.sessionConfig)
  const setSessionConfig = useSettingsStore((s) => s.setSessionConfig)
  const patchSessionConfig = useSettingsStore((s) => s.patchSessionConfig)
  const startSession = useGameStore((s) => s.startSession)

  const selectedLevelId = useProgressStore((s) => s.selectedLevelId)
  const setSelectedLevelId = useProgressStore((s) => s.setSelectedLevelId)
  const setSelectedPart = useProgressStore((s) => s.setSelectedPart)
  const completedCount = useProgressStore((s) => s.completedCount)
  const isCompleted = useProgressStore((s) => s.isCompleted)

  const totalSessions = useStatsStore((s) => s.totalSessions)
  const totalNotes = useStatsStore((s) => s.totalNotes)
  const totalCorrect = useStatsStore((s) => s.totalCorrect)
  const bestStreak = useStatsStore((s) => s.bestStreak)
  const bestAccuracy = useStatsStore((s) => s.bestAccuracy)

  const [showCustom, setShowCustom] = useState(
    sessionConfig.difficultyId === 'custom',
  )
  const [showStats, setShowStats] = useState(false)

  const activeLevel =
    !showCustom && sessionConfig.levelId
      ? getLevel(sessionConfig.levelId)
      : getLevel(selectedLevelId)

  const selectLevel = (level: LevelDef) => {
    setShowCustom(false)
    setSelectedLevelId(level.id)
    setSelectedPart(level.part)
    setSessionConfig(configFromLevel(level))
  }

  const openCustom = () => {
    setShowCustom(true)
    setSessionConfig({ ...CUSTOM_SESSION_CONFIG })
  }

  const start = async () => {
    await initAudio()
    if (showCustom) {
      startSession({ ...sessionConfig, difficultyId: 'custom', levelId: null })
      return
    }
    const level = getLevel(selectedLevelId) ?? getLevel(DEFAULT_LEVEL_ID)!
    const cfg = configFromLevel(level)
    setSessionConfig(cfg)
    startSession(cfg)
  }

  const lifetimeAccuracy =
    totalNotes === 0 ? 0 : Math.round((totalCorrect / totalNotes) * 100)

  const progressPct = Math.round((completedCount() / LEVELS.length) * 100)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-500 p-6 text-white shadow-xl shadow-brand-500/25 sm:p-8">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          Распознавание нот
        </h2>
        <p className="mt-2 max-w-md text-sm text-brand-100 sm:text-base">
          Система уровней: октава → чтение, запись, смешанный; затем
          комбинирование. Финалы частей — 50 нот без ошибок.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <Badge icon={<BookOpen className="h-3.5 w-3.5" />} text="Чтение" />
          <Badge icon={<PenLine className="h-3.5 w-3.5" />} text="Запись" />
          <Badge icon={<Shuffle className="h-3.5 w-3.5" />} text="Смешанный" />
        </div>

        {/* Общий прогресс */}
        <div className="mt-5 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-brand-100">
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              Прогресс
            </span>
            <span>
              {completedCount()} / {LEVELS.length} · {progressPct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Уровни
          </h3>
          <button
            type="button"
            onClick={() => setShowStats((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Статистика
          </button>
        </div>

        {showStats && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900">
            <MiniStat label="Сессий" value={totalSessions} />
            <MiniStat label="Нот" value={totalNotes} />
            <MiniStat label="Точность" value={`${lifetimeAccuracy}%`} />
            <MiniStat label="Лучшая серия" value={Math.max(bestStreak, 0)} />
            {bestAccuracy > 0 && (
              <p className="col-span-full text-center text-xs text-slate-400">
                Лучшая точность сессии: {Math.round(bestAccuracy * 100)}%
              </p>
            )}
          </div>
        )}

        {!showCustom && (
          <LevelSelect
            selectedLevelId={selectedLevelId}
            onSelect={selectLevel}
          />
        )}
      </section>

      {/* Custom (свёрнуто) */}
      <section>
        <button
          type="button"
          onClick={() => {
            if (showCustom) {
              setShowCustom(false)
              const level = getLevel(selectedLevelId) ?? getLevel(DEFAULT_LEVEL_ID)!
              setSessionConfig(configFromLevel(level))
            } else {
              openCustom()
            }
          }}
          className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition ${
            showCustom
              ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/40'
              : 'border-dashed border-slate-300 bg-white hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900'
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Settings2 className="h-4 w-4 text-brand-500" />
            Свободный режим (Custom)
          </span>
          <span className="text-xs text-slate-400">
            {showCustom ? 'Скрыть' : 'Открыть'}
          </span>
        </button>

        {showCustom && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50 sm:p-5">
            <CustomSettings
              config={sessionConfig}
              onChange={(patch) =>
                patchSessionConfig({
                  ...patch,
                  difficultyId: 'custom',
                  levelId: null,
                })
              }
            />
          </div>
        )}
      </section>

      {/* Резюме выбора */}
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/50 px-4 py-3 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
        {showCustom ? (
          <p>
            <strong className="text-slate-700 dark:text-slate-200">Custom</strong>
            {' · '}
            {modeLabel(sessionConfig.mode)}
            {' · '}
            {sessionConfig.noteCount === 0
              ? '∞ нот'
              : `${sessionConfig.noteCount} нот`}
          </p>
        ) : activeLevel ? (
          <p>
            <strong className="text-slate-700 dark:text-slate-200">
              Уровень {activeLevel.id}
            </strong>
            {' · '}
            {activeLevel.rangeLabel}
            {' · '}
            {modeLabel(activeLevel.mode)}
            {' · '}
            {activeLevel.noteCount} нот
            {isCompleted(activeLevel.id) ? ' · ✓ пройден' : ' · не пройден'}
          </p>
        ) : (
          <p>Выберите уровень</p>
        )}
      </section>

      {/* Start */}
      <button
        type="button"
        onClick={() => void start()}
        className="group sticky bottom-4 z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500 active:scale-[0.98] dark:shadow-brand-900/40"
      >
        <Play className="h-5 w-5 transition group-hover:scale-110" />
        {showCustom
          ? 'Начать тренировку'
          : `Начать уровень ${selectedLevelId}`}
      </button>
    </div>
  )
}

function Badge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
      {icon}
      {text}
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  )
}
