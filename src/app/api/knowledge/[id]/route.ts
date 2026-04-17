import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const knowledgeUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  category: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await db.knowledgeEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...entry,
      tags: JSON.parse(entry.tags),
    });
  } catch (error) {
    console.error('Failed to fetch knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge entry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = knowledgeUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.content !== undefined) updateData.content = validated.content;
    if (validated.tags !== undefined) updateData.tags = JSON.stringify(validated.tags);

    const entry = await db.knowledgeEntry.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'knowledge_updated',
        description: `Knowledge entry "${entry.title}" updated`,
        entityType: 'knowledge',
        entityId: entry.id,
      },
    });

    return NextResponse.json({
      ...entry,
      tags: JSON.parse(entry.tags),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to update knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await db.knowledgeEntry.delete({
      where: { id },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'knowledge_deleted',
        description: `Knowledge entry "${entry.title}" deleted`,
        entityType: 'knowledge',
        entityId: entry.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge entry' },
      { status: 500 }
    );
  }
}
