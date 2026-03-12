import cron from 'node-cron';
import { prisma } from './prisma';
import { sendEmail, createLeadFollowUpEmail, createRefillFollowUpEmail } from './email';
import { format } from 'date-fns';

let isRunning = false;

export function startCronJobs() {
  if (isRunning) return;
  isRunning = true;

  console.log('🕐 Starting cron jobs...');

  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running follow-up check...', new Date().toISOString());
    await processFollowUps();
  });

  console.log('✅ Cron jobs started - checking follow-ups every 5 minutes');
}

async function processFollowUps() {
  try {
    const now = new Date();

    // Find all pending follow-ups that are due and notification not yet sent
    const dueFollowUps = await prisma.followUp.findMany({
      where: {
        status: 'pending',
        notificationSent: false,
        dueDate: {
          lte: now,
        },
      },
      include: {
        lead: true,
        customer: true,
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${dueFollowUps.length} due follow-ups`);

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not set, skipping email notifications');
      return;
    }

    for (const followUp of dueFollowUps) {
      try {
        let emailSent = false;

        if (followUp.type === 'lead_followup' && followUp.lead) {
          const html = createLeadFollowUpEmail({
            leadName: followUp.lead.name,
            phone: followUp.lead.phone,
            email: followUp.lead.email || undefined,
            city: followUp.lead.city || undefined,
            notes: followUp.lead.notes || undefined,
            dueDate: format(followUp.dueDate, 'PPPp'),
          });

          const result = await sendEmail({
            to: adminEmail,
            subject: `📞 Lead Follow-Up: ${followUp.lead.name} — Due Now`,
            html,
          });

          emailSent = result.success;
        } else if (followUp.type === 'refill_followup' && followUp.customer) {
          const productNames = followUp.order?.items
            .map((item) => `${item.product.name} (${item.quantity}x)`)
            .join(', ') || 'N/A';

          const html = createRefillFollowUpEmail({
            customerName: followUp.customer.name,
            phone: followUp.customer.phone,
            email: followUp.customer.email || undefined,
            orderId: followUp.order?.orderId || 'N/A',
            products: productNames,
            refillDate: followUp.order?.refillDate
              ? format(followUp.order.refillDate, 'PPP')
              : format(followUp.dueDate, 'PPP'),
          });

          const result = await sendEmail({
            to: adminEmail,
            subject: `🔄 Refill Reminder: ${followUp.customer.name} — Due Now`,
            html,
          });

          emailSent = result.success;
        }

        // Create in-app notification regardless of email status
        await prisma.notification.create({
          data: {
            title: followUp.title,
            message: followUp.description || followUp.title,
            type: followUp.type,
            relatedId: followUp.id,
          },
        });

        // Mark notification as sent
        await prisma.followUp.update({
          where: { id: followUp.id },
          data: { notificationSent: true },
        });

        console.log(`✅ Processed follow-up: ${followUp.title} (email: ${emailSent})`);
      } catch (err) {
        console.error(`❌ Failed to process follow-up ${followUp.id}:`, err);
      }
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}

// Export for manual trigger
export { processFollowUps };
