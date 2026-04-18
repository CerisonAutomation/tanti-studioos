// Supabase client for Tanti StudioOS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Server-side admin client
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Storage helpers
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  return data
}

export const getFileUrl = (bucket: string, path: string) => {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

// Realtime subscription
export const subscribeToTable = (table: string, callback: (payload: any) => void) => {
  return supabase.channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()
}

// Presence for collaborative features
export const subscribeToPresence = (channel: string, userInfo: Record<string, any>) => {
  const ch = supabase.channel(channel)
  ch.on('presence', { event: 'sync' }, () => {
    console.log('Presence state:', ch.presenceState())
  }).subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await ch.track(userInfo)
    }
  })
  return ch
}