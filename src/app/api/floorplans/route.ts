import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const floorplanCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  data: z.any().optional(),
});

export async function GET() {
  try {
    const floorplans = await db.floorplan.findMany({
      include: { project: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(
      floorplans.map((fp) => ({
        ...fp,
        dataParsed: JSON.parse(fp.data),
      }))
    );
  } catch (error) {
    console.error('Failed to fetch floorplans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch floorplans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = floorplanCreateSchema.parse(body);

    const floorplan = await db.floorplan.create({
      data: {
        name: validated.name,
        projectId: validated.projectId,
        data: validated.data ? JSON.stringify(validated.data) : '{}',
      },
      include: { project: { select: { id: true, name: true } } },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'floorplan_created',
        description: `New floorplan "${validated.name}" created`,
        entityType: 'floorplan',
        entityId: floorplan.id,
      },
    });

    return NextResponse.json(floorplan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create floorplan:', error);
    return NextResponse.json(
      { error: 'Failed to create floorplan' },
      { status: 500 }
    );
  }
}
