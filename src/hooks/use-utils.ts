'use client'

import { useState, useEffect, useCallback } from 'react'

// Keyboard shortcuts hook
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = options?.ctrl ?? true
      const shift = options?.shift ?? false
      const alt = options?.alt ?? false
      const meta = options?.meta ?? false

      const key = e.key.toLowerCase()
      const matches = keys.map(k => k.toLowerCase()).includes(key)
      const modifiersMatch = 
        (ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey) &&
        (shift ? e.shiftKey : !e.shiftKey) &&
        (alt ? e.altKey : !e.altKey) &&
        (meta ? e.metaKey : true)

      if (matches && modifiersMatch) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keys, callback, options])
}

// Click outside detector
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

// Local storage hook with SSR support
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) setStoredValue(JSON.parse(item))
    } catch { }
    setLoaded(true)
  }, [key])

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch { }
  }, [key, storedValue])

  return [storedValue, setValue, loaded] as const
}

// Debounce value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handle = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handle)
    window.addEventListener('offline', handle)
    return () => {
      window.removeEventListener('online', handle)
      window.removeEventListener('offline', handle)
    }
  }, [])

  return isOnline
}

// Intersection observer for lazy loading
export function useIntersection(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, options])

  return isIntersecting
}

// Previous value
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => { ref.current = value })
  return ref.current
}