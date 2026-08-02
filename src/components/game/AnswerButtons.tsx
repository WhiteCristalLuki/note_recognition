import type { NotePitch } from '../../types'
import { groupByOctave } from '../../lib/notes'

interface AnswerButtonsProps {
  options: NotePitch[]
  disabled?: boolean
  correctMidi?: number | null
  selectedMidi?: number | null
  onSelect: (note: NotePitch) => void
}

/**
 * Кнопки названий нот (До / Ре / … + октава).
 * Раскладка: каждая октава — отдельная строка.
 * Сравнение ответа — строго по MIDI (До4 ≠ До5).
 */
export function AnswerButtons({
  options,
  disabled = false,
  correctMidi = null,
  selectedMidi = null,
  onSelect,
}: AnswerButtonsProps) {
  const rows = groupByOctave(options)

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {rows.map(({ octave, notes }) => (
        <div key={octave} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex shrink-0 items-center gap-1.5 sm:w-16">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              окт. {octave}
            </span>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1.5 xs:grid-cols-5 sm:grid-cols-7 sm:gap-2">
            {notes.map((note) => {
              const isSelected = selectedMidi === note.midi
              const isCorrect = correctMidi === note.midi
              const showResult = correctMidi !== null

              let color =
                'bg-white border-slate-200 text-slate-800 hover:border-brand-400 hover:bg-brand-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:border-brand-400 dark:hover:bg-slate-700'

              if (showResult && isCorrect) {
                color =
                  'bg-green-500 border-green-600 text-white shadow-md shadow-green-500/25'
              } else if (showResult && isSelected && !isCorrect) {
                color =
                  'bg-red-500 border-red-600 text-white shadow-md shadow-red-500/25'
              } else if (showResult) {
                color =
                  'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500'
              }

              return (
                <button
                  key={note.midi}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(note)}
                  title={`${note.name} (MIDI ${note.midi})`}
                  className={`relative flex min-h-11 items-center justify-center rounded-xl border-2 px-1 py-2 text-center text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed sm:min-h-12 sm:text-[15px] ${color}`}
                >
                  {note.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
