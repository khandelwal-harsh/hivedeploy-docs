import { useSyncExternalStore } from 'react'

let open = false
const listeners = new Set<() => void>()
function set(v: boolean) {
  if (open === v) return
  open = v
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export const openSearch = () => set(true)
export const closeSearch = () => set(false)
export const toggleSearch = () => set(!open)
export const useSearchOpen = (): boolean => useSyncExternalStore(subscribe, () => open, () => false)
