import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const supplierCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  leadTime: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Suppliers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = supplierCreateSchema.parse(body);

    const supplier = await db.supplier.create({
      data: validated,
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'supplier_created',
        description: `New supplier "${supplier.name}" added`,
        entityType: 'supplier',
        entityId: supplier.id,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Supplier POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
