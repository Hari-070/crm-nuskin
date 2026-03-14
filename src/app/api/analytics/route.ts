import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period') || '30d';

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d': startDate = subDays(now, 7); break;
    case '30d': startDate = subDays(now, 30); break;
    case '90d': startDate = subDays(now, 90); break;
    case '12m': startDate = subMonths(now, 12); break;
    default: startDate = subDays(now, 30);
  }

  const [orders, leads, customers] = await Promise.all([
    prisma.order.findMany({
      where: { orderDate: { gte: startDate } },
      include: { items: { include: { product: true } } },
      orderBy: { orderDate: 'asc' },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: startDate } },
      select: { status: true, createdAt: true, convertedAt: true },
    }),
    prisma.customer.findMany({
      where: { createdAt: { gte: startDate } },
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  // Daily sales data
  const days = eachDayOfInterval({ start: startDate, end: now });
  const dailySales = days.map((day) => {
    const dateStr = format(day, 'MMM dd');
    const dayOrders = orders.filter(
      (o) => format(o.orderDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
    return {
      date: dateStr,
      revenue: dayOrders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0),
      orders: dayOrders.length,
    };
  });

  // Monthly sales (for 12m period)
  const months = eachMonthOfInterval({ start: startDate, end: now });
  const monthlySales = months.map((month) => {
    const monthOrders = orders.filter(
      (o) => format(o.orderDate, 'yyyy-MM') === format(month, 'yyyy-MM')
    );
    return {
      month: format(month, 'MMM yyyy'),
      revenue: monthOrders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0),
      orders: monthOrders.length,
    };
  });

  // Lead conversion
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  const leadsByStatus = ['new', 'contacted', 'interested', 'not_interested', 'converted'].map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = {
          name: `${item.product.name}${item.product.variant ? ` - ${item.product.variant}` : ''}`,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[key].quantity += item.quantity;
      productSales[key].revenue += item.totalPrice;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Repeat purchases
  const repeatCustomers = customers.filter((c) => c._count.orders > 1).length;
  const repeatRate = customers.length > 0 ? ((repeatCustomers / customers.length) * 100).toFixed(1) : '0';

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : '0';

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue),
      totalLeads,
      convertedLeads,
      conversionRate: parseFloat(conversionRate),
      repeatCustomers,
      repeatRate: parseFloat(repeatRate),
    },
    dailySales: period === '12m' ? monthlySales : dailySales,
    leadsByStatus,
    topProducts,
  });
}
