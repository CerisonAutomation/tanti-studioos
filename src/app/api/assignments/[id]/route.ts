import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const assignmentUpdateSchema = z.object({
  teamMemberId: z.string().optional(),
  projectId: z.string().optional(),
  role: z.string().optional(),
  allocation: z.number().int().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = assignmentUpdateSchema.parse(body);

    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.startDate) {
      updateData.startDate = new Date(validated.startDate);
    }
    if (validated.endDate) {
      updateData.endDate = new Date(validated.endDate);
    }

    const assignment = await db.assignment.update({
      where: { id },
      data: updateData,
      include: {
        teamMember: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'assignment_updated',
        description: `Assignment updated: ${assignment.teamMember.name} on ${assignment.project.name}`,
        entityType: 'assignment',
        entityId: assignment.id,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Assignment PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
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

    const existing = await db.assignment.findUnique({
      where: { id },
      include: {
        teamMember: { select: { name: true } },
        project: { select: { name: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await db.assignment.delete({ where: { id } });

    // Log activity
    await db.activity.create({
      data: {
        type: 'assignment_deleted',
        description: `Assignment removed: ${existing.teamMember.name} from ${existing.project.name}`,
        entityType: 'assignment',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assignment DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
