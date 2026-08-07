import { useEffect, useState } from 'react'

/**
 * true на телефонах/планшетах (грубый указатель / без hover).
 * На ПК с мышью — false. На гибридах смотрим media query;
 * фактическое поведение клика лучше брать из event.pointerType.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => readCoarse())

  useEffect(() => {
    const mqPointer = window.matchMedia('(pointer: coarse)')
    const mqHover = window.matchMedia('(hover: none)')

    const update = () => setCoarse(readCoarse())
    mqPointer.addEventListener('change', update)
    mqHover.addEventListener('change', update)
    return () => {
      mqPointer.removeEventListener('change', update)
      mqHover.removeEventListener('change', update)
    }
  }, [])

  return coarse
}

function readCoarse(): boolean {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const noHover = window.matchMedia('(hover: none)').matches
  return coarse || (noHover && navigator.maxTouchPoints > 0)
}

/** Нужно ли подтверждение для данного pointer-события */
export function needsWriteConfirm(pointerType: string): boolean {
  // touch и pen — двухшаговый выбор; mouse — сразу ответ
  return pointerType === 'touch' || pointerType === 'pen'
}
