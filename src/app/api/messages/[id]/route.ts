import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const messageUpdateSchema = z.object({
  status: z.string().optional(),
  isAiGenerated: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = messageUpdateSchema.parse(body);

    const existing = await db.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    const message = await db.message.update({
      where: { id },
      data: validated,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity if status changed
    if (validated.status && validated.status !== existing.status) {
      await db.activity.create({
        data: {
          type: 'message_status_changed',
          description: `Message marked as ${validated.status}`,
          entityType: 'message',
          entityId: message.id,
        },
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Message PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
