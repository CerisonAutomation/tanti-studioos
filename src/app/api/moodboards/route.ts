import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const moodBoardCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  style: z.string().default('contemporary'),
  colorPalette: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style');
    const search = searchParams.get('search');
    const projectId = searchParams.get('projectId');

    const where: Record<string, unknown> = {};
    if (style && style !== 'all') {
      where.style = style;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const boards = await db.moodBoard.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Parse JSON fields for each board
    const parsed = boards.map((board) => ({
      ...board,
      colorPalette: JSON.parse(board.colorPalette),
      images: JSON.parse(board.images),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Failed to fetch mood boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood boards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = moodBoardCreateSchema.parse(body);

    const board = await db.moodBoard.create({
      data: {
        title: validated.title,
        description: validated.description ?? null,
        projectId: validated.projectId ?? null,
        style: validated.style,
        colorPalette: JSON.stringify(validated.colorPalette),
        images: JSON.stringify(validated.images),
        notes: validated.notes ?? null,
        isPublic: validated.isPublic,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'moodboard_created',
        description: `New mood board "${board.title}" created`,
        entityType: 'moodboard',
        entityId: board.id,
      },
    });

    return NextResponse.json(
      {
        ...board,
        colorPalette: JSON.parse(board.colorPalette),
        images: JSON.parse(board.images),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create mood board:', error);
    return NextResponse.json(
      { error: 'Failed to create mood board' },
      { status: 500 }
    );
  }
}
