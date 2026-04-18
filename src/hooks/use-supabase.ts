'use client'
import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '@/lib/supabase'

// Realtime list hook - auto-updates when DB changes
export function useRealtimeList<T>(table: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: result, error } = await supabase.from(table).select('*')
      if (error) setError(error)
      else setData(result as T[])
      setLoading(false)
    }
    fetchData()

    const channel = subscribeToTable(table, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      setData(prev => {
        switch (eventType) {
          case 'INSERT': return [...prev, newRecord as T]
          case 'UPDATE': return prev.map(i => (i as any).id === oldRecord.id ? newRecord as T : i)
          case 'DELETE': return prev.filter(i => (i as any).id !== oldRecord.id)
          default: return prev
        }
      })
    })

    return () => { supabase.removeChannel(channel) }
  }, [table])

  return { data, loading, error, setData }
}

// Auth hook
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// File upload hook with progress
export function useFileUpload(bucket: string) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [url, setUrl] = useState<string | null>(null)

  const upload = async (file: File, path: string) => {
    setUploading(true)
    setProgress(0)
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { 
        upsert: true,
        cacheControl: '3600'
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    setUrl(publicUrl)
    setProgress(100)
    setUploading(false)
    return publicUrl
  }

  return { upload, uploading, progress, url }
}

// Presence hook for real-time presence
export function usePresence(channelName: string, userInfo: Record<string, any>) {
  const [presence, setPresence] = useState<Record<string, any>>({})

  useEffect(() => {
    const channel = supabase.channel(channelName)
    channel
      .on('presence', { event: 'sync' }, () => setPresence(channel.presenceState()))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track(userInfo)
      })
    return () => { supabase.removeChannel(channel) }
  }, [channelName, userInfo])

  return presence
}