import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const moodBoardUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  style: z.string().optional(),
  colorPalette: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const board = await db.moodBoard.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!board) {
      return NextResponse.json(
        { error: 'Mood board not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...board,
      colorPalette: JSON.parse(board.colorPalette),
      images: JSON.parse(board.images),
    });
  } catch (error) {
    console.error('Failed to fetch mood board:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood board' },
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
    const validated = moodBoardUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.projectId !== undefined) updateData.projectId = validated.projectId || null;
    if (validated.style !== undefined) updateData.style = validated.style;
    if (validated.colorPalette !== undefined) updateData.colorPalette = JSON.stringify(validated.colorPalette);
    if (validated.images !== undefined) updateData.images = JSON.stringify(validated.images);
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.isPublic !== undefined) updateData.isPublic = validated.isPublic;

    const board = await db.moodBoard.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'moodboard_updated',
        description: `Mood board "${board.title}" updated`,
        entityType: 'moodboard',
        entityId: board.id,
      },
    });

    return NextResponse.json({
      ...board,
      colorPalette: JSON.parse(board.colorPalette),
      images: JSON.parse(board.images),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to update mood board:', error);
    return NextResponse.json(
      { error: 'Failed to update mood board' },
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
    const board = await db.moodBoard.delete({
      where: { id },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'moodboard_deleted',
        description: `Mood board "${board.title}" deleted`,
        entityType: 'moodboard',
        entityId: board.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete mood board:', error);
    return NextResponse.json(
      { error: 'Failed to delete mood board' },
      { status: 500 }
    );
  }
}
