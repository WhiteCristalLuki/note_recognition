import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionConfig, ThemeMode } from '../types'
import { DEFAULT_SESSION_CONFIG } from '../lib/presets'

interface SettingsState {
  theme: ThemeMode
  soundEnabled: boolean
  /** Последний выбранный / custom-конфиг */
  sessionConfig: SessionConfig
  setTheme: (theme: ThemeMode) => void
  setSoundEnabled: (enabled: boolean) => void
  setSessionConfig: (config: SessionConfig) => void
  patchSessionConfig: (patch: Partial<SessionConfig>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      soundEnabled: true,
      sessionConfig: DEFAULT_SESSION_CONFIG,

      setTheme: (theme) => set({ theme }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setSessionConfig: (sessionConfig) => set({ sessionConfig }),
      patchSessionConfig: (patch) =>
        set((s) => ({ sessionConfig: { ...s.sessionConfig, ...patch } })),
    }),
    {
      name: 'note-trainer-settings',
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined
        if (!p) return current
        const cfg = p.sessionConfig
        // Миграция со старых preset-id на систему уровней
        if (
          cfg &&
          cfg.difficultyId !== 'level' &&
          cfg.difficultyId !== 'custom'
        ) {
          return {
            ...current,
            ...p,
            sessionConfig: DEFAULT_SESSION_CONFIG,
          }
        }
        return { ...current, ...p, sessionConfig: cfg ?? current.sessionConfig }
      },
    },
  ),
)
