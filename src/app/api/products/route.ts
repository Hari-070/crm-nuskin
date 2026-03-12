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
  const activeOnly = searchParams.get('activeOnly') === 'true';

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { variant: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (activeOnly) where.isActive = true;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
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
  const { name, variant, sku, price, stock, description, refillCycleDays } = body;

  if (!name || !sku || price === undefined) {
    return NextResponse.json({ error: 'Name, SKU, and price are required' }, { status: 400 });
  }

  // Check SKU uniqueness
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      variant: variant || null,
      sku,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      description: description || null,
      refillCycleDays: parseInt(refillCycleDays) || 30,
    },
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
