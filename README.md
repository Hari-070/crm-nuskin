# 💊 Supplement CRM

A full-stack internal CRM for managing supplement sales — leads, customers, orders, follow-up reminders, and analytics — built with Next.js 15, MongoDB, Prisma, and NextAuth.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green) ![Prisma](https://img.shields.io/badge/Prisma-5-blue) ![NextAuth](https://img.shields.io/badge/NextAuth-5-purple)

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 Auth | Login with email/password, roles (Admin / Staff) |
| 📊 Dashboard | Revenue, orders, leads, follow-ups, top products |
| 👥 Leads | Track leads, statuses, follow-up dates |
| 🛒 Customers | Full customer profiles + purchase history |
| 📦 Products | SKU, stock, pricing, refill cycle |
| 🧾 Orders | Create orders, auto-calculate refill dates |
| 🔔 Follow-Ups | Central reminder system (lead + refill) |
| 📧 Notifications | Email alerts via Nodemailer/Resend (free) |
| 📈 Analytics | Revenue charts, funnel, top products |
| ⏰ Cron Job | Runs every 5 min to fire due notifications |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Node Cron
- **Auth**: NextAuth v5 (Credentials)
- **Database**: MongoDB Atlas
- **ORM**: Prisma 5
- **Email**: Nodemailer (Gmail/SMTP) or Resend (free tier)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/supplement-crm.git
cd supplement-crm
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# MongoDB Atlas connection string
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/supplement-crm?retryWrites=true&w=majority"

# NextAuth (generate a random secret)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-32-char-secret-here"

# Email via Gmail (free - use App Password)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="yourapp@gmail.com"
EMAIL_SERVER_PASSWORD="your-gmail-app-password"
EMAIL_FROM="yourapp@gmail.com"
ADMIN_EMAIL="admin@yourcompany.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create a database user
4. Whitelist your IP (or `0.0.0.0/0` for all)
5. Get the connection string and paste into `DATABASE_URL`

### 5. Push Prisma schema

```bash
npm run db:push
```

### 6. Seed the database

```bash
npm run db:seed
```

This creates:
- 2 users (admin + staff)
- 6 products
- 4 customers
- 3 orders
- 4 leads
- Follow-up reminders

### 7. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@supplementcrm.com | admin123 |
| Staff | staff@supplementcrm.com | staff123 |

---

## 📧 Email Setup (Free Options)

### Option 1: Gmail (Recommended for small teams)

1. Enable 2-Factor Authentication on your Gmail
2. Go to Google Account → Security → App Passwords
3. Generate an App Password for "Mail"
4. Use these settings:

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="yourapp@gmail.com"
EMAIL_SERVER_PASSWORD="xxxx xxxx xxxx xxxx"  # Your 16-char app password
```

**Limit**: 500 emails/day free

### Option 2: Resend (100 emails/day free)

1. Sign up at [resend.com](https://resend.com) (free)
2. Get your API key
3. Add to `.env.local`:

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
```

Then update `src/lib/email.ts` to use the Resend SDK instead of Nodemailer.

### Option 3: SendGrid (100 emails/day free)

Similar to Resend — create account, get API key, update email lib.

---

## ⏰ Background Cron Job

The cron job runs **every 5 minutes** and:

1. Finds all `pending` follow-ups where `dueDate <= now` and `notificationSent = false`
2. Sends an email to the admin for each due follow-up
3. Creates an in-app notification
4. Marks `notificationSent = true`

> **Note**: Node Cron runs in the same process as Next.js. For production, consider using a dedicated worker or a cron service like [Vercel Cron](https://vercel.com/docs/cron-jobs) or [Railway](https://railway.app).

### Manually trigger follow-up check

Via the UI: Settings → System → "Run Follow-Up Check Now"

Or via API:
```bash
curl -X POST http://localhost:3000/api/notifications/trigger \
  -H "Cookie: your-session-cookie"
```

---

## 📁 Project Structure

```
supplement-crm/
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.ts              # Sample data
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/       # Login page
│   │   ├── api/
│   │   │   ├── analytics/   # Analytics data
│   │   │   ├── auth/        # NextAuth handler
│   │   │   ├── customers/   # Customer CRUD
│   │   │   ├── dashboard/   # Dashboard stats
│   │   │   ├── followups/   # Follow-up CRUD
│   │   │   ├── leads/       # Lead CRUD + convert
│   │   │   ├── notifications/ # Notification system
│   │   │   ├── orders/      # Order CRUD
│   │   │   └── products/    # Product CRUD
│   │   ├── analytics/       # Analytics page
│   │   ├── customers/       # Customers page
│   │   ├── dashboard/       # Dashboard page
│   │   ├── followups/       # Follow-ups page
│   │   ├── leads/           # Leads page
│   │   ├── orders/          # Orders page
│   │   ├── products/        # Products page
│   │   └── settings/        # Settings page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   │   └── TopBar.tsx   # Top bar with notifications
│   │   ├── tables/
│   │   │   └── DataTable.tsx # Reusable table component
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── StatCard.tsx
│   │       ├── StatusBadge.tsx
│   │       └── toaster.tsx
│   ├── lib/
│   │   ├── cron.ts          # Background job scheduler
│   │   ├── email.ts         # Email sending + templates
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── utils.ts         # Utilities (formatCurrency, etc.)
│   ├── auth.ts              # NextAuth configuration
│   └── middleware.ts        # Route protection
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🔄 Core Workflows

### Lead → Customer Conversion

1. Create a lead with optional `followUpDate`
2. A `FollowUp` reminder is auto-created
3. When lead is ready, click **"Convert to Customer"**
4. A customer record is created from lead data
5. Pending lead follow-ups are cancelled

### Order → Refill Reminder

1. Create an order for a customer with products
2. `refillDate` = `orderDate + max(refillCycleDays)` across all products
3. A `refill_followup` is auto-created with the refill date
4. When due date passes, admin receives an email notification

### Notification Flow

```
Cron (every 5 min) → Check dueDate <= now → Send Email → Create In-App Notification → Mark notificationSent = true
```

---

## 🚢 Deployment

### Deploy to Vercel + MongoDB Atlas

#### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Create a Vercel project

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)

#### 3. Configure environment variables

In Vercel dashboard → Settings → Environment Variables, add:

```
DATABASE_URL         = mongodb+srv://...
NEXTAUTH_URL         = https://your-app.vercel.app
NEXTAUTH_SECRET      = your-secret
EMAIL_SERVER_HOST    = smtp.gmail.com
EMAIL_SERVER_PORT    = 587
EMAIL_SERVER_USER    = your@gmail.com
EMAIL_SERVER_PASSWORD = your-app-password
EMAIL_FROM           = your@gmail.com
ADMIN_EMAIL          = admin@yourcompany.com
NEXT_PUBLIC_APP_URL  = https://your-app.vercel.app
```

#### 4. Deploy

Click **Deploy**. Vercel will build and deploy automatically.

#### 5. Run the seed (one-time)

After deploying, run seed via Prisma Studio or a one-time script:

```bash
DATABASE_URL="your-atlas-url" npm run db:seed
```

#### Important: Cron Job on Vercel

Vercel serverless functions don't support persistent processes. Use **Vercel Cron Jobs** (available on Hobby plan):

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/trigger",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

The trigger endpoint is already protected (admin-only) and will run the follow-up check.

### Deploy to Railway (Persistent cron support)

Railway supports persistent Node.js processes, so the Node Cron job works natively.

1. Create a Railway project
2. Connect your GitHub repo
3. Add MongoDB Atlas URL as environment variable
4. Railway will auto-detect Next.js and deploy

---

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to MongoDB
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (DB GUI)
```

---

## 🔒 Security Notes

1. **Change default passwords** after first login
2. **NEXTAUTH_SECRET** must be a strong random string (32+ chars)
3. **MongoDB Atlas**: Restrict IP access to your server's IP in production
4. **Admin-only routes**: `/api/notifications/trigger` requires ADMIN role

---

## 📱 Mobile Support

The app is responsive and works on mobile browsers. The sidebar collapses on smaller screens. For a native mobile experience, consider wrapping with [Capacitor](https://capacitorjs.com/).

---

## 🤝 Adding New Users

Currently, users are created via the seed script or directly in the database. To add a user programmatically:

```typescript
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

await prisma.user.create({
  data: {
    name: 'New User',
    email: 'newuser@company.com',
    password: await bcrypt.hash('password123', 12),
    role: 'STAFF', // or 'ADMIN'
  },
});
```

A user management page can be added in Settings for admin users.

---

## 📊 Sample Email Notifications

**Lead Follow-Up Email:**
```
Subject: 📞 Lead Follow-Up: Vikram Singh — Due Now

Hello Admin,

You have a pending follow-up with a lead.

Lead Name: Vikram Singh
Phone: +919876543220
Email: vikram.singh@gmail.com
City: Delhi
Notes: Interested in muscle building stack
Follow-Up Due: March 12, 2025 at 10:00 AM

[View Lead in CRM]
```

**Refill Reminder Email:**
```
Subject: 🔄 Refill Reminder: Rahul Sharma — Due Now

Hello Admin,

Customer Rahul Sharma may be running low on supplements.

Customer Name: Rahul Sharma
Phone: +919876543210
Order ID: ORD-2024-001
Products: Whey Protein (1x), Creatine Monohydrate (1x)
Estimated Refill Date: April 5, 2025

[View Customer in CRM]
```

---

## 🐛 Troubleshooting

**"PrismaClientInitializationError"** — Check `DATABASE_URL` in `.env.local`. Make sure IP is whitelisted in MongoDB Atlas.

**"NEXTAUTH_SECRET is not set"** — Generate a secret: `openssl rand -base64 32`

**Emails not sending** — Verify Gmail App Password (not your regular password). Check `EMAIL_SERVER_USER` matches `EMAIL_FROM`.

**Cron not running on Vercel** — Use Vercel Cron Jobs with the `/api/notifications/trigger` endpoint.

---

## 📄 License

MIT — free to use and modify for internal tools.
