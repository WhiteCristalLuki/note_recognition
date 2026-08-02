import type { SessionConfig } from '../types'
import {
  configFromLevel,
  DEFAULT_LEVEL_ID,
  getLevel,
} from './levels'
import { MIDI_C4 } from './notes'

/** Конфиг по умолчанию — уровень 1.1 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = configFromLevel(
  getLevel(DEFAULT_LEVEL_ID)!,
)

/** Custom-режим (свободная настройка) */
export const CUSTOM_SESSION_CONFIG: SessionConfig = {
  mode: 'reading',
  clef: 'treble',
  minMidi: MIDI_C4,
  maxMidi: MIDI_C4 + 11,
  noteCount: 20,
  timeLimitSec: 0,
  intervalMs: 600,
  includeAccidentals: false,
  difficultyId: 'custom',
  levelId: null,
}
