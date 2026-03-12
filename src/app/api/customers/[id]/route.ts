import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } },
        },
      },
      followUps: {
        orderBy: { dueDate: 'asc' },
      },
      leads: true,
    },
  });

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  return NextResponse.json({ data: customer });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, phone, email, address, city, tags, notes } = body;

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      email: email !== undefined ? email || null : undefined,
      address: address !== undefined ? address || null : undefined,
      city: city !== undefined ? city || null : undefined,
      ...(tags !== undefined && { tags }),
      notes: notes !== undefined ? notes || null : undefined,
    },
  });

  return NextResponse.json({ data: customer });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.followUp.deleteMany({ where: { relatedCustomerId: params.id } });
  await prisma.customer.delete({ where: { id: params.id } });

  return NextResponse.json({ message: 'Customer deleted successfully' });
}
