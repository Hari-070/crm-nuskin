import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {id} = await params

  const order = await prisma.order.findUnique({
    where: { id: id },
    include: {
      customer: true,
      items: { include: { product: true } },
      followUps: true,
    },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({ data: order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const {id} = await params

  const body = await req.json();
  const { paymentStatus, deliveryStatus, notes } = body;

  const existing = await prisma.order.findUnique({ where: { id: id } });
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const order = await prisma.order.update({
    where: { id: id },
    data: {
      ...(paymentStatus && { paymentStatus }),
      ...(deliveryStatus && { deliveryStatus }),
      notes: notes !== undefined ? notes || null : undefined,
    },
    include: { customer: true, items: { include: { product: true } } },
  });

  // If payment status changed to paid, update customer total spent
  if (paymentStatus === 'paid' && existing.paymentStatus !== 'paid') {
    await prisma.customer.update({
      where: { id: order.customerId },
      data: { totalSpent: { increment: order.totalAmount } },
    });
  }

  return NextResponse.json({ data: order });
}
