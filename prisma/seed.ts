import { PrismaClient, UserRole, LeadStatus, LeadSource, PaymentStatus, DeliveryStatus, FollowUpType, FollowUpStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const staffPassword = await bcrypt.hash('staff123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@supplementcrm.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@supplementcrm.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@supplementcrm.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@supplementcrm.com',
      password: staffPassword,
      role: UserRole.STAFF,
    },
  });

  console.log('✅ Users created');

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'WHEY-001' },
      update: {},
      create: {
        name: 'Whey Protein',
        variant: 'Chocolate - 2kg',
        sku: 'WHEY-001',
        price: 2499,
        stock: 150,
        description: 'Premium whey protein isolate with 25g protein per serving',
        refillCycleDays: 30,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CREAT-001' },
      update: {},
      create: {
        name: 'Creatine Monohydrate',
        variant: 'Unflavored - 500g',
        sku: 'CREAT-001',
        price: 999,
        stock: 200,
        description: 'Pure micronized creatine monohydrate for strength and power',
        refillCycleDays: 60,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BCAA-001' },
      update: {},
      create: {
        name: 'BCAA 2:1:1',
        variant: 'Watermelon - 300g',
        sku: 'BCAA-001',
        price: 1499,
        stock: 120,
        description: 'Branched chain amino acids for muscle recovery',
        refillCycleDays: 45,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRE-001' },
      update: {},
      create: {
        name: 'Pre-Workout',
        variant: 'Blue Raspberry - 250g',
        sku: 'PRE-001',
        price: 1799,
        stock: 80,
        description: 'High-stim pre-workout for intense training sessions',
        refillCycleDays: 30,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'MULTI-001' },
      update: {},
      create: {
        name: 'Multivitamin',
        variant: '60 Tablets',
        sku: 'MULTI-001',
        price: 699,
        stock: 300,
        description: 'Complete daily multivitamin for active individuals',
        refillCycleDays: 60,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'OMEGA-001' },
      update: {},
      create: {
        name: 'Omega-3 Fish Oil',
        variant: '90 Softgels',
        sku: 'OMEGA-001',
        price: 899,
        stock: 180,
        description: 'High-potency omega-3 fatty acids for heart and joint health',
        refillCycleDays: 90,
      },
    }),
  ]);

  console.log('✅ Products created');

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Rahul Sharma',
        phone: '+919876543210',
        email: 'rahul.sharma@gmail.com',
        address: '123 MG Road',
        city: 'Mumbai',
        tags: ['vip', 'regular'],
        notes: 'Prefers whey protein and creatine combo',
        totalSpent: 15000,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Priya Patel',
        phone: '+919876543211',
        email: 'priya.patel@gmail.com',
        address: '45 Bandra West',
        city: 'Mumbai',
        tags: ['new'],
        notes: 'Interested in weight loss supplements',
        totalSpent: 4500,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Amit Kumar',
        phone: '+919876543212',
        email: 'amit.kumar@yahoo.com',
        address: '78 Koramangala',
        city: 'Bangalore',
        tags: ['bulk-buyer', 'regular'],
        notes: 'Buys in bulk, give discount',
        totalSpent: 28000,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Sneha Reddy',
        phone: '+919876543213',
        email: 'sneha.reddy@gmail.com',
        city: 'Hyderabad',
        tags: ['fitness-enthusiast'],
        totalSpent: 8000,
      },
    }),
  ]);

  console.log('✅ Customers created');

  // Create orders
  const now = new Date();
  const order1 = await prisma.order.create({
    data: {
      orderId: 'ORD-2024-001',
      customerId: customers[0].id,
      totalAmount: 3498,
      orderDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      refillDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      paymentStatus: PaymentStatus.paid,
      deliveryStatus: DeliveryStatus.delivered,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            price: 2499,
            totalPrice: 2499,
          },
          {
            productId: products[1].id,
            quantity: 1,
            price: 999,
            totalPrice: 999,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderId: 'ORD-2024-002',
      customerId: customers[2].id,
      totalAmount: 5796,
      orderDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      refillDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      paymentStatus: PaymentStatus.paid,
      deliveryStatus: DeliveryStatus.delivered,
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 2,
            price: 2499,
            totalPrice: 4998,
          },
          {
            productId: products[4].id,
            quantity: 1,
            price: 699,
            totalPrice: 699,
          },
          {
            productId: products[5].id,
            quantity: 1,
            price: 899,
            totalPrice: 899,
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderId: 'ORD-2024-003',
      customerId: customers[1].id,
      totalAmount: 2198,
      orderDate: new Date(),
      refillDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      paymentStatus: PaymentStatus.pending,
      deliveryStatus: DeliveryStatus.processing,
      items: {
        create: [
          {
            productId: products[2].id,
            quantity: 1,
            price: 1499,
            totalPrice: 1499,
          },
          {
            productId: products[4].id,
            quantity: 1,
            price: 699,
            totalPrice: 699,
          },
        ],
      },
    },
  });

  console.log('✅ Orders created');

  // Create leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        name: 'Vikram Singh',
        phone: '+919876543220',
        email: 'vikram.singh@gmail.com',
        city: 'Delhi',
        source: LeadSource.social_media,
        notes: 'Interested in muscle building stack',
        status: LeadStatus.interested,
        followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Anjali Gupta',
        phone: '+919876543221',
        email: 'anjali.gupta@gmail.com',
        city: 'Pune',
        source: LeadSource.referral,
        notes: 'Referred by Rahul Sharma',
        status: LeadStatus.contacted,
        followUpDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Rajesh Nair',
        phone: '+919876543222',
        city: 'Kochi',
        source: LeadSource.website,
        notes: 'Filled contact form asking about protein',
        status: LeadStatus.new,
        followUpDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Kavya Menon',
        phone: '+919876543223',
        email: 'kavya.menon@gmail.com',
        city: 'Chennai',
        source: LeadSource.advertisement,
        notes: 'Clicked on FB ad for weight loss',
        status: LeadStatus.new,
      },
    }),
  ]);

  console.log('✅ Leads created');

  // Create follow-ups
  await Promise.all([
    // Lead follow-ups
    prisma.followUp.create({
      data: {
        type: FollowUpType.lead_followup,
        title: `Follow up with ${leads[0].name}`,
        description: `Call ${leads[0].name} to discuss muscle building stack. Phone: ${leads[0].phone}`,
        relatedLeadId: leads[0].id,
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: FollowUpStatus.pending,
      },
    }),
    prisma.followUp.create({
      data: {
        type: FollowUpType.lead_followup,
        title: `Follow up with ${leads[1].name}`,
        description: `Call ${leads[1].name} to close the deal. Phone: ${leads[1].phone}`,
        relatedLeadId: leads[1].id,
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: FollowUpStatus.pending,
      },
    }),
    // Refill follow-ups
    prisma.followUp.create({
      data: {
        type: FollowUpType.refill_followup,
        title: `Refill reminder for ${customers[0].name}`,
        description: `Customer ${customers[0].name} may need a refill. Phone: ${customers[0].phone}. Order: ${order1.orderId}`,
        relatedCustomerId: customers[0].id,
        relatedOrderId: order1.id,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: FollowUpStatus.pending,
      },
    }),
    prisma.followUp.create({
      data: {
        type: FollowUpType.refill_followup,
        title: `Refill reminder for ${customers[2].name}`,
        description: `Customer ${customers[2].name} may need a refill. Phone: ${customers[2].phone}. Order: ${order2.orderId}`,
        relatedCustomerId: customers[2].id,
        relatedOrderId: order2.id,
        dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        status: FollowUpStatus.pending,
      },
    }),
  ]);

  console.log('✅ Follow-ups created');
  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin: admin@supplementcrm.com / admin123');
  console.log('   Staff: staff@supplementcrm.com / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
