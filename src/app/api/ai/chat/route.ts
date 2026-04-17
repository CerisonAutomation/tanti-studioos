import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = `You are the AI assistant for Tanti Interiors, a luxury interior design studio in Valletta, Malta. You specialize in:
- Interior design concepts and recommendations
- Color palette suggestions for various styles
- Material and finish selections
- Furniture layout and space planning advice
- Mediterranean and contemporary design expertise
- Client communication drafting
- Quote and proposal descriptions

You communicate with elegance and professionalism, reflecting the premium nature of the studio's services. When discussing design, be specific about materials, colors (with hex codes when helpful), and spatial considerations. Reference Maltese and Mediterranean design elements when appropriate.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationId, type } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Build context based on conversation type
    let systemPrompt = SYSTEM_PROMPT;
    if (type === 'design') {
      systemPrompt += '\n\nFocus specifically on interior design concepts. Provide detailed design recommendations including color palettes with hex codes, material suggestions, furniture recommendations, and spatial planning advice.';
    } else if (type === 'quote') {
      systemPrompt += '\n\nFocus on helping draft professional quote descriptions and proposals for interior design services. Be specific about materials, labor, and timelines.';
    } else if (type === 'procurement') {
      systemPrompt += '\n\nFocus on procurement advice for interior design materials and furniture. Suggest suppliers, lead times, and cost considerations.';
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: message }
      ],
      thinking: { type: 'disabled' }
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I was unable to generate a response. Please try again.';

    // Save or update conversation in database
    const { db } = await import('@/lib/db');
    let convId = conversationId;

    if (convId) {
      // Update existing conversation
      const existing = await db.aiConversation.findUnique({ where: { id: convId } });
      if (existing) {
        const messages = JSON.parse(existing.messages);
        messages.push(
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
        );
        await db.aiConversation.update({
          where: { id: convId },
          data: { messages: JSON.stringify(messages) }
        });
      }
    } else {
      // Create new conversation
      const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      const messages = [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
      ];
      const conv = await db.aiConversation.create({
        data: {
          title,
          type: type || 'general',
          messages: JSON.stringify(messages)
        }
      });
      convId = conv.id;
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      },
      conversationId: convId
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
