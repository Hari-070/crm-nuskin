import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Supplement CRM" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

export function createLeadFollowUpEmail(data: {
  leadName: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  dueDate: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; }
        .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
        .value { color: #111827; font-size: 16px; font-weight: 600; margin-top: 2px; }
        .badge { background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin:0; font-size: 20px;">📞 Lead Follow-Up Reminder</h1>
        <p style="margin: 5px 0 0; opacity: 0.9;">Action required for Supplement CRM</p>
      </div>
      <div class="content">
        <p>Hello Admin,</p>
        <p>You have a pending follow-up with a lead. Here are the details:</p>
        
        <div class="info-card">
          <div class="label">Lead Name</div>
          <div class="value">${data.leadName}</div>
        </div>
        
        <div class="info-card">
          <div class="label">Phone Number</div>
          <div class="value"><a href="tel:${data.phone}">${data.phone}</a></div>
        </div>
        
        ${data.email ? `
        <div class="info-card">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
        </div>
        ` : ''}
        
        ${data.city ? `
        <div class="info-card">
          <div class="label">City</div>
          <div class="value">${data.city}</div>
        </div>
        ` : ''}
        
        ${data.notes ? `
        <div class="info-card">
          <div class="label">Notes</div>
          <div class="value">${data.notes}</div>
        </div>
        ` : ''}
        
        <div class="info-card">
          <div class="label">Follow-Up Due Date</div>
          <div class="value" style="color: #dc2626;">${data.dueDate}</div>
        </div>
        
        <p>Please reach out to this lead as soon as possible.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/leads" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 10px;">View Lead in CRM</a>
        
        <div class="footer">
          <p>Supplement CRM — Automated Reminder System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function createRefillFollowUpEmail(data: {
  customerName: string;
  phone: string;
  email?: string;
  orderId: string;
  products: string;
  refillDate: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; }
        .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
        .value { color: #111827; font-size: 16px; font-weight: 600; margin-top: 2px; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin:0; font-size: 20px;">🔄 Refill Reminder</h1>
        <p style="margin: 5px 0 0; opacity: 0.9;">Customer may need a supplement refill</p>
      </div>
      <div class="content">
        <p>Hello Admin,</p>
        <p>A customer may be running low on supplements. Here are the details:</p>
        
        <div class="info-card">
          <div class="label">Customer Name</div>
          <div class="value">${data.customerName}</div>
        </div>
        
        <div class="info-card">
          <div class="label">Phone Number</div>
          <div class="value"><a href="tel:${data.phone}">${data.phone}</a></div>
        </div>
        
        ${data.email ? `
        <div class="info-card">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
        </div>
        ` : ''}
        
        <div class="info-card">
          <div class="label">Order ID</div>
          <div class="value">${data.orderId}</div>
        </div>
        
        <div class="info-card">
          <div class="label">Products Purchased</div>
          <div class="value">${data.products}</div>
        </div>
        
        <div class="info-card">
          <div class="label">Estimated Refill Date</div>
          <div class="value" style="color: #2563eb;">${data.refillDate}</div>
        </div>
        
        <p>This is a great opportunity to reach out and offer a reorder!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/customers" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 10px;">View Customer in CRM</a>
        
        <div class="footer">
          <p>Supplement CRM — Automated Reminder System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
