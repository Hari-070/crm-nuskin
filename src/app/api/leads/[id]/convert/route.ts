import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  if (lead.status === 'converted' && lead.customerId) {
    return NextResponse.json({ error: 'Lead already converted to customer' }, { status: 400 });
  }

  const body = await req.json();
  const { address, tags, notes } = body;

  // Create customer from lead
  const customer = await prisma.customer.create({
    data: {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: address || null,
      city: lead.city,
      tags: tags || [],
      notes: notes || lead.notes,
    },
  });

  // Update lead status to converted
  await prisma.lead.update({
    where: { id: params.id },
    data: {
      status: 'converted',
      convertedAt: new Date(),
      customerId: customer.id,
    },
  });

  // Cancel pending lead follow-ups
  await prisma.followUp.updateMany({
    where: { relatedLeadId: params.id, status: 'pending' },
    data: { status: 'cancelled' },
  });

  return NextResponse.json({ data: customer }, { status: 201 });
}
