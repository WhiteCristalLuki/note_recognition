import { useEffect } from 'react'

/**
 * Клавиши 1–7 (и numpad) вызывают onSelect(index).
 * Escape — onEscape.
 */
export function useKeyboardAnswers(
  enabled: boolean,
  onSelect: (index: number) => void,
  onEscape?: () => void,
): void {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        onEscape?.()
        return
      }

      let idx = -1
      if (e.key >= '1' && e.key <= '7') {
        idx = Number(e.key) - 1
      } else if (e.code.startsWith('Numpad')) {
        const n = e.code.replace('Numpad', '')
        if (n >= '1' && n <= '7') idx = Number(n) - 1
      }

      if (idx >= 0) {
        e.preventDefault()
        onSelect(idx)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, onSelect, onEscape])
}
