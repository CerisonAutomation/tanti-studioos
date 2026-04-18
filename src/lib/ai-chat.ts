// AI Chat with Supabase storage
import { complete } from './openrouter'
import { createClient } from '@supabase/ssr'

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

// Save chat to Supabase
export async function saveChat(userId: string, conversation: ChatConversation) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await supabase
    .from('ai_conversations')
    .upsert({
      id: conversation.id,
      user_id: userId,
      title: conversation.title,
      messages: conversation.messages,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select()
    
  if (error) throw error
  return data
}

// Get user's chat history
export async function getChatHistory(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    
  if (error) throw error
  return data as ChatConversation[]
}

// Stream AI response with context from Supabase
export async function chatWithContext(userId: string, message: string, conversationId?: string) {
  let context = ''
  
  // Get recent conversations for context
  if (userId) {
    const history = await getChatHistory(userId)
    if (history.length > 0) {
      const lastConversation = history[0]
      context = `Previous conversation: ${lastConversation.messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
    }
  }
  
  // Add interior design system prompt
  const systemPrompt = `You are Tanti StudioOS AI, a luxury interior design assistant for Tanti Interiors in Malta.
Your role: Help clients with design concepts, color palettes, material selections, furniture recommendations.
Tone: Professional, elegant, knowledgeable about Mediterranean/Maltese design.
When relevant, suggest specific materials, hex color codes, and spatial considerations.`

  const response = await complete(`${systemPrompt}\n\n${context}User: ${message}`)
  return response
}