/** Ленивая загрузка Tone.js — уменьшает initial bundle */

type PolySynth = import('tone').PolySynth
type ToneModule = typeof import('tone')

let Tone: ToneModule | null = null
let synth: PolySynth | null = null
let ready = false

async function loadTone(): Promise<ToneModule> {
  if (!Tone) {
    Tone = await import('tone')
  }
  return Tone
}

/** Инициализация аудио-контекста (нужен жест пользователя) */
export async function initAudio(): Promise<void> {
  const T = await loadTone()
  await T.start()
  if (!synth) {
    // Простой «фортепианный» синтезатор
    synth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 0.4,
        sustain: 0.25,
        release: 0.9,
      },
      volume: -6,
    }).toDestination()
  }
  ready = true
}

export function isAudioReady(): boolean {
  return ready
}

/** Воспроизвести ноту по MIDI */
export async function playMidi(
  midi: number,
  duration = '0.5',
  enabled = true,
): Promise<void> {
  if (!enabled) return
  try {
    if (!ready) await initAudio()
    if (!synth || !Tone) return
    const freq = Tone.Frequency(midi, 'midi').toFrequency()
    synth.triggerAttackRelease(freq, duration)
  } catch {
    // Игнорируем ошибки автоплея / контекста
  }
}

/** Звук правильного ответа */
export async function playCorrect(
  midi: number,
  enabled = true,
): Promise<void> {
  if (!enabled) return
  await playMidi(midi, '0.45', true)
}

/** Звук ошибки */
export async function playWrong(midi: number, enabled = true): Promise<void> {
  if (!enabled) return
  await playMidi(midi, '0.35', true)
}

export function disposeAudio(): void {
  synth?.dispose()
  synth = null
  ready = false
}
