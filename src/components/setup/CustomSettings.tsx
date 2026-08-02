import type { ReactNode } from 'react'
import type { ClefType, GameMode, SessionConfig } from '../../types'
import { fromMidi } from '../../lib/notes'

interface CustomSettingsProps {
  config: SessionConfig
  onChange: (patch: Partial<SessionConfig>) => void
}

const modes: { id: GameMode; label: string; desc: string }[] = [
  { id: 'reading', label: 'Reading', desc: 'Нота → название' },
  { id: 'writing', label: 'Writing', desc: 'Название → позиция' },
  { id: 'mixed', label: 'Mixed', desc: 'Случайное чередование' },
]

const clefs: { id: ClefType; label: string }[] = [
  { id: 'treble', label: 'Скрипичный' },
  { id: 'bass', label: 'Басовый' },
  { id: 'both', label: 'Оба ключа' },
]

export function CustomSettings({ config, onChange }: CustomSettingsProps) {
  const minName = fromMidi(config.minMidi).name
  const maxName = fromMidi(config.maxMidi).name

  return (
    <div className="space-y-5 animate-[slide-up_0.3s_ease-out]">
      {/* Режим */}
      <Field label="Режим">
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <Chip
              key={m.id}
              active={config.mode === m.id}
              onClick={() => onChange({ mode: m.id })}
              title={m.desc}
            >
              {m.label}
            </Chip>
          ))}
        </div>
      </Field>

      {/* Ключ */}
      <Field label="Ключ">
        <div className="grid grid-cols-3 gap-2">
          {clefs.map((c) => (
            <Chip
              key={c.id}
              active={config.clef === c.id}
              onClick={() => onChange({ clef: c.id })}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </Field>

      {/* Диапазон */}
      <Field
        label="Диапазон нот"
        hint={`${minName} – ${maxName} (MIDI ${config.minMidi}–${config.maxMidi})`}
      >
        <div className="space-y-3">
          <RangeRow
            label="Мин."
            value={config.minMidi}
            min={21}
            max={config.maxMidi}
            onChange={(minMidi) => onChange({ minMidi })}
          />
          <RangeRow
            label="Макс."
            value={config.maxMidi}
            min={config.minMidi}
            max={108}
            onChange={(maxMidi) => onChange({ maxMidi })}
          />
        </div>
      </Field>

      {/* Кол-во нот */}
      <Field
        label="Ноты в сессии"
        hint={config.noteCount === 0 ? 'Без ограничения' : `${config.noteCount} нот`}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={config.noteCount}
          onChange={(e) => onChange({ noteCount: Number(e.target.value) })}
          className="w-full accent-brand-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>∞</span>
          <span>50</span>
          <span>100</span>
        </div>
      </Field>

      {/* Таймер */}
      <Field
        label="Время на ответ"
        hint={
          config.timeLimitSec === 0
            ? 'Без ограничения'
            : `${config.timeLimitSec} с`
        }
      >
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={config.timeLimitSec}
          onChange={(e) => onChange({ timeLimitSec: Number(e.target.value) })}
          className="w-full accent-brand-500"
        />
      </Field>

      {/* Интервал */}
      <Field
        label="Пауза между нотами"
        hint={`${(config.intervalMs / 1000).toFixed(1)} с`}
      >
        <input
          type="range"
          min={200}
          max={2000}
          step={100}
          value={config.intervalMs}
          onChange={(e) => onChange({ intervalMs: Number(e.target.value) })}
          className="w-full accent-brand-500"
        />
      </Field>

      {/* Accidentals */}
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            Диезы / бемоли
          </p>
          <p className="text-xs text-slate-500">
            Включать альтерированные ноты (♯/♭)
          </p>
        </div>
        <input
          type="checkbox"
          checked={config.includeAccidentals}
          onChange={(e) => onChange({ includeAccidentals: e.target.checked })}
          className="h-5 w-5 accent-brand-500"
        />
      </label>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {label}
        </label>
        {hint && (
          <span className="text-xs tabular-nums text-slate-400">{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-xl border-2 px-2 py-2.5 text-center text-sm font-semibold transition ${
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function RangeRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const name = fromMidi(value).name
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-xs font-medium text-slate-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-brand-500"
      />
      <span className="w-12 text-right text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
        {name}
      </span>
    </div>
  )
}
