import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }= await params

  const body = await req.json();
  const { status, dueDate, title, description } = body;

  const followUp = await prisma.followUp.update({
    where: { id: id },
    data: {
      ...(status && { status }),
      ...(status === 'completed' && { completedAt: new Date() }),
      ...(dueDate && { dueDate: new Date(dueDate), notificationSent: false }),
      ...(title && { title }),
      description: description !== undefined ? description || null : undefined,
    },
    include: { lead: true, customer: true },
  });

  return NextResponse.json({ data: followUp });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }= await params
  await prisma.followUp.delete({ where: { id: id } });

  return NextResponse.json({ message: 'Follow-up deleted' });
}
