import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      followUps: { orderBy: { dueDate: 'asc' } },
      customer: {
        include: {
          orders: {
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  return NextResponse.json({ data: lead });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, phone, email, city, source, notes, status, followUpDate } = body;

  const existingLead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existingLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      email: email !== undefined ? email || null : undefined,
      city: city !== undefined ? city || null : undefined,
      ...(source && { source }),
      notes: notes !== undefined ? notes || null : undefined,
      ...(status && { status }),
      followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : undefined,
    },
  });

  // Create new follow-up if followUpDate changed
  if (followUpDate && followUpDate !== existingLead.followUpDate?.toISOString()) {
    await prisma.followUp.create({
      data: {
        type: 'lead_followup',
        title: `Follow up with ${lead.name}`,
        description: `Call ${lead.name} for follow-up. Phone: ${lead.phone}`,
        relatedLeadId: lead.id,
        dueDate: new Date(followUpDate),
        status: 'pending',
      },
    });
  }

  return NextResponse.json({ data: lead });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admins can delete leads
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete related follow-ups first
  await prisma.followUp.deleteMany({ where: { relatedLeadId: params.id } });
  await prisma.lead.delete({ where: { id: params.id } });

  return NextResponse.json({ message: 'Lead deleted successfully' });
}
