import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './db';
import { hashPassword, comparePassword } from './auth';
import { calculateBookingPrice, Rule, CouponData, PricingQuote } from './pricingEngine';
import { defaultPricingConfig, getRoomPrice, getEntireVillaPrice, PricingConfig } from '@/config/pricingConfig';
import { AccommodationService } from './accommodationService';
import { format, parseISO, addMinutes } from 'date-fns';

export function normalizeDateOnly(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '';
  if (typeof dateStrOrObj === 'string') {
    const trimmed = dateStrOrObj.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes('T')) {
      return trimmed.split('T')[0];
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return trimmed.substring(0, 10);
  }
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

// Persistent Storage File Path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Async Mutex for thread-safe atomic booking transactions
class AsyncMutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let unlock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const willLock = this.mutex.then(() => unlock);
    this.mutex = this.mutex.then(() => nextLock);
    return willLock;
  }
}

const bookingMutex = new AsyncMutex();

export interface StoreData {
  users: any[];
  villas: any[];
  rooms: any[];
  amenities: any[];
  gallery: any[];
  bookings: any[];
  guests: any[];
  availabilities: any[];
  pricingRules: Rule[];
  coupons: CouponData[];
  payments: any[];
  invoices: any[];
  cancellations: any[];
  refunds: any[];
  reviews: any[];
  notifications: any[];
  contactMessages: any[];
  auditLogs: any[];
  passwordResetTokens: any[];
}

class PersistentStore {
  data: StoreData = {
    users: [],
    villas: [],
    rooms: [],
    amenities: [],
    gallery: [],
    bookings: [],
    guests: [],
    availabilities: [],
    pricingRules: [],
    coupons: [],
    payments: [],
    invoices: [],
    cancellations: [],
    refunds: [],
    reviews: [],
    notifications: [],
    contactMessages: [],
    auditLogs: [],
    passwordResetTokens: [],
  };

  initialized = false;

  constructor() {
    this.loadFromDisk();
  }

  // Getters for compatibility with memStore consumers
  get users() { return this.data.users; }
  set users(v) { this.data.users = v; }

  get villas() { return this.data.villas; }
  set villas(v) { this.data.villas = v; }

  get rooms() { return this.data.rooms; }
  set rooms(v) { this.data.rooms = v; }

  get amenities() { return this.data.amenities; }
  set amenities(v) { this.data.amenities = v; }

  get gallery() { return this.data.gallery; }
  set gallery(v) { this.data.gallery = v; }

  get bookings() { return this.data.bookings; }
  set bookings(v) { this.data.bookings = v; }

  get guests() { return this.data.guests; }
  set guests(v) { this.data.guests = v; }

  get availabilities() { return this.data.availabilities; }
  set availabilities(v) { this.data.availabilities = v; }

  get pricingRules() { return this.data.pricingRules; }
  set pricingRules(v) { this.data.pricingRules = v; }

  get coupons() { return this.data.coupons; }
  set coupons(v) { this.data.coupons = v; }

  get payments() { return this.data.payments; }
  set payments(v) { this.data.payments = v; }

  get invoices() { return this.data.invoices; }
  set invoices(v) { this.data.invoices = v; }

  get cancellations() { return this.data.cancellations; }
  set cancellations(v) { this.data.cancellations = v; }

  get refunds() { return this.data.refunds; }
  set refunds(v) { this.data.refunds = v; }

  get reviews() { return this.data.reviews; }
  set reviews(v) { this.data.reviews = v; }

  get notifications() { return this.data.notifications; }
  set notifications(v) { this.data.notifications = v; }

  get contactMessages() { return this.data.contactMessages; }
  set contactMessages(v) { this.data.contactMessages = v; }

  get auditLogs() { return this.data.auditLogs; }
  set auditLogs(v) { this.data.auditLogs = v; }

  get passwordResetTokens() { return this.data.passwordResetTokens; }
  set passwordResetTokens(v) { this.data.passwordResetTokens = v; }

  loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        if (fileContent && fileContent.trim().length > 0) {
          const parsed = JSON.parse(fileContent);
          this.data = {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            villas: Array.isArray(parsed.villas) ? parsed.villas : [],
            rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
            amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
            gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
            bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
            guests: Array.isArray(parsed.guests) ? parsed.guests : [],
            availabilities: Array.isArray(parsed.availabilities) ? parsed.availabilities : [],
            pricingRules: Array.isArray(parsed.pricingRules) ? parsed.pricingRules : [],
            coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
            payments: Array.isArray(parsed.payments) ? parsed.payments : [],
            invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
            cancellations: Array.isArray(parsed.cancellations) ? parsed.cancellations : [],
            refunds: Array.isArray(parsed.refunds) ? parsed.refunds : [],
            reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
            contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [],
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
            passwordResetTokens: Array.isArray(parsed.passwordResetTokens) ? parsed.passwordResetTokens : [],
          };
          this.initialized = true;
          return;
        }
      }
    } catch (err) {
      console.error('[PersistentStore] Error loading DB from disk:', err);
    }

    // If no existing db file or error, seed default initial data and save
    this.seedInitialData();
  }

  saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DB_FILE, serialized, 'utf-8');
    } catch (err) {
      console.error('[PersistentStore] Error saving DB to disk:', err);
    }
  }

  seedInitialData() {
    const villa = {
      id: 'villa-suroor-main',
      name: 'Suroor Villa',
      slug: 'suroor-villa',
      description:
        'A private three-bedroom sanctuary set amid the pine valleys of Kashmir. Floor-to-ceiling glass frames the Himalayan ridge, while interiors balance Kashmiri craft with quiet, modern comfort.',
      tagline: 'A private three-bedroom retreat in the pine valleys of Kashmir',
      maxGuests: 6,
      bedroomsCount: 3,
      bathroomsCount: 3,
      basePrice: getEntireVillaPrice(),
      cleaningFee: 0,
      serviceFee: 0,
      taxRate: 0,
      address: 'Gulmarg Road, Tangmarg',
      city: 'Gulmarg',
      state: 'Jammu & Kashmir',
      country: 'India',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const rooms = [
      {
        id: 'room-1',
        villaId: 'villa-suroor-main',
        name: 'The Master Suite',
        type: 'Master Suite',
        description: 'King bed, private balcony, fireplace & soaking tub with mountain views',
        capacity: 2,
        bedType: 'King bed',
        pricePerNight: getRoomPrice('room-1'),
        imageUrl: '/images/bedroom/bedroom1.webp',
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'room-2',
        villaId: 'villa-suroor-main',
        name: 'The Pine Suite',
        type: 'Deluxe Suite',
        description: 'Deluxe king room framed by pine forest views and marble bath',
        capacity: 2,
        bedType: 'King bed',
        pricePerNight: getRoomPrice('room-2'),
        imageUrl: '/images/bedroom/bedroom2.jpg',
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'room-3',
        villaId: 'villa-suroor-main',
        name: 'The Garden Room',
        type: 'Garden Suite',
        description: 'Flexible twin-to-king room opening onto the herb garden',
        capacity: 2,
        bedType: 'Twin / King',
        pricePerNight: getRoomPrice('room-3'),
        imageUrl: '/images/bedroom/bedroom_(2).jpg',
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const pricingRules: Rule[] = [
      {
        id: 'rule-base-1',
        villaId: 'villa-suroor-main',
        name: 'Standard Nightly Rate',
        ruleType: 'BASE',
        priority: 1,
        minStayNights: 1,
        extraGuestFee: 2500,
        isActive: true,
      },
      {
        id: 'rule-weekend-1',
        villaId: 'villa-suroor-main',
        name: 'Weekend Surcharge',
        ruleType: 'WEEKEND',
        priority: 10,
        priceMultiplier: 1.15,
        minStayNights: 1,
        isWeekendRule: true,
        isActive: true,
      },
      {
        id: 'rule-season-winter',
        villaId: 'villa-suroor-main',
        name: 'Kashmir Winter Snow Peak Season',
        ruleType: 'SEASONAL',
        priority: 20,
        startDate: '2026-12-15',
        endDate: '2027-02-28',
        priceMultiplier: 1.3,
        minStayNights: 3,
        isActive: true,
      },
    ];

    const coupons: CouponData[] = [
      {
        id: 'cpn-1',
        code: 'WELCOME10',
        description: '10% OFF Welcome discount for first-time guests',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minBookingValue: 40000,
        maxDiscount: 10000,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        usageLimit: 100,
        usedCount: 5,
        isActive: true,
      },
      {
        id: 'cpn-2',
        code: 'KASHMIR5000',
        description: 'Flat ₹5,000 off on stays of 3 nights or more',
        discountType: 'FIXED',
        discountValue: 5000,
        minBookingValue: 80000,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        usageLimit: 50,
        usedCount: 2,
        isActive: true,
      },
    ];

    const adminUser = {
      id: 'usr-admin-101',
      email: 'admin@suroorvilla.in',
      passwordHash: '$2a$10$wE99VbCszZc2aCj6WvJ64.aR7X0f1l1ZkWgNrkx0d1.8pLg3n9uOm',
      fullName: 'Suroor Villa Estate Manager',
      phone: '+91 98765 43210',
      isVerified: true,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const guestUser = {
      id: 'usr-guest-101',
      email: 'guest@example.com',
      passwordHash: '$2a$10$1rYd8P9qf7Y5t6w4x3z21.9n4a8b7c6d5e4f3g2h1i0j9k8l7m6nO',
      fullName: 'Vikramaditya Sharma',
      phone: '+91 98111 22334',
      isVerified: true,
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initial sample booking (Sept 1 to Sept 5, 2026)
    const sampleBooking = {
      id: 'bk-1001',
      referenceCode: 'SUR-2026-8819',
      userId: guestUser.id,
      villaId: villa.id,
      roomId: null,
      checkIn: '2026-09-01T14:00:00.000Z',
      checkOut: '2026-09-05T11:00:00.000Z',
      nights: 4,
      guestCount: 4,
      adults: 4,
      children: 0,
      baseAmount: 180000,
      extraGuestFee: 0,
      cleaningFee: 3500,
      serviceFee: 9000,
      discountAmount: 10000,
      taxAmount: 32850,
      totalAmount: 215350,
      currency: 'INR',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      notes: 'Anniversary retreat in Kashmir.',
      internalNotes: 'VIP guest. Complementary Kahwa tea service requested.',
      couponId: 'cpn-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sampleGuest = {
      id: 'gst-1001',
      bookingId: 'bk-1001',
      fullName: 'Vikramaditya Sharma',
      email: 'guest@example.com',
      phone: '+91 98111 22334',
      isPrimary: true,
      createdAt: new Date().toISOString(),
    };

    const samplePayment = {
      id: 'pay-1001',
      bookingId: 'bk-1001',
      transactionId: 'TXN-SUR-2026-0901',
      amount: 215350,
      currency: 'INR',
      method: 'CREDIT_CARD',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    const sampleInvoice = {
      id: 'inv-1001',
      invoiceNumber: 'INV-2026-001',
      bookingId: 'bk-1001',
      subtotal: 182500,
      taxAmount: 32850,
      totalAmount: 215350,
      status: 'PAID',
      issuedAt: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const reviews = [
      {
        id: 'rev-1',
        villaId: villa.id,
        guestName: 'Priya & Rohan Malhotra',
        rating: 5,
        comment:
          'Suroor Villa is an absolute paradise. Waking up to the morning mist over the pine valley with fresh Kashmir Kahwa prepared by Chef Ghulam was unforgettable.',
        isVerified: true,
        isApproved: true,
        createdAt: '2026-07-20T10:00:00.000Z',
      },
      {
        id: 'rev-2',
        villaId: villa.id,
        guestName: 'Karan Mehra',
        rating: 5,
        comment:
          'The floor-to-ceiling glass in the Master Suite gives you front-row Himalayan views. Immaculate hospitality and high-speed Wi-Fi even in the mountains.',
        isVerified: true,
        isApproved: true,
        createdAt: '2026-08-01T14:30:00.000Z',
      },
    ];

    const auditLogs = [
      {
        id: 'log-1',
        userId: adminUser.id,
        action: 'INITIALIZE_SYSTEM',
        entity: 'System',
        entityId: 'suroor-system',
        details: 'Initial booking infrastructure and seed database initialized.',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
      },
    ];

    this.data = {
      users: [adminUser, guestUser],
      villas: [villa],
      rooms,
      amenities: [],
      gallery: [],
      bookings: [],
      guests: [],
      availabilities: [],
      pricingRules,
      coupons,
      payments: [],
      invoices: [],
      cancellations: [],
      refunds: [],
      reviews,
      notifications: [],
      contactMessages: [],
      auditLogs,
      passwordResetTokens: [],
    };

    this.initialized = true;
    this.saveToDisk();
  }

  async initSeed() {
    const adminPass = await hashPassword('Admin@123456');
    const guestPass = await hashPassword('Guest@123456');

    let updated = false;
    let adminUser = this.data.users.find((u) => u.email && u.email.toLowerCase() === 'admin@suroorvilla.in');
    if (!adminUser) {
      adminUser = {
        id: 'usr-admin-101',
        email: 'admin@suroorvilla.in',
        passwordHash: adminPass,
        fullName: 'Suroor Villa Estate Manager',
        phone: '+91 98765 43210',
        isVerified: true,
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.users.push(adminUser);
      updated = true;
    } else {
      const isInvalid = !adminUser.passwordHash || adminUser.passwordHash.length < 50 || adminUser.passwordHash.includes('w4r6Wp8OaG1O9Qf77c8eAe3m5g6N8v9w0x1y2z3a4b5c6d7e8f9g0');
      if (isInvalid) {
        adminUser.passwordHash = adminPass;
        updated = true;
      }
    }

    let guestUser = this.data.users.find((u) => u.email && u.email.toLowerCase() === 'guest@example.com');
    if (!guestUser) {
      guestUser = {
        id: 'usr-guest-101',
        email: 'guest@example.com',
        passwordHash: guestPass,
        fullName: 'Vikramaditya Sharma',
        phone: '+91 98111 22334',
        isVerified: true,
        role: 'CUSTOMER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.users.push(guestUser);
      updated = true;
    } else {
      const isInvalid = !guestUser.passwordHash || guestUser.passwordHash.length < 50 || guestUser.passwordHash.includes('w4r6Wp8OaG1O9Qf77c8eAe3m5g6N8v9w0x1y2z3a4b5c6d7e8f9g0');
      if (isInvalid) {
        guestUser.passwordHash = guestPass;
        updated = true;
      }
    }

    this.initialized = true;
    if (updated) {
      this.saveToDisk();
    }
  }
}

export const memStore = new PersistentStore();

export async function initDataStore() {
  await memStore.initSeed();
}

initDataStore().catch(() => {});

export const dataStore = {
  // USER & AUTH
  async findUserByEmail(email: string) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.user.findUnique({
          where: { email: cleanEmail },
          include: { role: true },
        });
      }
    } catch {}
    return memStore.users.find((u) => u.email.toLowerCase().trim() === cleanEmail) || null;
  },

  async findUserById(id: string) {
    if (!id) return null;
    try {
      if (process.env.DATABASE_URL) {
        return await prisma.user.findUnique({
          where: { id },
          include: { role: true },
        });
      }
    } catch {}
    return memStore.users.find((u) => u.id === id) || null;
  },

  async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role?: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  }) {
    const cleanEmail = data.email.trim().toLowerCase();
    const role = data.role || 'CUSTOMER';
    const newUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      passwordHash: data.passwordHash,
      fullName: data.fullName.trim(),
      phone: data.phone || null,
      isVerified: true,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (process.env.DATABASE_URL) {
        let roleRecord = await prisma.role.findFirst({ where: { name: role as any } });
        if (!roleRecord) {
          roleRecord = await prisma.role.create({ data: { name: role as any } });
        }
        return await prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash: data.passwordHash,
            fullName: data.fullName.trim(),
            phone: data.phone,
            isVerified: true,
            roleId: roleRecord.id,
          },
        });
      }
    } catch {}

    memStore.users.push(newUser);
    memStore.saveToDisk();
    return newUser;
  },

  async updateUserPassword(userId: string, newPasswordHash: string) {
    const user = memStore.users.find((u) => u.id === userId);
    if (user) {
      user.passwordHash = newPasswordHash;
      user.updatedAt = new Date().toISOString();
      memStore.saveToDisk();
    }
    try {
      if (process.env.DATABASE_URL) {
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: newPasswordHash },
        });
      }
    } catch {}
    return user || null;
  },

  // PASSWORD RESET TOKEN MANAGEMENT
  async createPasswordResetToken(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const resetRecord = {
      id: `prt-${Date.now()}`,
      token,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    };

    memStore.passwordResetTokens.push(resetRecord);
    memStore.saveToDisk();

    return {
      token,
      expiresAt,
      user,
    };
  },

  async verifyPasswordResetToken(token: string) {
    if (!token) return { valid: false, error: 'Token is required.' };

    const record = memStore.passwordResetTokens.find((r) => r.token === token);
    if (!record) {
      return { valid: false, error: 'Invalid or unrecognized reset token.' };
    }

    if (record.used) {
      return { valid: false, error: 'This password reset link has already been used.' };
    }

    const isExpired = new Date(record.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return { valid: false, error: 'This password reset link has expired. Please request a new one.' };
    }

    return { valid: true, record };
  },

  async consumePasswordResetToken(token: string, newPasswordHash: string) {
    const verification = await this.verifyPasswordResetToken(token);
    if (!verification.valid || !verification.record) {
      return { success: false, error: verification.error || 'Invalid reset token.' };
    }

    const record = verification.record;
    record.used = true;
    record.usedAt = new Date().toISOString();

    await this.updateUserPassword(record.userId, newPasswordHash);

    this.addAuditLog({
      userId: record.userId,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: record.userId,
      details: `Password reset successfully completed for ${record.email} via secure token.`,
    });

    memStore.saveToDisk();
    return { success: true, message: 'Password has been successfully updated.' };
  },

  // VILLAS & ROOMS
  async getVilla(idOrSlug = 'villa-suroor-main') {
    try {
      if (process.env.DATABASE_URL) {
        const dbVilla = await prisma.villa.findFirst({
          where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
          include: { rooms: true, amenities: true, gallery: true },
        });
        if (dbVilla) return dbVilla;
      }
    } catch {}

    const v = memStore.villas[0] || {
      id: 'villa-suroor-main',
      name: 'Suroor Villa',
      basePrice: 45000,
    };
    return {
      ...v,
      rooms: memStore.rooms,
      amenities: memStore.amenities,
      gallery: memStore.gallery,
    };
  },

  // AVAILABILITY CHECK
  // Rule 1: A booking occupies nights from check-in up to, but not including, check-out date [checkIn, checkOut).
  // Rule 2: Check-out date is not considered occupied. Another guest may check in on the checkout date (same-day turnover).
  // Rule 3: Two half-open intervals [targetIn, targetOut) and [bIn, bOut) overlap iff: targetIn < bOut AND targetOut > bIn.
  // Rule 4: If dates overlap, return message: "Not available for these dates."
  // Rule 5: If dates do not overlap, return message: "Available."
  async checkAvailability(villaId: string, checkIn: string, checkOut: string, roomId?: string) {
    const targetIn = normalizeDateOnly(checkIn);
    const targetOut = normalizeDateOnly(checkOut);
    const now = new Date().getTime();

    if (!targetIn || !targetOut || targetIn >= targetOut) {
      return {
        available: false,
        message: 'Not available for these dates.',
        reason: 'Check-out date must be after check-in date.',
      };
    }

    // 1. Check manually blocked dates in Availability table
    const blockedDates = memStore.availabilities.filter((a) => {
      if (a.villaId !== villaId || !a.isBlocked) return false;
      const d = normalizeDateOnly(a.date);
      return d >= targetIn && d < targetOut;
    });

    if (blockedDates.length > 0) {
      return {
        available: false,
        message: 'Not available for these dates.',
        reason: 'Selected dates include maintenance or management blocked dates.',
      };
    }

    // 2. Check existing confirmed or active paid bookings ONLY
    const overlappingBookings = memStore.bookings.filter((b) => {
      if (b.villaId !== villaId) return false;

      // Only CONFIRMED bookings or PAID bookings occupy dates
      if (b.status !== 'CONFIRMED' && b.paymentStatus !== 'PAID') return false;

      // Check room matching:
      // If either reservation is for the entire villa (no roomId or 'entire-villa'), they conflict
      // If both specify different individual rooms, they do not conflict
      if (roomId && b.roomId && roomId !== 'entire-villa' && b.roomId !== 'entire-villa' && b.roomId !== roomId) {
        return false;
      }

      const bIn = normalizeDateOnly(b.checkIn);
      const bOut = normalizeDateOnly(b.checkOut);

      if (!bIn || !bOut) return false;

      // Standard hotel interval overlap test: [targetIn, targetOut) intersects [bIn, bOut)
      // targetIn < bOut AND targetOut > bIn
      return targetIn < bOut && targetOut > bIn;
    });

    if (overlappingBookings.length > 0) {
      return {
        available: false,
        message: 'Not available for these dates.',
        reason: 'Selected dates overlap with an existing reservation.',
      };
    }

    return {
      available: true,
      message: 'Available.',
    };
  },

  // GET BOOKED & BLOCKED DATE RANGES FOR CALENDARS
  async getBookedDateRanges(villaId: string = 'villa-suroor-main', roomId?: string) {
    const now = new Date().getTime();
    const activeBookings = memStore.bookings.filter((b) => {
      if (b.villaId !== villaId) return false;
      if (roomId && b.roomId && roomId !== 'entire-villa' && b.roomId !== 'entire-villa' && b.roomId !== roomId) {
        return false;
      }
      if (b.status === 'CANCELLED' || b.status === 'REFUNDED') return false;
      if (b.status === 'PENDING' && b.lockExpiresAt) {
        if (new Date(b.lockExpiresAt).getTime() < now) return false;
      }
      return true;
    });

    const blockedDates = memStore.availabilities
      .filter((a) => a.villaId === villaId && a.isBlocked)
      .map((a) => ({ date: normalizeDateOnly(a.date), reason: a.notes || 'Management Block' }));

    return {
      bookedRanges: activeBookings.map((b) => ({
        id: b.id,
        referenceCode: b.referenceCode,
        checkIn: normalizeDateOnly(b.checkIn),
        checkOut: normalizeDateOnly(b.checkOut),
        status: b.status,
        roomId: b.roomId,
      })),
      blockedDates,
    };
  },

  // CENTRALIZED PRICING CONFIGURATION HELPERS
  syncAccommodations(accommodations: { id: string; base_price_per_night: number }[]): void {
    const entireVilla = accommodations.find((a) => a.id === 'entire-villa');
    if (entireVilla && memStore.villas[0]) {
      memStore.villas[0].basePrice = entireVilla.base_price_per_night;
    }
    accommodations.forEach((acc) => {
      const room = memStore.rooms.find((r) => r.id === acc.id);
      if (room) {
        room.pricePerNight = acc.base_price_per_night;
      }
    });
  },

  getPricingConfig(): PricingConfig {
    const villa = memStore.villas[0];
    const roomPrices: Record<string, number> = {};
    memStore.rooms.forEach((r) => {
      roomPrices[r.id] = r.pricePerNight || 0;
    });

    return {
      roomPricePerNight: memStore.rooms[0]?.pricePerNight || 0,
      entireVillaPricePerNight: villa?.basePrice || 0,
      currency: 'INR',
      currencySymbol: '₹',
      roomPrices: {
        'room-1': roomPrices['room-1'] || 0,
        'room-2': roomPrices['room-2'] || 0,
        'room-3': roomPrices['room-3'] || 0,
        'entire-villa': villa?.basePrice || 0,
        ...roomPrices,
      },
    };
  },

  async updatePricingConfig(newConfig: {
    roomPricePerNight?: number;
    entireVillaPricePerNight?: number;
    roomPrices?: Record<string, number>;
  }): Promise<PricingConfig> {
    if (newConfig.entireVillaPricePerNight !== undefined && newConfig.entireVillaPricePerNight > 0) {
      const vPrice = Number(newConfig.entireVillaPricePerNight);
      if (memStore.villas[0]) {
        memStore.villas[0].basePrice = vPrice;
        memStore.villas[0].updatedAt = new Date().toISOString();
      }
      AccommodationService.updateAccommodationPrice('entire-villa', vPrice).catch((e) =>
        console.warn('Supabase sync entire-villa price notice:', e.message)
      );
    }

    if (newConfig.roomPricePerNight !== undefined && newConfig.roomPricePerNight > 0) {
      const perRoom = Number(newConfig.roomPricePerNight);
      memStore.rooms.forEach((r) => {
        r.pricePerNight = perRoom;
        r.updatedAt = new Date().toISOString();
        AccommodationService.updateAccommodationPrice(r.id, perRoom).catch((e) =>
          console.warn(`Supabase sync ${r.id} price notice:`, e.message)
        );
      });
    }

    if (newConfig.roomPrices) {
      Object.entries(newConfig.roomPrices).forEach(([rId, price]) => {
        const room = memStore.rooms.find((r) => r.id === rId);
        if (room && Number(price) > 0) {
          const numPrice = Number(price);
          room.pricePerNight = numPrice;
          room.updatedAt = new Date().toISOString();
          AccommodationService.updateAccommodationPrice(rId, numPrice).catch((e) =>
            console.warn(`Supabase sync ${rId} price notice:`, e.message)
          );
        }
      });
    }

    this.addAuditLog({
      userId: 'ADMIN',
      action: 'UPDATE_PRICING_CONFIG',
      entity: 'Pricing',
      details: `Updated pricing: Room ₹${newConfig.roomPricePerNight || 'same'}, Villa ₹${newConfig.entireVillaPricePerNight || 'same'}`,
    });

    memStore.saveToDisk();
    return this.getPricingConfig();
  },

  // PRICING CALCULATION WITH AVAILABILITY INTEGRATION & SUPABASE PRICING
  async getPricingQuote(input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    couponCode?: string;
    roomId?: string;
  }): Promise<PricingQuote & { isAvailable: boolean; message: string }> {
    const isEntireVilla = !input.roomId || input.roomId === 'entire-villa' || input.roomId === 'villa-suroor-main';
    const targetAccommodationId = isEntireVilla ? 'entire-villa' : input.roomId!;

    // 1. Retrieve the authoritative accommodation from Supabase
    const accommodation = await AccommodationService.getAccommodationById(targetAccommodationId);

    if (!accommodation || !accommodation.is_active) {
      return {
        villaId: input.villaId,
        roomId: input.roomId,
        accommodationName: isEntireVilla ? 'Entire Villa' : 'Selected Suite',
        nightlyRate: 0,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights: 0,
        guestCount: input.guestCount,
        baseNightlySum: 0,
        extraGuestFee: 0,
        cleaningFee: 0,
        serviceFee: 0,
        subtotal: 0,
        discountAmount: 0,
        taxableAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: 'INR',
        minStaySatisfied: false,
        minStayNights: 1,
        maxStaySatisfied: true,
        dayBreakdown: [],
        isValid: false,
        isAvailable: false,
        message: 'The requested accommodation is currently unavailable or inactive.',
        validationError: 'The requested accommodation is currently unavailable or inactive.',
      };
    }

    let villaBasePrice: number | undefined;
    let roomBasePrice: number | undefined;

    if (isEntireVilla) {
      villaBasePrice = accommodation.base_price_per_night;
    } else {
      roomBasePrice = accommodation.base_price_per_night;
    }

    let couponData: CouponData | null = null;
    if (input.couponCode) {
      couponData =
        memStore.coupons.find(
          (c) => c.code.toUpperCase() === input.couponCode?.toUpperCase() && c.isActive
        ) || null;
    }

    const avail = await this.checkAvailability(
      input.villaId,
      input.checkIn,
      input.checkOut,
      input.roomId
    );

    const baseQuote = calculateBookingPrice({
      villaBasePrice,
      roomBasePrice,
      pricingRules: memStore.pricingRules,
      coupon: couponData,
      input,
    });

    if (!avail.available) {
      return {
        ...baseQuote,
        isValid: false,
        isAvailable: false,
        message: 'Not available for these dates.',
        validationError: 'Not available for these dates.',
      };
    }

    return {
      ...baseQuote,
      isAvailable: true,
      message: 'Available.',
    };
  },

  // CREATE BOOKING WITH SERVER-SIDE ATOMIC MUTEX LOCK & PERSISTENCE
  async createBooking(data: {
    villaId: string;
    roomId?: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    adults: number;
    children: number;
    primaryGuest: {
      fullName: string;
      email: string;
      phone: string;
      idType?: string;
      idNumber?: string;
    };
    additionalGuests?: { fullName: string; email?: string; phone?: string }[];
    notes?: string;
    couponCode?: string;
    userId?: string;
  }) {
    // Acquire mutex lock to prevent concurrent race conditions
    const unlock = await bookingMutex.lock();

    try {
      // 1. Re-check availability server-side under lock
      const avail = await this.checkAvailability(
        data.villaId,
        data.checkIn,
        data.checkOut,
        data.roomId
      );

      if (!avail.available) {
        throw new Error(avail.message || 'Not available for these dates.');
      }

      // 2. Server-side quote calculation
      const quote = await this.getPricingQuote({
        villaId: data.villaId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guestCount: data.guestCount,
        couponCode: data.couponCode,
        roomId: data.roomId,
      });

      if (!quote.isValid && !quote.isAvailable) {
        throw new Error(quote.validationError || 'Not available for these dates.');
      }

      const refCode = `SUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const lockExpiresAt = addMinutes(new Date(), 15).toISOString(); // 15-minute temporary payment hold lock

      const newBooking = {
        id: `bk-${Date.now()}`,
        referenceCode: refCode,
        userId: data.userId || null,
        villaId: data.villaId,
        roomId: data.roomId || null,
        checkIn: normalizeDateOnly(data.checkIn),
        checkOut: normalizeDateOnly(data.checkOut),
        nights: quote.nights,
        guestCount: data.guestCount,
        adults: data.adults,
        children: data.children,
        baseAmount: quote.baseNightlySum,
        extraGuestFee: quote.extraGuestFee,
        cleaningFee: quote.cleaningFee,
        serviceFee: quote.serviceFee,
        discountAmount: quote.discountAmount,
        taxAmount: quote.taxAmount,
        totalAmount: quote.totalAmount,
        currency: 'INR',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        notes: data.notes || null,
        internalNotes: null,
        lockExpiresAt,
        couponId: quote.couponCode ? memStore.coupons.find((c) => c.code === quote.couponCode)?.id : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const primaryGuest = {
        id: `gst-${Date.now()}-1`,
        bookingId: newBooking.id,
        fullName: data.primaryGuest.fullName,
        email: data.primaryGuest.email,
        phone: data.primaryGuest.phone,
        idType: data.primaryGuest.idType || null,
        idNumber: data.primaryGuest.idNumber || null,
        isPrimary: true,
        createdAt: new Date().toISOString(),
      };

      memStore.bookings.push(newBooking);
      memStore.guests.push(primaryGuest);

      if (data.additionalGuests) {
        data.additionalGuests.forEach((g, idx) => {
          memStore.guests.push({
            id: `gst-${Date.now()}-${idx + 2}`,
            bookingId: newBooking.id,
            fullName: g.fullName,
            email: g.email || data.primaryGuest.email,
            phone: g.phone || data.primaryGuest.phone,
            isPrimary: false,
            createdAt: new Date().toISOString(),
          });
        });
      }

      // Record audit log
      this.addAuditLog({
        userId: data.userId || 'GUEST',
        action: 'CREATE_BOOKING_HOLD',
        entity: 'Booking',
        entityId: newBooking.id,
        details: `Created reservation hold ${refCode} for ${primaryGuest.fullName} (${newBooking.checkIn} to ${newBooking.checkOut})`,
      });

      // Save updated state synchronously to durable disk
      memStore.saveToDisk();

      return { booking: newBooking, primaryGuest, quote };
    } finally {
      unlock();
    }
  },

  // CONFIRM BOOKING WITH VERIFIED PAYMENT
  async confirmPaymentAndBooking(data: {
    bookingId: string;
    transactionId: string;
    method: string;
    amount: number;
    gatewayResponse?: any;
  }) {
    const booking = memStore.bookings.find(
      (b) => b.id === data.bookingId || b.referenceCode === data.bookingId
    );

    if (!booking) throw new Error('Booking record not found.');

    // Duplicate confirmation guard (Idempotency)
    if (booking.status === 'CONFIRMED') {
      const existingPayment = memStore.payments.find(
        (p) => p.bookingId === booking.id && (p.transactionId === data.transactionId || booking.paymentTransactionId === data.transactionId)
      );
      if (existingPayment) {
        const invoice = memStore.invoices.find((i) => i.bookingId === booking.id);
        return { booking, payment: existingPayment, invoice: invoice || null };
      }
      throw new Error('Booking is already confirmed and paid under a different transaction.');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      throw new Error('This booking reservation hold was cancelled or refunded.');
    }

    if (data.amount < booking.totalAmount) {
      throw new Error(`Insufficient payment amount. Expected ₹${booking.totalAmount}`);
    }

    booking.status = 'CONFIRMED';
    booking.paymentStatus = 'PAID';
    booking.lockExpiresAt = null;
    booking.paymentTransactionId = data.transactionId;
    booking.paymentGateway = data.method;
    booking.paidAmount = data.amount;
    booking.updatedAt = new Date().toISOString();

    const payment = {
      id: `pay-${Date.now()}`,
      bookingId: booking.id,
      transactionId: data.transactionId,
      amount: data.amount,
      currency: 'INR',
      method: data.method,
      status: 'COMPLETED',
      gatewayResponse: JSON.stringify(data.gatewayResponse || {}),
      createdAt: new Date().toISOString(),
    };

    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      bookingId: booking.id,
      subtotal: booking.baseAmount + booking.extraGuestFee + booking.cleaningFee + booking.serviceFee - booking.discountAmount,
      taxAmount: booking.taxAmount,
      totalAmount: booking.totalAmount,
      status: 'PAID',
      issuedAt: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    memStore.payments.push(payment);
    memStore.invoices.push(invoice);

    this.addAuditLog({
      userId: booking.userId || 'GUEST',
      action: 'CONFIRM_PAYMENT',
      entity: 'Booking',
      entityId: booking.id,
      details: `Payment ₹${data.amount} confirmed via ${data.method}. Transaction: ${data.transactionId}`,
    });

    memStore.saveToDisk();

    return { booking, payment, invoice };
  },

  // RELEASE TEMPORARY BOOKING HOLD
  async releaseBookingHold(bookingId: string) {
    const booking = memStore.bookings.find(
      (b) => b.id === bookingId || b.referenceCode === bookingId
    );
    if (!booking) return null;
    if (booking.status === 'PENDING') {
      booking.status = 'CANCELLED';
      booking.lockExpiresAt = null;
      booking.updatedAt = new Date().toISOString();
      this.addAuditLog({
        userId: booking.userId || 'GUEST',
        action: 'RELEASE_BOOKING_HOLD',
        entity: 'Booking',
        entityId: booking.id,
        details: `Released temporary hold for booking ${booking.referenceCode}`,
      });
      memStore.saveToDisk();
    }
    return booking;
  },

  // RETRIEVE BOOKING BY ID OR REF
  getBookingById(idOrRef: string) {
    if (!idOrRef || typeof idOrRef !== 'string') return null;

    const query = idOrRef.trim().toUpperCase();
    const booking = memStore.bookings.find(
      (b) =>
        b.id === idOrRef ||
        (b.referenceCode && b.referenceCode.toUpperCase() === query)
    );
    if (!booking) return null;

    const villa = memStore.villas[0] || { id: 'villa-suroor-main', name: 'Suroor Villa' };
    const guests = memStore.guests.filter((g) => g.bookingId === booking.id);
    const primaryGuest = guests.find((g) => g.isPrimary) || guests[0];
    const payments = memStore.payments.filter((p) => p.bookingId === booking.id);
    const lastPayment = payments[payments.length - 1];
    const invoices = memStore.invoices.filter((i) => i.bookingId === booking.id);

    return {
      ...booking,
      customerName: primaryGuest?.fullName || 'Guest',
      customerEmail: primaryGuest?.email || 'guest@example.com',
      customerPhone: primaryGuest?.phone || '',
      paymentStatus: booking.paymentStatus || (booking.status === 'CONFIRMED' ? 'PAID' : booking.status === 'CANCELLED' ? 'REFUNDED' : 'PENDING'),
      paymentTransactionId: lastPayment?.transactionId || booking.paymentTransactionId || booking.transactionId || '',
      paymentGateway: lastPayment?.method || booking.paymentGateway || 'RAZORPAY',
      paidAmount: lastPayment?.amount || booking.paidAmount || booking.totalAmount,
      villa,
      guests,
      primaryGuest,
      payments,
      invoices,
    };
  },

  async getBooking(idOrRef: string) {
    return this.getBookingById(idOrRef);
  },

  // UPDATE BOOKING FIELDS
  updateBooking(bookingId: string, updates: Partial<any>) {
    if (!bookingId || typeof bookingId !== 'string') return null;

    const query = bookingId.trim().toUpperCase();
    const booking = memStore.bookings.find(
      (b) =>
        b.id === bookingId ||
        (b.referenceCode && b.referenceCode.toUpperCase() === query)
    );
    if (!booking) return null;

    Object.assign(booking, updates, { updatedAt: new Date().toISOString() });
    memStore.saveToDisk();
    return booking;
  },

  // CONTACT FORM & SPAM RATE LIMITING
  checkContactRateLimit(ip = '127.0.0.1'): boolean {
    const recentFromIp = memStore.contactMessages.filter((m) => {
      if (m.ip !== ip) return false;
      const diffMinutes = (Date.now() - new Date(m.createdAt).getTime()) / (1000 * 60);
      return diffMinutes < 10;
    });

    return recentFromIp.length < 5;
  },

  addContactMessage(msg: { name: string; email: string; phone?: string; subject?: string; message: string; ip?: string }) {
    const newMsg = {
      id: `msg-${Date.now()}`,
      name: msg.name,
      email: msg.email,
      phone: msg.phone || '',
      subject: msg.subject || 'General Inquiry',
      message: msg.message,
      ip: msg.ip || '127.0.0.1',
      status: 'UNREAD',
      createdAt: new Date().toISOString(),
    };

    memStore.contactMessages.unshift(newMsg);
    memStore.saveToDisk();
    return newMsg;
  },

  // USER PROFILE MANAGEMENT
  getUserProfile(userIdOrEmail: string) {
    if (!userIdOrEmail) return null;
    const clean = userIdOrEmail.trim().toLowerCase();
    const user = memStore.users.find(
      (u) => u.id === userIdOrEmail || (u.email && u.email.toLowerCase() === clean)
    );
    if (!user) return null;

    const userBookings = memStore.bookings.filter(
      (b) => b.userId === user.id || memStore.guests.some((g) => g.bookingId === b.id && g.email?.toLowerCase() === clean)
    );

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isVerified: user.isVerified ?? true,
      createdAt: user.createdAt,
      bookingsCount: userBookings.length,
    };
  },

  updateUserProfile(userIdOrEmail: string, data: { fullName?: string; phone?: string; passwordHash?: string }) {
    if (!userIdOrEmail) return null;
    const clean = userIdOrEmail.trim().toLowerCase();
    const user = memStore.users.find(
      (u) => u.id === userIdOrEmail || (u.email && u.email.toLowerCase() === clean)
    );
    if (!user) return null;

    if (data.fullName !== undefined && data.fullName.trim()) {
      user.fullName = data.fullName.trim();
    }
    if (data.phone !== undefined) {
      user.phone = data.phone.trim();
    }
    if (data.passwordHash) {
      user.passwordHash = data.passwordHash;
    }
    user.updatedAt = new Date().toISOString();

    memStore.saveToDisk();
    return this.getUserProfile(user.id);
  },

  // REVIEWS ENGINE
  listReviews() {
    return [...memStore.reviews];
  },

  addReview(rev: { villaId?: string; guestName: string; rating: number; comment: string; userEmail?: string }) {
    const newReview = {
      id: `rev-${Date.now()}`,
      villaId: rev.villaId || 'villa-suroor-main',
      guestName: rev.guestName,
      rating: rev.rating,
      comment: rev.comment,
      userEmail: rev.userEmail || '',
      isVerified: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };

    memStore.reviews.unshift(newReview);
    memStore.saveToDisk();
    return newReview;
  },

  // CANCEL BOOKING
  async cancelBooking(bookingId: string, reason: string, notes?: string, cancelledBy = 'CUSTOMER') {
    const booking = memStore.bookings.find(
      (b) => b.id === bookingId || b.referenceCode === bookingId
    );
    if (!booking) throw new Error('Booking not found');

    booking.status = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    booking.cancellationReason = reason;
    booking.updatedAt = new Date().toISOString();

    const cancellation = {
      id: `cnc-${Date.now()}`,
      bookingId: booking.id,
      reason,
      notes,
      refundAmount: booking.status === 'CONFIRMED' ? booking.totalAmount * 0.8 : 0,
      cancelledBy,
      createdAt: new Date().toISOString(),
    };

    memStore.cancellations.push(cancellation);

    this.addAuditLog({
      userId: cancelledBy,
      action: 'CANCEL_BOOKING',
      entity: 'Booking',
      entityId: booking.id,
      details: `Booking cancelled. Reason: ${reason}`,
    });

    memStore.saveToDisk();

    return { booking, cancellation };
  },

  // LIST BOOKINGS FOR ADMIN OR USER
  async listBookings(filters?: { userId?: string; status?: string; search?: string }) {
    let result = [...memStore.bookings];

    if (filters?.userId) {
      result = result.filter((b) => b.userId === filters.userId);
    }
    if (filters?.status) {
      result = result.filter((b) => b.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((b) => {
        const guest = memStore.guests.find((g) => g.bookingId === b.id && g.isPrimary);
        return (
          b.referenceCode.toLowerCase().includes(q) ||
          guest?.fullName.toLowerCase().includes(q) ||
          guest?.email.toLowerCase().includes(q)
        );
      });
    }

    return result.map((b) => {
      const guest = memStore.guests.find((g) => g.bookingId === b.id && g.isPrimary);
      const payments = memStore.payments.filter((p) => p.bookingId === b.id);
      const lastPayment = payments[payments.length - 1];
      const paymentStatus = b.paymentStatus || (b.status === 'CONFIRMED' ? 'PAID' : b.status === 'CANCELLED' ? 'REFUNDED' : 'PENDING');
      return {
        ...b,
        primaryGuest: guest,
        customerName: guest?.fullName || 'Guest',
        customerEmail: guest?.email || 'guest@example.com',
        customerPhone: guest?.phone || '',
        paymentStatus,
        paymentTransactionId: lastPayment?.transactionId || b.paymentTransactionId || '',
      };
    });
  },

  // AUDIT LOG HELPER
  addAuditLog(data: { userId?: string; action: string; entity: string; entityId?: string; details?: string; ipAddress?: string }) {
    memStore.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: data.userId || 'SYSTEM',
      action: data.action,
      entity: data.entity,
      entityId: data.entityId || null,
      details: data.details || null,
      ipAddress: data.ipAddress || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });
    memStore.saveToDisk();
  },
};
