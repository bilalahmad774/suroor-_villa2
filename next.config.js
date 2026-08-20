/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_OWNER_NAME:
      process.env.NEXT_PUBLIC_OWNER_NAME ||
      process.env.OWNER_NAME ||
      'Suroor Villa Kashmiri Butler & Concierge',
    NEXT_PUBLIC_OWNER_PHONE:
      process.env.NEXT_PUBLIC_OWNER_PHONE ||
      process.env.OWNER_PHONE ||
      '+91 80827 60808',
    NEXT_PUBLIC_WHATSAPP_NUMBER:
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
      process.env.WHATSAPP_NUMBER ||
      process.env.OWNER_PHONE ||
      '+91 80827 60808',
    NEXT_PUBLIC_OWNER_EMAIL:
      process.env.NEXT_PUBLIC_OWNER_EMAIL ||
      process.env.OWNER_EMAIL ||
      'concierge@suroorvilla.in',
    NEXT_PUBLIC_BUSINESS_NAME:
      process.env.NEXT_PUBLIC_BUSINESS_NAME ||
      process.env.BUSINESS_NAME ||
      'Suroor Luxury Villa & Hospitality LLP',
    NEXT_PUBLIC_BUSINESS_ADDRESS:
      process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
      process.env.BUSINESS_ADDRESS ||
      'Gulmarg Road, Tangmarg, Baramulla, Jammu & Kashmir 193404, India',
    NEXT_PUBLIC_GST_NUMBER:
      process.env.NEXT_PUBLIC_GST_NUMBER ||
      process.env.GST_NUMBER ||
      '01AAAAA0000A1Z5',
    NEXT_PUBLIC_RAZORPAY_KEY_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      '',
  },
};

module.exports = nextConfig;

