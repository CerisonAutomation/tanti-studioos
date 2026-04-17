import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const assignmentCreateSchema = z.object({
  teamMemberId: z.string().min(1, 'Team member is required'),
  projectId: z.string().min(1, 'Project is required'),
  role: z.string().optional(),
  allocation: z.number().int().min(0).max(100).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamMemberId = searchParams.get('teamMemberId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (teamMemberId) {
      where.teamMemberId = teamMemberId;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const assignments = await db.assignment.findMany({
      where,
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            capacity: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            budget: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ assignments, total: assignments.length });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = assignmentCreateSchema.parse(body);

    // Verify team member exists
    const teamMember = await db.teamMember.findUnique({
      where: { id: validated.teamMemberId },
    });
    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: validated.projectId },
    });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const assignment = await db.assignment.create({
      data: {
        teamMemberId: validated.teamMemberId,
        projectId: validated.projectId,
        role: validated.role || 'lead',
        allocation: validated.allocation ?? 50,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        status: validated.status || 'active',
        notes: validated.notes,
      },
      include: {
        teamMember: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'assignment_created',
        description: `${teamMember.name} assigned to ${project.name} as ${validated.role || 'lead'}`,
        entityType: 'assignment',
        entityId: assignment.id,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Assignment POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
