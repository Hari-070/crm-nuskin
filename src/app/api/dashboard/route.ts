import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const next7Days = addDays(today, 7);

  const [
    totalRevenueResult,
    ordersToday,
    leadsToday,
    upcomingFollowUps,
    refillReminders,
    topProducts,
    recentOrders,
    pendingFollowUps,
    unreadNotifications,
    monthlyRevenue,
    leadsByStatus,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: 'paid' },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { orderDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.followUp.count({
      where: {
        status: 'pending',
        type: 'lead_followup',
        dueDate: { lte: next7Days },
      },
    }),
    prisma.followUp.count({
      where: {
        status: 'pending',
        type: 'refill_followup',
        dueDate: { lte: next7Days },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    }),
    prisma.followUp.findMany({
      where: { status: 'pending', dueDate: { lte: next7Days } },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { lead: true, customer: true, order: true },
    }),
    prisma.notification.count({ where: { isRead: false } }),
    // Last 30 days revenue
    prisma.order.groupBy({
      by: ['orderDate'],
      where: {
        paymentStatus: 'paid',
        orderDate: { gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  // Fetch product names for top products
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const topProductsWithNames = topProducts.map((tp) => {
    const product = products.find((p) => p.id === tp.productId);
    return {
      name: product ? `${product.name}${product.variant ? ` - ${product.variant}` : ''}` : 'Unknown',
      sales: tp._sum.quantity || 0,
      revenue: tp._sum.totalPrice || 0,
    };
  });

  return NextResponse.json({
    totalRevenue: totalRevenueResult._sum.totalAmount || 0,
    ordersToday,
    leadsToday,
    upcomingFollowUps,
    refillReminders,
    topProducts: topProductsWithNames,
    recentOrders,
    pendingFollowUps,
    unreadNotifications,
    monthlyRevenue,
    leadsByStatus,
  });
}
