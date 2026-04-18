'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

interface SearchOptions<T> {
  data: T[]
  searchFields: (keyof T)[]
  threshold?: number // 0-1, similarity threshold for fuzzy search
  debounceMs?: number
}

interface SearchResult<T> {
  item: T
  score: number
  matches: string[]
}

// Fuzzy search algorithm
function fuzzyMatch(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  
  if (t.includes(q)) return 1
  if (t.startsWith(q)) return 0.9
  
  // Levenshtein-based fuzzy
  let score = 0
  let qIndex = 0
  for (let i = 0; i < t.length && qIndex < q.length; i++) {
    if (t[i] === q[qIndex]) {
      score++
      qIndex++
    }
  }
  return qIndex === q.length ? score / q.length : 0
}

// Debounced search hook
export function useSearch<T>(options: SearchOptions<T>) {
  const { data, searchFields, threshold = 0.3, debounceMs = 200 } = options
  
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResult<T>[]>([])
  
  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs])
  
  // Search
  useEffect(() => {
    if (!debouncedQuery) {
      setResults(data.map(item => ({ item, score: 1, matches: [] })))
      return
    }
    
    const searchResults: SearchResult<T>[] = []
    
    for (const item of data) {
      let bestScore = 0
      const matches: string[] = []
      
      for (const field of searchFields) {
        const value = item[field]
        if (typeof value === 'string') {
          const score = fuzzyMatch(value, debouncedQuery)
          if (score >= threshold) {
            bestScore = Math.max(bestScore, score)
            matches.push(field as string)
          }
        }
      }
      
      if (bestScore >= threshold) {
        searchResults.push({ item, score: bestScore, matches })
      }
    }
    
    // Sort by score
    searchResults.sort((a, b) => b.score - a.score)
    setResults(searchResults)
  }, [debouncedQuery, data, searchFields, threshold])
  
  return { query, setQuery, results }
}

// Auto-complete hook with keyboard navigation
export function useAutocomplete<T>(options: SearchOptions<T> & { onSelect?: (item: T) => void }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const { results } = useSearch({ ...options, query })
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          options.onSelect?.(results[selectedIndex].item)
          setQuery('')
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }, [isOpen, results, selectedIndex, options])
  
  useEffect(() => {
    if (query) setIsOpen(true)
    else setIsOpen(false)
    setSelectedIndex(-1)
  }, [query])
  
  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    selectedIndex,
    results: results.slice(0, 10), // Limit to 10
    handleKeyDown,
  }
}

// Filter hook with presets
export function useFilter<T>(data: T[], filterPresets?: Record<string, (item: T) => boolean>) {
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({})
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({})
  
  const filteredData = useMemo(() => {
    let result = data
    
    // Apply preset filters
    for (const [key, isActive] of Object.entries(activeFilters)) {
      if (isActive && filterPresets?.[key]) {
        result = result.filter(filterPresets[key])
      }
    }
    
    // Apply custom filters
    for (const [key, value] of Object.entries(customFilters)) {
      if (value) {
        result = result.filter(item => {
          const val = (item as any)[key]
          if (typeof val === 'string') return val.toLowerCase().includes(value.toLowerCase())
          return String(val).includes(value)
        })
      }
    }
    
    return result
  }, [data, activeFilters, customFilters, filterPresets])
  
  const toggleFilter = (key: string) => setActiveFilters(f => ({ ...f, [key]: !f[key] }))
  const setFilter = (key: string, value: string) => setCustomFilters(f => ({ ...f, [key]: value }))
  const clearFilters = () => { setActiveFilters({}); setCustomFilters({}) }
  
  return { filteredData, activeFilters, customFilters, toggleFilter, setFilter, clearFilters, hasFilters: Object.values(activeFilters).some(Boolean) || Object.values(customFilters).some(Boolean) }
}