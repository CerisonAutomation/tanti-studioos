import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const teamMemberUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  avatar: z.string().nullable().optional(),
  status: z.string().optional(),
  capacity: z.number().int().min(0).max(100).optional(),
  phone: z.string().nullable().optional(),
  startDate: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamMember = await db.teamMember.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                budget: true,
                spent: true,
                startDate: true,
                endDate: true,
                client: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
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
    const validated = teamMemberUpdateSchema.parse(body);

    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.startDate) {
      updateData.startDate = new Date(validated.startDate);
    }

    const teamMember = await db.teamMember.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'team_member_updated',
        description: `Team member "${teamMember.name}" updated`,
        entityType: 'team',
        entityId: teamMember.id,
      },
    });

    return NextResponse.json(teamMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Team member PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
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

    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Delete assignments first
    await db.assignment.deleteMany({ where: { teamMemberId: id } });
    await db.teamMember.delete({ where: { id } });

    // Log activity
    await db.activity.create({
      data: {
        type: 'team_member_deleted',
        description: `Team member "${existing.name}" removed`,
        entityType: 'team',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team member DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
