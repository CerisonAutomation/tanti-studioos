import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const quoteCreateSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  title: z.string().min(1, 'Title is required'),
  projectId: z.string().optional(),
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
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const quotes = await db.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const quotesWithItems = quotes.map((quote) => ({
      ...quote,
      itemsParsed: JSON.parse(quote.items),
    }));

    return NextResponse.json(quotesWithItems);
  } catch (error) {
    console.error('Quotes GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = quoteCreateSchema.parse(body);

    const itemsJson = JSON.stringify(validated.items || []);

    const quote = await db.quote.create({
      data: {
        clientId: validated.clientId,
        projectId: validated.projectId,
        title: validated.title,
        tier: validated.tier,
        items: itemsJson,
        subtotal: validated.subtotal || 0,
        tax: validated.tax || 0,
        total: validated.total || 0,
        validUntil: validated.validUntil
          ? new Date(validated.validUntil)
          : undefined,
        notes: validated.notes,
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'quote_created',
        description: `New quote "${quote.title}" created for ${quote.client.name}`,
        entityType: 'quote',
        entityId: quote.id,
      },
    });

    return NextResponse.json(
      { ...quote, itemsParsed: JSON.parse(quote.items) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Quote POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}
