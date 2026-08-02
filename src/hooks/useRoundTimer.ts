import { useEffect, useRef, useState } from 'react'

/**
 * Таймер раунда: считает оставшиеся секунды.
 * timeLimitSec = 0 → таймер выключен.
 */
export function useRoundTimer(
  timeLimitSec: number,
  roundKey: string | number,
  active: boolean,
  onTimeout: () => void,
): { remaining: number | null; progress: number } {
  const [remaining, setRemaining] = useState<number | null>(
    timeLimitSec > 0 ? timeLimitSec : null,
  )
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!active || timeLimitSec <= 0) {
      setRemaining(timeLimitSec > 0 ? timeLimitSec : null)
      return
    }

    setRemaining(timeLimitSec)
    const started = Date.now()
    const totalMs = timeLimitSec * 1000

    const id = window.setInterval(() => {
      const left = Math.max(0, totalMs - (Date.now() - started))
      const sec = left / 1000
      setRemaining(sec)
      if (left <= 0) {
        window.clearInterval(id)
        onTimeoutRef.current()
      }
    }, 50)

    return () => window.clearInterval(id)
  }, [timeLimitSec, roundKey, active])

  const progress =
    timeLimitSec > 0 && remaining !== null
      ? Math.max(0, Math.min(1, remaining / timeLimitSec))
      : 1

  return { remaining, progress }
}
