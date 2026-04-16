import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const floorplanUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  data: z.any().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const floorplan = await db.floorplan.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true } } },
    });

    if (!floorplan) {
      return NextResponse.json(
        { error: 'Floorplan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...floorplan,
      dataParsed: JSON.parse(floorplan.data),
    });
  } catch (error) {
    console.error('Failed to fetch floorplan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch floorplan' },
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
    const validated = floorplanUpdateSchema.parse(body);

    const existing = await db.floorplan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Floorplan not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.data !== undefined)
      updateData.data = JSON.stringify(validated.data);

    const floorplan = await db.floorplan.update({
      where: { id },
      data: updateData,
      include: { project: { select: { id: true, name: true } } },
    });

    return NextResponse.json(floorplan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to update floorplan:', error);
    return NextResponse.json(
      { error: 'Failed to update floorplan' },
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

    const existing = await db.floorplan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Floorplan not found' },
        { status: 404 }
      );
    }

    await db.floorplan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete floorplan:', error);
    return NextResponse.json(
      { error: 'Failed to delete floorplan' },
      { status: 500 }
    );
  }
}
