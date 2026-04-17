import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const projectCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  budget: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const clientId = searchParams.get('clientId');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    if (clientId) {
      where.clientId = clientId;
    }

    const projects = await db.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { [sort]: order },
    });

    // Get counts separately
    const projectIds = projects.map(p => p.id);
    const [taskCounts, quoteCounts, docCounts, fpCounts] = await Promise.all([
      db.task.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds } }, _count: true }),
      db.quote.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds } }, _count: true }),
      db.document.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds } }, _count: true }),
      db.floorplan.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds } }, _count: true }),
    ]);

    const taskMap = Object.fromEntries(taskCounts.map(t => [t.projectId, t._count]));
    const quoteMap = Object.fromEntries(quoteCounts.map(q => [q.projectId, q._count]));
    const docMap = Object.fromEntries(docCounts.map(d => [d.projectId, d._count]));
    const fpMap = Object.fromEntries(fpCounts.map(f => [f.projectId, f._count]));

    const projectsWithCounts = projects.map((project) => ({
      ...project,
      taskCount: taskMap[project.id] || 0,
      quoteCount: quoteMap[project.id] || 0,
      documentCount: docMap[project.id] || 0,
      floorplanCount: fpMap[project.id] || 0,
    }));

    return NextResponse.json(projectsWithCounts);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = projectCreateSchema.parse(body);

    const project = await db.project.create({
      data: {
        name: validated.name,
        clientId: validated.clientId,
        description: validated.description || null,
        status: validated.status || 'planning',
        priority: validated.priority || 'medium',
        budget: validated.budget || null,
        spent: 0,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        location: validated.location || null,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'project_created',
        description: `New project "${project.name}" created for ${project.client.name}`,
        entityType: 'project',
        entityId: project.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Project POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
