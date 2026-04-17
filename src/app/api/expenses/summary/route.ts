import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Total by category
    const categoryRaw = await db.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: true,
    });

    const byCategory = categoryRaw.map((c) => ({
      category: c.category,
      total: c._sum.amount || 0,
      count: c._count,
    }));

    // Total by status
    const statusRaw = await db.expense.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true,
    });

    const byStatus = statusRaw.map((s) => ({
      status: s.status,
      total: s._sum.amount || 0,
      count: s._count,
    }));

    // Monthly breakdown (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyExpenses = await db.expense.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { amount: true, date: true },
    });

    const monthlyMap: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      monthlyMap[key] = 0;
    }

    monthlyExpenses.forEach((e) => {
      const key = new Date(e.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      if (monthlyMap[key] !== undefined) {
        monthlyMap[key] += e.amount;
      }
    });

    const monthlyBreakdown = Object.entries(monthlyMap)
      .reverse()
      .map(([month, total]) => ({ month, total }));

    // Grand totals
    const totalExpenses = byCategory.reduce((sum, c) => sum + c.total, 0);
    const pendingTotal = byStatus.find((s) => s.status === 'pending')?.total || 0;
    const pendingCount = byStatus.find((s) => s.status === 'pending')?.count || 0;
    const paidTotal = byStatus.find((s) => s.status === 'paid')?.total || 0;
    const approvedTotal = byStatus.find((s) => s.status === 'approved')?.total || 0;

    // Paid this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonthExpenses = await db.expense.findMany({
      where: {
        status: 'paid',
        date: { gte: startOfMonth },
      },
      select: { amount: true },
    });
    const paidThisMonth = paidThisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Budget utilization - total project budgets vs total spent
    const projects = await db.project.findMany({
      where: { budget: { not: null } },
      select: { budget: true, spent: true },
    });
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

    return NextResponse.json({
      totalExpenses,
      pendingTotal,
      pendingCount,
      paidTotal,
      approvedTotal,
      paidThisMonth,
      totalBudget,
      totalSpent,
      byCategory,
      byStatus,
      monthlyBreakdown,
    });
  } catch (error) {
    console.error('Failed to fetch expense summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense summary' },
      { status: 500 }
    );
  }
}
