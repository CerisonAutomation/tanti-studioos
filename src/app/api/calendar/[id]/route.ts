import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const eventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await db.calendarEvent.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true } }, project: { select: { id: true, name: true, status: true } } },
    });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = eventUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.startDate) updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);

    const event = await db.calendarEvent.update({ where: { id }, data: updateData });

    await db.activity.create({
      data: {
        type: 'calendar_event_updated',
        description: `Calendar event "${event.title}" updated`,
        entityType: 'calendar_event',
        entityId: event.id,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Calendar event PUT error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await db.calendarEvent.delete({ where: { id } });

    await db.activity.create({
      data: {
        type: 'calendar_event_deleted',
        description: `Calendar event "${event.title}" deleted`,
        entityType: 'calendar_event',
        entityId: event.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar event DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
