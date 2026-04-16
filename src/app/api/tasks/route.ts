import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = taskCreateSchema.parse(body);

    const task = await db.task.create({
      data: {
        title: validated.title,
        projectId: validated.projectId,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        assignee: validated.assignee,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
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
        type: 'task_created',
        description: `New task "${task.title}" created in ${task.project.name}`,
        entityType: 'task',
        entityId: task.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Task POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
