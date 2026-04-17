import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const teamMemberCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.string().optional(),
  avatar: z.string().optional(),
  status: z.string().optional(),
  capacity: z.number().int().min(0).max(100).optional(),
  phone: z.string().optional(),
  startDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (role && role !== 'all') {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const teamMembers = await db.teamMember.findMany({
      where,
      include: {
        assignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ teamMembers, total: teamMembers.length });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = teamMemberCreateSchema.parse(body);

    const teamMember = await db.teamMember.create({
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role || 'designer',
        avatar: validated.avatar,
        status: validated.status || 'available',
        capacity: validated.capacity ?? 100,
        phone: validated.phone,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'team_member_created',
        description: `New team member "${teamMember.name}" added`,
        entityType: 'team',
        entityId: teamMember.id,
      },
    });

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Team member POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
