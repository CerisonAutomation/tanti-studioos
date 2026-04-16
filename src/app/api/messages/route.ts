import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const messageCreateSchema = z.object({
  channel: z.string().min(1, 'Channel is required'),
  direction: z.string().min(1, 'Direction is required'),
  from: z.string().min(1, 'From is required'),
  content: z.string().min(1, 'Content is required'),
  clientId: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  isAiGenerated: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = messageCreateSchema.parse(body);

    const message = await db.message.create({
      data: {
        clientId: validated.clientId,
        channel: validated.channel,
        direction: validated.direction,
        from: validated.from,
        to: validated.to,
        subject: validated.subject,
        content: validated.content,
        isAiGenerated: validated.isAiGenerated || false,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    const clientName = message.client?.name || 'Unknown';
    await db.activity.create({
      data: {
        type: 'message_received',
        description: `New ${validated.channel} message ${validated.direction === 'inbound' ? 'from' : 'to'} ${clientName}`,
        entityType: 'message',
        entityId: message.id,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Message POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
