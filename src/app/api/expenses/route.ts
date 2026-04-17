import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const expenseCreateSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().default('materials'),
  vendor: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  status: z.string().default('pending'),
  date: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;
    if (clientId) where.clientId = clientId;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.date = dateFilter;
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { vendor: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, budget: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = expenseCreateSchema.parse(body);

    const expense = await db.expense.create({
      data: {
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        vendor: validated.vendor || null,
        projectId: validated.projectId || null,
        clientId: validated.clientId || null,
        status: validated.status,
        date: validated.date ? new Date(validated.date) : new Date(),
        receiptUrl: validated.receiptUrl || null,
        notes: validated.notes || null,
      },
      include: {
        project: { select: { id: true, name: true, budget: true } },
        client: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'expense_created',
        description: `Expense "${expense.description}" (€${expense.amount.toLocaleString()}) recorded`,
        entityType: 'expense',
        entityId: expense.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to create expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
