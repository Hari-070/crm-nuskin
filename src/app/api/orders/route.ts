import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateOrderId } from '@/lib/utils';
import { addDays } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const deliveryStatus = searchParams.get('deliveryStatus') || '';
  const customerId = searchParams.get('customerId') || '';

  const where: any = {};

  if (search) {
    where.OR = [
      { orderId: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (deliveryStatus) where.deliveryStatus = deliveryStatus;
  if (customerId) where.customerId = customerId;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    data: orders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { customerId, items, paymentStatus, deliveryStatus, notes } = body;

  if (!customerId || !items?.length) {
    return NextResponse.json({ error: 'Customer and items are required' }, { status: 400 });
  }

  // Validate and get products
  const productIds = items.map((item: any) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 400 });
  }

  // Calculate total and refill dates
  let totalAmount = 0;
  let maxRefillDays = 0;

  const orderItems = items.map((item: any) => {
    const product = products.find((p) => p.id === item.productId)!;
    const price = item.price || product.price;
    const totalPrice = price * item.quantity;
    totalAmount += totalPrice;
    if (product.refillCycleDays > maxRefillDays) {
      maxRefillDays = product.refillCycleDays;
    }
    return {
      productId: item.productId,
      quantity: item.quantity,
      price,
      totalPrice,
    };
  });

  const orderDate = new Date();
  const refillDate = addDays(orderDate, maxRefillDays);

  // Create order
  const order = await prisma.order.create({
    data: {
      orderId: generateOrderId(),
      customerId,
      totalAmount,
      orderDate,
      refillDate,
      paymentStatus: paymentStatus || 'pending',
      deliveryStatus: deliveryStatus || 'processing',
      notes: notes || null,
      items: { create: orderItems },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  // Update customer total spent
  if (paymentStatus === 'paid') {
    await prisma.customer.update({
      where: { id: customerId },
      data: { totalSpent: { increment: totalAmount } },
    });
  }

  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Automatically create refill follow-up
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  const productNames = order.items.map((i) => i.product.name).join(', ');

  await prisma.followUp.create({
    data: {
      type: 'refill_followup',
      title: `Refill reminder for ${customer?.name}`,
      description: `Customer ${customer?.name} may need a refill for: ${productNames}. Phone: ${customer?.phone}. Order: ${order.orderId}`,
      relatedCustomerId: customerId,
      relatedOrderId: order.id,
      dueDate: refillDate,
      status: 'pending',
    },
  });

  return NextResponse.json({ data: order }, { status: 201 });
}
