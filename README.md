# Suroor Villa — Luxury 3-Bedroom Himalayan Estate

A five-star luxury hospitality booking and estate management web application for **Suroor Villa**, an exclusive 3-bedroom private estate nestled in the pine ridgelines of Kashmir.

---

## Features

- **Luxury Guest Experience**: Immersive visual gallery, high-contrast typography, interactive room suites showcase, curated Kashmiri dining, and bespoke mountain experiences.
- **Real-Time Booking & Pricing Engine**: Dynamic rates, seasonal weekend surcharges, promo codes, tax (CGST + SGST) breakdown, and instant availability lock.
- **Dual Payment Gateway Support**:
  - **Razorpay**: Order creation, checkout integration, SHA-256 HMAC signature verification, and webhooks.
  - **Stripe**: PaymentIntent creation, elements checkout, automated refunds, and webhook processing.
- **Branded Resend Email Notifications**: Responsive transactional templates for reservations, payment receipts, check-in reminders, cancellations, and admin alerts.
- **GST Invoicing**: Instant printable and downloadable tax invoices with full statutory breakdowns.
- **Self-Service Guest Dashboard**: View active stays, historical reservations, invoice downloads, cancellations, and stay reviews.
- **Estate Admin Portal**: Real-time revenue analytics, reservation controls, pricing & seasonal rules, coupon creation, and full audit logs.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, API Routes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons, Framer Motion
- **State & Data**: Unified persistent in-memory data store with optional Prisma/Supabase bindings
- **Payments**: Razorpay Node SDK & Stripe SDK
- **Email**: Resend API
- **Deployment**: Vercel & Node.js Standalone

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/suroor-villa.git
cd suroor-villa
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Populate the required secrets:

```env
# Authentication
JWT_SECRET=your-secure-random-secret-key-32-chars

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxx

# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM_EMAIL=reservations@suroorvilla.in

# Estate & Tax Info
GST_NUMBER=01AAAAA0000A1Z5
GST_RATE=18
ESTATE_SUPPORT_PHONE=+91 98765 43210
ESTATE_SUPPORT_EMAIL=concierge@suroorvilla.in
```

### 3. Development Mode

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### 4. Production Build

```bash
npm run build
npm start
```

---

## Webhook Endpoints

| Gateway | Webhook Route | Handled Events |
|---|---|---|
| **Razorpay** | `/api/webhooks/razorpay` | `payment.captured`, `payment.failed`, `refund.processed` |
| **Stripe** | `/api/webhooks/stripe` | `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` |

---

## Security Best Practices

- **Zero Client-Side Secrets**: All payment gateway secret keys and email credentials execute strictly on the server-side API routes.
- **Server Signature Verification**: Payment outcomes are verified with cryptographic HMAC hashes before confirming bookings.
- **Idempotent Operations**: Payment order references and refund actions are guarded by unique idempotency keys.
- **Strict Role-Based Authorization**: Admin endpoints verify signed JWT cookies and enforce administrative role privileges.

---

## License

Private and proprietary estate reservation application for Suroor Villa Kashmir.
