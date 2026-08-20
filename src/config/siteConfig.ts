/**
 * Centralized Site, Contact & Billing Configuration
 * Reads from environment variables with safe fallbacks for Demo/Testing & Vercel deployment.
 *
 * Supported Environment Variables:
 *
 * CONTACT:
 * - OWNER_NAME / NEXT_PUBLIC_OWNER_NAME
 * - OWNER_PHONE / NEXT_PUBLIC_OWNER_PHONE
 * - WHATSAPP_NUMBER / NEXT_PUBLIC_WHATSAPP_NUMBER
 * - OWNER_EMAIL / NEXT_PUBLIC_OWNER_EMAIL
 *
 * BILLING:
 * - GST_NUMBER / NEXT_PUBLIC_GST_NUMBER
 * - BUSINESS_NAME / NEXT_PUBLIC_BUSINESS_NAME
 * - BUSINESS_ADDRESS / NEXT_PUBLIC_BUSINESS_ADDRESS
 * - GST_RATE / NEXT_PUBLIC_GST_RATE
 *
 * PAYMENT (RAZORPAY TEST / SANDBOX):
 * - RAZORPAY_KEY_ID / NEXT_PUBLIC_RAZORPAY_KEY_ID
 * - RAZORPAY_KEY_SECRET (Server-only secret)
 * - RAZORPAY_WEBHOOK_SECRET (Server-only secret)
 */

export function cleanPhoneForTel(phone: string): string {
  if (!phone) return '+918082760808';
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : `+${digits}`;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return '918082760808';
  // Remove all non-digits (WhatsApp API format: country code + number without + or spaces)
  return phone.replace(/\D/g, '');
}

export function isDemoGstin(gstin?: string): boolean {
  if (!gstin) return true;
  const upper = gstin.trim().toUpperCase();
  return (
    upper.includes('DEMO') ||
    upper.includes('TEST') ||
    upper.includes('01AAAAA0000A1Z5') ||
    upper.startsWith('00') ||
    upper === 'NOT_CONFIGURED'
  );
}

export const siteConfig = {
  name: 'Suroor Villa',

  // 1. CONTACT INFORMATION
  ownerName:
    process.env.NEXT_PUBLIC_OWNER_NAME ||
    process.env.OWNER_NAME ||
    'Suroor Villa Kashmiri Butler & Concierge',
  ownerPhone:
    process.env.NEXT_PUBLIC_OWNER_PHONE ||
    process.env.OWNER_PHONE ||
    '+91 80827 60808',
  whatsappNumber:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_OWNER_PHONE ||
    process.env.OWNER_PHONE ||
    '+91 80827 60808',
  ownerEmail:
    process.env.NEXT_PUBLIC_OWNER_EMAIL ||
    process.env.OWNER_EMAIL ||
    'concierge@suroorvilla.in',

  // 2. BILLING & LEGAL ENTITY INFORMATION
  billing: {
    businessName:
      process.env.NEXT_PUBLIC_BUSINESS_NAME ||
      process.env.BUSINESS_NAME ||
      'Suroor Luxury Villa & Hospitality LLP',
    businessAddress:
      process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
      process.env.BUSINESS_ADDRESS ||
      'Gulmarg Road, Tangmarg, Baramulla, Jammu & Kashmir 193404, India',
    gstNumber:
      process.env.NEXT_PUBLIC_GST_NUMBER ||
      process.env.GST_NUMBER ||
      '01AAAAA0000A1Z5',
    gstRate: Number(process.env.NEXT_PUBLIC_GST_RATE || process.env.GST_RATE || 18),
    get isDemo(): boolean {
      return false;
    },
    demoNotice: '',
    legalDisclaimer:
      'This invoice / booking voucher is generated for official reservation records.',
  },

  // Estate Location & Maps
  address:
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
    process.env.BUSINESS_ADDRESS ||
    'Gulmarg Road, Tangmarg, Baramulla, Jammu & Kashmir 193404, India',
  mapUrl: 'https://maps.google.com/?q=Gulmarg+Kashmir',
  mapEmbedUrl: 'https://www.google.com/maps?q=Gulmarg+Kashmir&output=embed',

  // 3. PAYMENT GATEWAY (RAZORPAY SECURE GATEWAY)
  payment: {
    isTestMode: false,
    currency: 'INR',
    razorpayKeyId:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      '',
    stripePublishableKey:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      process.env.STRIPE_PUBLISHABLE_KEY ||
      '',
    modeLabel: 'Razorpay Secure Payment Active',
    demoNotice: '',
  },

  // 4. DYNAMIC CONTACT LINKS
  get phoneHref() {
    return `tel:${cleanPhoneForTel(this.ownerPhone)}`;
  },

  get whatsappHref() {
    const wa = cleanPhoneForWhatsApp(this.whatsappNumber);
    const msg = encodeURIComponent(
      'Hello Suroor Villa Concierge, I would like to inquire about reserving a private stay in Kashmir.'
    );
    return `https://wa.me/${wa}?text=${msg}`;
  },

  get emailHref() {
    return `mailto:${this.ownerEmail}`;
  },

  getWhatsAppChatLink(customText?: string) {
    const wa = cleanPhoneForWhatsApp(this.whatsappNumber);
    const msg = encodeURIComponent(
      customText ||
        'Hello Suroor Villa Concierge, I would like to inquire about reserving a private stay.'
    );
    return `https://wa.me/${wa}?text=${msg}`;
  },
};

export default siteConfig;
