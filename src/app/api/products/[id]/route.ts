import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      orderItems: {
        include: {
          order: { include: { customer: true } },
        },
        orderBy: { order: { createdAt: 'desc' } },
        take: 20,
      },
    },
  });

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ data: product });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, variant, price, stock, description, refillCycleDays, isActive } = body;

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      variant: variant !== undefined ? variant || null : undefined,
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      description: description !== undefined ? description || null : undefined,
      ...(refillCycleDays !== undefined && { refillCycleDays: parseInt(refillCycleDays) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ data: product });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete - just deactivate
  await prisma.product.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ message: 'Product deactivated successfully' });
}
