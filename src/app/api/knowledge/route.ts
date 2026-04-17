import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const knowledgeCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().default('guides'),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const entries = await db.knowledgeEntry.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Parse tags JSON for each entry
    const parsed = entries.map((entry) => ({
      ...entry,
      tags: JSON.parse(entry.tags),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Failed to fetch knowledge entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = knowledgeCreateSchema.parse(body);

    const entry = await db.knowledgeEntry.create({
      data: {
        title: validated.title,
        category: validated.category,
        content: validated.content,
        tags: JSON.stringify(validated.tags),
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'knowledge_created',
        description: `New knowledge entry "${entry.title}" created`,
        entityType: 'knowledge',
        entityId: entry.id,
      },
    });

    return NextResponse.json(
      { ...entry, tags: JSON.parse(entry.tags) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge entry' },
      { status: 500 }
    );
  }
}
