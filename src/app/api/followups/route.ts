import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  const search = searchParams.get('search') || '';

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [followUps, total] = await Promise.all([
    prisma.followUp.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { dueDate: 'asc' },
      include: {
        lead: true,
        customer: true,
        order: { include: { items: { include: { product: true } } } },
      },
    }),
    prisma.followUp.count({ where }),
  ]);

  return NextResponse.json({
    data: followUps,
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
  const { type, title, description, relatedLeadId, relatedCustomerId, relatedOrderId, dueDate } = body;

  if (!type || !title || !dueDate) {
    return NextResponse.json({ error: 'Type, title, and due date are required' }, { status: 400 });
  }

  const followUp = await prisma.followUp.create({
    data: {
      type,
      title,
      description: description || null,
      relatedLeadId: relatedLeadId || null,
      relatedCustomerId: relatedCustomerId || null,
      relatedOrderId: relatedOrderId || null,
      dueDate: new Date(dueDate),
      status: 'pending',
    },
    include: { lead: true, customer: true },
  });

  return NextResponse.json({ data: followUp }, { status: 201 });
}
