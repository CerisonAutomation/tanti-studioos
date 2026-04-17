import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const eventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  color: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startAfter = searchParams.get('startAfter');
    const startBefore = searchParams.get('startBefore');

    const where: Record<string, unknown> = {};
    if (type && type !== 'all') where.type = type;
    if (startAfter || startBefore) {
      where.startDate = {};
      if (startAfter) (where.startDate as Record<string, unknown>).gte = new Date(startAfter);
      if (startBefore) (where.startDate as Record<string, unknown>).lte = new Date(startBefore);
    }

    const events = await db.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ events, total: events.length });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = eventCreateSchema.parse(body);

    const event = await db.calendarEvent.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type || 'meeting',
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        allDay: validated.allDay || false,
        location: validated.location,
        clientId: validated.clientId,
        projectId: validated.projectId,
        color: validated.color,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Calendar event POST error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
