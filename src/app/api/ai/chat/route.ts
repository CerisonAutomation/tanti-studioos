import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import ZAI from 'z-ai-web-dev-sdk';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
  type: z.string().optional(),
});

const SYSTEM_PROMPT = `You are the AI assistant for Tanti Interiors StudioOS, a luxury interior design studio management platform based in Malta. You help with:
- Client management and CRM inquiries
- Project planning and status updates
- Quote generation advice and pricing guidance
- Supplier and procurement recommendations
- Interior design trends and suggestions
- Task management and workflow optimization
- General business advice for interior design studios

Always be professional, helpful, and knowledgeable about luxury interior design. Respond concisely and provide actionable advice when possible.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = chatSchema.parse(body);

    let conversationId = validated.conversationId;
    let conversation;
    let messages: Array<{ role: string; content: string }> = [];

    // Load existing conversation or create new one
    if (conversationId) {
      conversation = await db.aiConversation.findUnique({
        where: { id: conversationId },
      });

      if (conversation) {
        messages = JSON.parse(conversation.messages);
      }
    }

    // Add user message
    messages.push({
      role: 'user',
      content: validated.message,
    });

    // Create AI conversation title if new
    if (!conversation) {
      const title =
        validated.message.length > 50
          ? validated.message.substring(0, 50) + '...'
          : validated.message;

      conversation = await db.aiConversation.create({
        data: {
          title,
          messages: JSON.stringify(messages),
          type: validated.type || 'general',
        },
      });
      conversationId = conversation.id;
    }

    // Call ZAI LLM
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        ...messages,
      ],
      thinking: { type: 'disabled' },
    });

    const aiResponse =
      completion.choices?.[0]?.message?.content ||
      'I apologize, but I was unable to generate a response. Please try again.';

    // Add AI response to messages
    messages.push({
      role: 'assistant',
      content: aiResponse,
    });

    // Update conversation
    await db.aiConversation.update({
      where: { id: conversationId },
      data: {
        messages: JSON.stringify(messages),
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'ai_chat',
        description: `AI chat: ${validated.message.substring(0, 80)}${validated.message.length > 80 ? '...' : ''}`,
        entityType: 'ai_conversation',
        entityId: conversationId,
      },
    });

    return NextResponse.json({
      response: aiResponse,
      conversationId,
      messages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
