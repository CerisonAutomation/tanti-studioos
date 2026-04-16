import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = taskUpdateSchema.parse(body);

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...validated,
        dueDate: validated.dueDate
          ? new Date(validated.dueDate)
          : validated.dueDate === null
            ? null
            : undefined,
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
        type: 'task_updated',
        description: `Task "${task.title}" updated${validated.status ? ` (status: ${validated.status})` : ''}`,
        entityType: 'task',
        entityId: task.id,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Task PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
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

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await db.task.delete({ where: { id } });

    // Log activity
    await db.activity.create({
      data: {
        type: 'task_deleted',
        description: `Task "${existing.title}" deleted`,
        entityType: 'task',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
