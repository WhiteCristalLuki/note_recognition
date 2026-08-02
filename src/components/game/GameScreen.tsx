import { useCallback, useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useRoundTimer } from '../../hooks/useRoundTimer'
import { playCorrect, playWrong, initAudio } from '../../lib/audio'
import { getLevel, modeLabel } from '../../lib/levels'
import type { NotePitch } from '../../types'
import { NoteStaff } from '../staff/NoteStaff'
import { AnswerButtons } from './AnswerButtons'
import { WritingStaff } from './WritingStaff'
import { GameHUD } from './GameHUD'

export function GameScreen() {
  const config = useGameStore((s) => s.config)
  const round = useGameStore((s) => s.round)
  const noteIndex = useGameStore((s) => s.noteIndex)
  const results = useGameStore((s) => s.results)
  const streak = useGameStore((s) => s.streak)
  const feedback = useGameStore((s) => s.feedback)
  const locked = useGameStore((s) => s.locked)
  const revealedAnswer = useGameStore((s) => s.revealedAnswer)
  const submitAnswer = useGameStore((s) => s.submitAnswer)
  const nextRound = useGameStore((s) => s.nextRound)
  const endSession = useGameStore((s) => s.endSession)

  const soundEnabled = useSettingsStore((s) => s.soundEnabled)

  const [selectedMidi, setSelectedMidi] = useState<number | null>(null)
  const [selectedNote, setSelectedNote] = useState<NotePitch | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const advanceTimer = useRef<number | null>(null)

  const correct = results.filter((r) => r.correct).length
  const incorrect = results.length - correct

  useEffect(() => {
    void initAudio()
  }, [])

  // Сброс выбора при новом раунде
  useEffect(() => {
    setSelectedMidi(null)
    setSelectedNote(null)
    setSelectedLabel(null)
  }, [round?.startedAt, noteIndex])

  const clearAdvance = () => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
  }

  const scheduleNext = useCallback(() => {
    clearAdvance()
    // Чуть дольше пауза при ошибке в записи — чтобы увидеть красную + чёрную ноту
    const delay =
      config.intervalMs +
      (useGameStore.getState().feedback === 'wrong' ||
      useGameStore.getState().feedback === 'timeout'
        ? 400
        : 0)
    advanceTimer.current = window.setTimeout(() => {
      setSelectedMidi(null)
      setSelectedNote(null)
      setSelectedLabel(null)
      nextRound()
    }, delay)
  }, [config.intervalMs, nextRound])

  useEffect(() => () => clearAdvance(), [])

  const handleAnswer = useCallback(
    async (answer: NotePitch | null, timedOut = false) => {
      if (locked || !round) return

      if (answer) {
        setSelectedMidi(answer.midi)
        setSelectedNote(answer)
        setSelectedLabel(answer.name)
      }

      const result = submitAnswer(answer, timedOut)
      if (!result) return

      if (result.correct) {
        await playCorrect(result.target.midi, soundEnabled)
      } else {
        await playWrong(result.target.midi, soundEnabled)
      }

      scheduleNext()
    },
    [locked, round, submitAnswer, soundEnabled, scheduleNext],
  )

  const onTimeout = useCallback(() => {
    void handleAnswer(null, true)
  }, [handleAnswer])

  const roundKey = round
    ? `${round.target.midi}-${round.startedAt}-${noteIndex}`
    : 0

  const { remaining, progress } = useRoundTimer(
    config.timeLimitSec,
    roundKey,
    !!round && !locked,
    onTimeout,
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearAdvance()
        endSession()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [endSession])

  if (!round) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
        Загрузка…
      </div>
    )
  }

  const isReading = round.mode === 'reading'
  const showGrand = config.clef === 'both'
  const level = config.levelId ? getLevel(config.levelId) : undefined

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4 sm:py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {level
              ? `Уровень ${level.id}`
              : isReading
                ? 'Чтение'
                : 'Запись'}
            {' · '}
            {isReading ? 'Чтение' : 'Запись'}
            {config.clef === 'both'
              ? ' · Оба ключа'
              : config.clef === 'bass'
                ? ' · Басовый'
                : ' · Скрипичный'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {level
              ? `${level.rangeLabel} · ${modeLabel(level.mode)}`
              : isReading
                ? 'Выберите название ноты'
                : 'Укажите позицию ноты на стане'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearAdvance()
            endSession()
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Завершить
        </button>
      </div>

      <GameHUD
        noteIndex={noteIndex}
        noteCount={config.noteCount}
        correct={correct}
        incorrect={incorrect}
        streak={streak}
        remaining={remaining}
        progress={progress}
      />

      {/* Основная зона */}
      <div className="animate-[slide-up_0.35s_ease-out]">
        {isReading ? (
          <NoteStaff
            note={round.target}
            clef={round.displayClef}
            grand={showGrand}
            feedback={feedback}
          />
        ) : (
          <div className="space-y-4">
            {/* Задание: название ноты */}
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-950 ${
                feedback === 'correct'
                  ? 'ring-2 ring-green-500/50'
                  : feedback === 'wrong' || feedback === 'timeout'
                    ? 'ring-2 ring-red-500/50'
                    : ''
              }`}
            >
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Поставьте на стан
              </p>
              <p
                className={`text-4xl font-black tracking-tight sm:text-5xl ${
                  feedback === 'correct'
                    ? 'text-green-500'
                    : feedback === 'wrong' || feedback === 'timeout'
                      ? 'text-red-500'
                      : 'text-slate-900 dark:text-white'
                }`}
              >
                {round.target.name}
              </p>
            </div>

            {/* Интерактивный стан */}
            <WritingStaff
              clef={round.displayClef}
              target={round.target}
              disabled={locked}
              feedback={feedback}
              selected={selectedNote}
              onSelect={(n) => void handleAnswer(n)}
            />
          </div>
        )}
      </div>

      {/* Обратная связь */}
      {feedback !== 'idle' && (
        <div
          className={`animate-[pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)] rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
            feedback === 'correct'
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {feedback === 'correct' && 'Верно!'}
          {feedback === 'wrong' &&
            (selectedLabel &&
            revealedAnswer &&
            selectedLabel !== revealedAnswer.name
              ? `Неверно — вы поставили ${selectedLabel}, правильно: ${revealedAnswer.name}`
              : `Неверно — правильный ответ: ${revealedAnswer?.name ?? ''}`)}
          {feedback === 'timeout' &&
            `Время вышло — правильный ответ: ${revealedAnswer?.name ?? ''}`}
        </div>
      )}

      {/* Кнопки только в режиме чтения */}
      {isReading && (
        <div className="mt-auto pb-2">
          <p className="mb-2 text-center text-xs text-slate-400 dark:text-slate-500">
            Выберите ноту с верной октавой · Esc — завершить
          </p>
          <AnswerButtons
            options={round.options}
            disabled={locked}
            correctMidi={feedback !== 'idle' ? round.target.midi : null}
            selectedMidi={selectedMidi}
            onSelect={(n) => void handleAnswer(n)}
          />
        </div>
      )}

      {!isReading && (
        <p className="pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
          Наведите на стан и кликните, чтобы поставить ноту · учитывается только
          высота · Esc — завершить
        </p>
      )}
    </div>
  )
}
