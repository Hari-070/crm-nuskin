import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const source = searchParams.get('source') || '';

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (source) where.source = source;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        followUps: {
          where: { status: 'pending' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
        customer: true,
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({
    data: leads,
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
  const { name, phone, email, city, source, notes, status, followUpDate } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      phone,
      email: email || null,
      city: city || null,
      source: source || 'other',
      notes: notes || null,
      status: status || 'new',
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
  });

  // Automatically create follow-up reminder if followUpDate is set
  if (followUpDate) {
    await prisma.followUp.create({
      data: {
        type: 'lead_followup',
        title: `Follow up with ${name}`,
        description: `Call ${name} for follow-up. Phone: ${phone}${email ? `, Email: ${email}` : ''}`,
        relatedLeadId: lead.id,
        dueDate: new Date(followUpDate),
        status: 'pending',
      },
    });
  }

  return NextResponse.json({ data: lead }, { status: 201 });
}
