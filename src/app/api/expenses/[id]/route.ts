import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const expenseUpdateSchema = z.object({
  description: z.string().min(1, 'Description is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  category: z.string().optional(),
  vendor: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
  receiptUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = await db.expense.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, budget: true } },
        client: { select: { id: true, name: true } },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Failed to fetch expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
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
    const validated = expenseUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.amount !== undefined) updateData.amount = validated.amount;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.vendor !== undefined) updateData.vendor = validated.vendor;
    if (validated.projectId !== undefined) updateData.projectId = validated.projectId;
    if (validated.clientId !== undefined) updateData.clientId = validated.clientId;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.date !== undefined) updateData.date = new Date(validated.date);
    if (validated.receiptUrl !== undefined) updateData.receiptUrl = validated.receiptUrl;
    if (validated.notes !== undefined) updateData.notes = validated.notes;

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, budget: true } },
        client: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'expense_updated',
        description: `Expense "${expense.description}" updated`,
        entityType: 'expense',
        entityId: expense.id,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to update expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
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
    const expense = await db.expense.delete({
      where: { id },
    });

    // Log activity
    await db.activity.create({
      data: {
        type: 'expense_deleted',
        description: `Expense "${expense.description}" deleted`,
        entityType: 'expense',
        entityId: expense.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
