import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const quoteUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  projectId: z.string().nullable().optional(),
  status: z.string().optional(),
  tier: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      })
    )
    .optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  validUntil: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quote = await db.quote.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...quote,
      itemsParsed: JSON.parse(quote.items),
    });
  } catch (error) {
    console.error('Quote GET [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
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
    const validated = quoteUpdateSchema.parse(body);

    const existing = await db.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validated };

    if (validated.items) {
      updateData.items = JSON.stringify(validated.items);
    }

    if (validated.validUntil) {
      updateData.validUntil = new Date(validated.validUntil);
    } else if (validated.validUntil === null) {
      updateData.validUntil = null;
    }

    const quote = await db.quote.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'quote_updated',
        description: `Quote "${quote.title}" updated${validated.status ? ` (status: ${validated.status})` : ''}`,
        entityType: 'quote',
        entityId: quote.id,
      },
    });

    return NextResponse.json({
      ...quote,
      itemsParsed: JSON.parse(quote.items),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Quote PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
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

    const existing = await db.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    await db.quote.delete({ where: { id } });

    // Log activity
    await db.activity.create({
      data: {
        type: 'quote_deleted',
        description: `Quote "${existing.title}" deleted`,
        entityType: 'quote',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quote DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}
