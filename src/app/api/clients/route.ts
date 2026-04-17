import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const clientCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const clients = await db.client.findMany({
      where,
      orderBy: { [sort]: order },
    });

    // Get counts separately to avoid complex joins
    const clientIds = clients.map(c => c.id);
    const [projectCounts, quoteCounts, messageCounts] = await Promise.all([
      db.project.groupBy({ by: ['clientId'], where: { clientId: { in: clientIds } }, _count: true }),
      db.quote.groupBy({ by: ['clientId'], where: { clientId: { in: clientIds } }, _count: true }),
      db.message.groupBy({ by: ['clientId'], where: { clientId: { in: clientIds } }, _count: true }),
    ]);

    const projectMap = Object.fromEntries(projectCounts.map(p => [p.clientId, p._count]));
    const quoteMap = Object.fromEntries(quoteCounts.map(q => [q.clientId, q._count]));
    const messageMap = Object.fromEntries(messageCounts.map(m => [m.clientId, m._count]));

    const clientsWithCounts = clients.map((client) => ({
      ...client,
      projectCount: projectMap[client.id] || 0,
      quoteCount: quoteMap[client.id] || 0,
      messageCount: messageMap[client.id] || 0,
    }));

    return NextResponse.json({ clients: clientsWithCounts, total: clientsWithCounts.length });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = clientCreateSchema.parse(body);

    const client = await db.client.create({
      data: validated,
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'client_created',
        description: `New client "${client.name}" added`,
        entityType: 'client',
        entityId: client.id,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Client POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
