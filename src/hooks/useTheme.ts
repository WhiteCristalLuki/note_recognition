import { useEffect, useMemo } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Применяет тему к <html> и возвращает, активна ли тёмная */
export function useTheme(): boolean {
  const theme = useSettingsStore((s) => s.theme)

  const isDark = useMemo(() => {
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return getSystemDark()
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const apply = (dark: boolean) => {
      root.classList.toggle('dark', dark)
      root.style.colorScheme = dark ? 'dark' : 'light'
    }

    if (theme === 'system') {
      apply(getSystemDark())
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    apply(theme === 'dark')
  }, [theme])

  return theme === 'system' ? getSystemDark() : isDark
}
