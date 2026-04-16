import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Client stats
    const totalClients = await db.client.count();
    const activeClients = await db.client.count({
      where: { status: 'active' },
    });

    // Project stats by status
    const projects = await db.project.findMany({
      select: { status: true, budget: true, spent: true },
    });
    const projectsByStatus = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const totalProjects = projects.length;

    // Quote stats
    const totalQuotes = await db.quote.count();
    const acceptedQuotes = await db.quote.findMany({
      where: { status: 'accepted' },
      select: { total: true },
    });
    const acceptedQuotesValue = acceptedQuotes.reduce(
      (sum, q) => sum + q.total,
      0
    );

    // Unread messages
    const unreadMessages = await db.message.count({
      where: { status: 'unread' },
    });

    // Recent activities (last 10)
    const recentActivities = await db.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Revenue data - sum of accepted quotes
    const revenue = acceptedQuotesValue;

    // Project budget vs spent
    const budgetVsSpent = projects.map((p) => ({
      budget: p.budget || 0,
      spent: p.spent,
    }));
    const totalBudget = budgetVsSpent.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = budgetVsSpent.reduce((sum, p) => sum + p.spent, 0);

    return NextResponse.json({
      clients: {
        total: totalClients,
        active: activeClients,
      },
      projects: {
        total: totalProjects,
        byStatus: projectsByStatus,
      },
      quotes: {
        total: totalQuotes,
        acceptedValue: acceptedQuotesValue,
      },
      messages: {
        unread: unreadMessages,
      },
      revenue,
      budgetVsSpent: {
        totalBudget,
        totalSpent,
      },
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
