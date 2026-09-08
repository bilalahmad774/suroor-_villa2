import { getSupabaseServerClient } from './supabaseServer';
import type {
  User,
  Villa,
  Room,
  Booking,
  Guest,
  Payment,
  Invoice,
  AuditLog,
  PricingRule,
  Coupon,
  Review,
  ContactMessage,
} from './dataStore';

/**
 * Helper to map snake_case database row to camelCase Booking object
 */
export function mapBookingFromDb(row: any, guests: any[] = [], payments: any[] = [], invoices: any[] = []): Booking {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    userId: row.user_id || undefined,
    villaId: row.villa_id,
    roomId: row.room_id || undefined,
    checkIn: typeof row.check_in === 'string' ? row.check_in.split('T')[0] : row.check_in,
    checkOut: typeof row.check_out === 'string' ? row.check_out.split('T')[0] : row.check_out,
    nights: Number(row.nights),
    guestCount: Number(row.guest_count),
    adults: Number(row.adults || 1),
    children: Number(row.children || 0),
    baseAmount: Number(row.base_amount || 0),
    extraGuestFee: Number(row.extra_guest_fee || 0),
    cleaningFee: Number(row.cleaning_fee || 0),
    serviceFee: Number(row.service_fee || 0),
    discountAmount: Number(row.discount_amount || 0),
    taxAmount: Number(row.tax_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    currency: row.currency || 'INR',
    status: row.status,
    paymentStatus: row.payment_status,
    paymentTransactionId: row.payment_transaction_id || undefined,
    paymentGateway: row.payment_gateway || undefined,
    paidAmount: row.paid_amount ? Number(row.paid_amount) : undefined,
    notes: row.notes || undefined,
    internalNotes: row.internal_notes || undefined,
    lockExpiresAt: row.lock_expires_at || undefined,
    cancellationReason: row.cancellation_reason || undefined,
    refundAmount: row.refund_amount ? Number(row.refund_amount) : undefined,
    refundStatus: row.refund_status || undefined,
    couponId: row.coupon_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    guests: guests.map(mapGuestFromDb),
    payments: payments.map(mapPaymentFromDb),
    invoices: invoices.map(mapInvoiceFromDb),
    customerName: guests[0]?.fullName || guests[0]?.full_name || undefined,
    customerEmail: guests[0]?.email || undefined,
    customerPhone: guests[0]?.phone || undefined,
  };
}

export function mapGuestFromDb(row: any): Guest {
  return {
    id: row.id,
    bookingId: row.booking_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    idType: row.id_type || undefined,
    idNumber: row.id_number || undefined,
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
  };
}

export function mapPaymentFromDb(row: any): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    transactionId: row.transaction_id,
    amount: Number(row.amount),
    currency: row.currency || 'INR',
    method: row.method,
    status: row.status,
    gatewayResponse: row.gateway_response || undefined,
    createdAt: row.created_at,
  };
}

export function mapInvoiceFromDb(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    bookingId: row.booking_id,
    subtotal: Number(row.subtotal),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    status: row.status,
    issuedAt: row.issued_at,
    dueDate: row.due_date || undefined,
    createdAt: row.created_at,
  };
}

export function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    phone: row.phone || undefined,
    role: row.role,
    isVerified: Boolean(row.is_verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPricingRuleFromDb(row: any): PricingRule {
  return {
    id: row.id,
    villaId: row.villa_id,
    name: row.name,
    ruleType: row.rule_type,
    priority: Number(row.priority || 1),
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    priceMultiplier: row.price_multiplier ? Number(row.price_multiplier) : undefined,
    fixedPrice: row.fixed_price ? Number(row.fixed_price) : undefined,
    minStayNights: Number(row.min_stay_nights || 1),
    maxStayNights: row.max_stay_nights ? Number(row.max_stay_nights) : undefined,
    extraGuestFee: Number(row.extra_guest_fee || 2500),
    isWeekendRule: Boolean(row.is_weekend_rule),
    isActive: Boolean(row.is_active),
  };
}

export function mapCouponFromDb(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description || '',
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minBookingValue: Number(row.min_booking_value || 0),
    maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    usageLimit: Number(row.usage_limit || 100),
    usedCount: Number(row.used_count || 0),
    isActive: Boolean(row.is_active),
  };
}

export function mapAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id || undefined,
    details: row.details || undefined,
    ipAddress: row.ip_address || undefined,
    createdAt: row.created_at,
  };
}

export function mapReviewFromDb(row: any): Review {
  return {
    id: row.id,
    villaId: row.villa_id,
    guestName: row.guest_name,
    rating: Number(row.rating),
    comment: row.comment,
    userEmail: row.user_email || undefined,
    isVerified: Boolean(row.is_verified),
    isApproved: Boolean(row.is_approved),
    createdAt: row.created_at,
  };
}

export class SupabaseDatabase {
  static isAvailable(): boolean {
    return getSupabaseServerClient() !== null;
  }

  // ==========================================================================
  // USERS & AUTH
  // ==========================================================================

  static async findUserByEmail(email: string): Promise<User | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error || !data) return null;
      return mapUserFromDb(data);
    } catch (err) {
      console.warn('[SupabaseDatabase] findUserByEmail error:', err);
      return null;
    }
  }

  static async findUserById(id: string): Promise<User | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return mapUserFromDb(data);
    } catch (err) {
      console.warn('[SupabaseDatabase] findUserById error:', err);
      return null;
    }
  }

  static async createUser(userData: {
    id?: string;
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role?: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
    isVerified?: boolean;
  }): Promise<User> {
    const supabase = getSupabaseServerClient();
    const id = userData.id || `usr-${Date.now()}`;
    const now = new Date().toISOString();

    const insertRow = {
      id,
      email: userData.email.trim().toLowerCase(),
      password_hash: userData.passwordHash,
      full_name: userData.fullName,
      phone: userData.phone || null,
      role: userData.role || 'CUSTOMER',
      is_verified: userData.isVerified ?? true,
      created_at: now,
      updated_at: now,
    };

    if (!supabase) {
      return mapUserFromDb(insertRow);
    }

    const { data, error } = await supabase
      .from('users')
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user in Supabase: ${error.message}`);
    }

    return mapUserFromDb(data);
  }

  static async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return !error;
  }

  static async getUserProfile(userIdOrEmail: string): Promise<any | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const isEmail = userIdOrEmail.includes('@');
    const query = supabase.from('users').select('id, email, full_name, phone, role, is_verified, created_at');

    const { data, error } = isEmail
      ? await query.eq('email', userIdOrEmail.toLowerCase()).maybeSingle()
      : await query.eq('id', userIdOrEmail).maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      phone: data.phone || '',
      role: data.role,
      isVerified: Boolean(data.is_verified),
      createdAt: data.created_at,
    };
  }

  static async updateUserProfile(userIdOrEmail: string, data: { fullName?: string; phone?: string }): Promise<any | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const isEmail = userIdOrEmail.includes('@');
    const updateData: any = { updated_at: new Date().toISOString() };
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const query = supabase.from('users').update(updateData).select('id, email, full_name, phone, role, is_verified, created_at');

    const { data: updated, error } = isEmail
      ? await query.eq('email', userIdOrEmail.toLowerCase()).maybeSingle()
      : await query.eq('id', userIdOrEmail).maybeSingle();

    if (error || !updated) return null;
    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.full_name,
      phone: updated.phone || '',
      role: updated.role,
      isVerified: Boolean(updated.is_verified),
      createdAt: updated.created_at,
    };
  }

  // ==========================================================================
  // PASSWORD RESET TOKENS
  // ==========================================================================

  static async createPasswordResetToken(email: string): Promise<{ token: string; user: { email: string; fullName: string } } | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const supabase = getSupabaseServerClient();
    const token = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    if (supabase) {
      await supabase.from('password_reset_tokens').insert({
        id: `tok-${Date.now()}`,
        token,
        user_id: user.id,
        email: user.email,
        full_name: user.fullName,
        expires_at: expiresAt,
        used: false,
      });
    }

    return { token, user: { email: user.email, fullName: user.fullName } };
  }

  static async verifyPasswordResetToken(token: string): Promise<{ valid: boolean; record?: any; error?: string }> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { valid: false, error: 'Database unavailable' };

    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, error: 'Invalid or non-existent token.' };
    }

    if (data.used) {
      return { valid: false, error: 'This password reset link has already been used.' };
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return { valid: false, error: 'This password reset link has expired. Please request a new one.' };
    }

    return {
      valid: true,
      record: {
        token: data.token,
        userId: data.user_id,
        email: data.email,
        fullName: data.full_name,
      },
    };
  }

  static async consumePasswordResetToken(token: string, newPasswordHash: string): Promise<{ success: boolean; error?: string }> {
    const verification = await this.verifyPasswordResetToken(token);
    if (!verification.valid || !verification.record) {
      return { success: false, error: verification.error || 'Invalid token.' };
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, error: 'Database connection unavailable' };

    // Update password
    await supabase
      .from('users')
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq('id', verification.record.userId);

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    return { success: true };
  }

  // ==========================================================================
  // VILLAS & ROOMS
  // ==========================================================================

  static async getVilla(idOrSlug = 'villa-suroor-main'): Promise<Villa | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('villas')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      tagline: data.tagline,
      maxGuests: Number(data.max_guests),
      bedroomsCount: Number(data.bedrooms_count),
      bathroomsCount: Number(data.bathrooms_count),
      basePrice: Number(data.base_price),
      cleaningFee: Number(data.cleaning_fee),
      serviceFee: Number(data.service_fee),
      taxRate: Number(data.tax_rate),
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async getRooms(villaId = 'villa-suroor-main'): Promise<Room[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('villa_id', villaId)
      .eq('is_available', true)
      .order('id', { ascending: true });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      villaId: r.villa_id,
      name: r.name,
      type: r.type,
      description: r.description,
      capacity: Number(r.capacity),
      bedType: r.bed_type,
      pricePerNight: Number(r.price_per_night),
      imageUrl: r.image_url,
      isAvailable: Boolean(r.is_available),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  // ==========================================================================
  // AVAILABILITY & CONCURRENT OVERLAP CHECK
  // ==========================================================================

  static async checkAvailability(
    villaId: string,
    checkIn: string,
    checkOut: string,
    roomId?: string,
    excludeBookingId?: string
  ): Promise<{ available: boolean; conflictDates: string[]; reason?: string }> {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return { available: true, conflictDates: [] };
    }

    const targetIn = checkIn.split('T')[0];
    const targetOut = checkOut.split('T')[0];

    try {
      // 1. Check blocked dates in availabilities table
      const { data: blockedData, error: blockErr } = await supabase
        .from('availabilities')
        .select('date')
        .eq('villa_id', villaId)
        .eq('is_blocked', true)
        .gte('date', targetIn)
        .lt('date', targetOut);

      if (!blockErr && blockedData && blockedData.length > 0) {
        return {
          available: false,
          conflictDates: blockedData.map((d: any) => d.date),
          reason: 'Selected dates include dates marked unavailable by the estate host.',
        };
      }

      // 2. Query bookings that are either:
      // - CONFIRMED or PAID
      // - OR PENDING with active lock_expires_at > now()
      const nowIso = new Date().toISOString();
      const { data: bookingsData, error: bookErr } = await supabase
        .from('bookings')
        .select('id, room_id, check_in, check_out, status, payment_status, lock_expires_at')
        .eq('villa_id', villaId)
        .lt('check_in', targetOut)
        .gt('check_out', targetIn);

      if (bookErr) {
        console.warn('[SupabaseDatabase] Availability check error:', bookErr.message);
        return { available: true, conflictDates: [] };
      }

      if (!bookingsData || bookingsData.length === 0) {
        return { available: true, conflictDates: [] };
      }

      const conflicts: string[] = [];

      for (const b of bookingsData) {
        if (excludeBookingId && b.id === excludeBookingId) continue;

        const isPaid = b.status === 'CONFIRMED' || b.payment_status === 'PAID';
        const isHoldActive = b.status === 'PENDING' && b.lock_expires_at && new Date(b.lock_expires_at).getTime() > Date.now();

        if (!isPaid && !isHoldActive) {
          continue; // Expired hold or cancelled
        }

        // Room conflict logic:
        // - Entire villa booking conflicts with everything.
        // - Booking a suite conflicts with entire villa or the same suite.
        const isTargetVilla = !roomId || roomId === 'entire-villa' || roomId === 'villa-suroor-main';
        const isExistingVilla = !b.room_id || b.room_id === 'entire-villa' || b.room_id === 'villa-suroor-main';

        const roomConflict = isTargetVilla || isExistingVilla || b.room_id === roomId;

        if (roomConflict) {
          const bIn = new Date(b.check_in);
          const bOut = new Date(b.check_out);
          const cur = new Date(bIn);
          while (cur < bOut) {
            const dateStr = cur.toISOString().split('T')[0];
            if (dateStr >= targetIn && dateStr < targetOut) {
              if (!conflicts.includes(dateStr)) conflicts.push(dateStr);
            }
            cur.setDate(cur.getDate() + 1);
          }
        }
      }

      if (conflicts.length > 0) {
        return {
          available: false,
          conflictDates: conflicts.sort(),
          reason: 'The selected dates or accommodation suite are already reserved.',
        };
      }

      return { available: true, conflictDates: [] };
    } catch (err: any) {
      console.warn('[SupabaseDatabase] checkAvailability exception:', err.message);
      return { available: true, conflictDates: [] };
    }
  }

  static async getBookedDateRanges(
    villaId = 'villa-suroor-main',
    roomId?: string
  ): Promise<{
    bookedRanges: Array<{ id?: string; referenceCode?: string; checkIn: string; checkOut: string; status: string; roomId?: string | null }>;
    blockedDates: Array<{ date: string; reason?: string }>;
  }> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { bookedRanges: [], blockedDates: [] };

    try {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('id, reference_code, check_in, check_out, status, payment_status, lock_expires_at, room_id')
        .eq('villa_id', villaId)
        .gte('check_out', new Date().toISOString().split('T')[0]);

      const bookedRanges: Array<{ id?: string; referenceCode?: string; checkIn: string; checkOut: string; status: string; roomId?: string | null }> = [];

      if (bookingData) {
        for (const b of bookingData) {
          const isPaid = b.status === 'CONFIRMED' || b.payment_status === 'PAID';
          const isHoldActive = b.status === 'PENDING' && b.lock_expires_at && new Date(b.lock_expires_at).getTime() > Date.now();

          if (isPaid || isHoldActive) {
            const isTargetVilla = !roomId || roomId === 'entire-villa';
            const isExistingVilla = !b.room_id || b.room_id === 'entire-villa';

            if (isTargetVilla || isExistingVilla || b.room_id === roomId) {
              bookedRanges.push({
                id: b.id,
                referenceCode: b.reference_code,
                checkIn: b.check_in,
                checkOut: b.check_out,
                status: isPaid ? 'CONFIRMED' : 'HOLD',
                roomId: b.room_id,
              });
            }
          }
        }
      }

      const { data: availData } = await supabase
        .from('availabilities')
        .select('date, notes, is_blocked')
        .eq('villa_id', villaId)
        .eq('is_blocked', true);

      const blockedDates = (availData || []).map((a: any) => ({
        date: a.date,
        reason: a.notes || 'Management Block',
      }));

      return { bookedRanges, blockedDates };
    } catch {
      return { bookedRanges: [], blockedDates: [] };
    }
  }

  // ==========================================================================
  // BOOKINGS CRUD & CONCURRENCY
  // ==========================================================================

  static async createBooking(bookingData: {
    bookingId: string;
    referenceCode: string;
    userId?: string;
    villaId: string;
    roomId?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guestCount: number;
    adults: number;
    children: number;
    baseAmount: number;
    extraGuestFee: number;
    cleaningFee: number;
    serviceFee: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    currency?: string;
    lockExpiresAt: string;
    notes?: string;
    couponId?: string;
    guest: {
      fullName: string;
      email: string;
      phone: string;
      idType?: string;
      idNumber?: string;
    };
    additionalGuests?: { fullName: string; email?: string; phone?: string }[];
  }): Promise<{ booking: Booking; guest: Guest }> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    const bookingRow = {
      id: bookingData.bookingId,
      reference_code: bookingData.referenceCode,
      user_id: bookingData.userId || null,
      villa_id: bookingData.villaId,
      room_id: bookingData.roomId || null,
      check_in: bookingData.checkIn.split('T')[0],
      check_out: bookingData.checkOut.split('T')[0],
      nights: bookingData.nights,
      guest_count: bookingData.guestCount,
      adults: bookingData.adults,
      children: bookingData.children,
      base_amount: bookingData.baseAmount,
      extra_guest_fee: bookingData.extraGuestFee,
      cleaning_fee: bookingData.cleaningFee,
      service_fee: bookingData.serviceFee,
      discount_amount: bookingData.discountAmount,
      tax_amount: bookingData.taxAmount,
      total_amount: bookingData.totalAmount,
      currency: bookingData.currency || 'INR',
      status: 'PENDING',
      payment_status: 'PENDING',
      lock_expires_at: bookingData.lockExpiresAt,
      notes: bookingData.notes || null,
      coupon_id: bookingData.couponId || null,
      created_at: now,
      updated_at: now,
    };

    const guestId = `gst-${Date.now()}`;
    const guestRow = {
      id: guestId,
      booking_id: bookingData.bookingId,
      full_name: bookingData.guest.fullName,
      email: bookingData.guest.email.toLowerCase(),
      phone: bookingData.guest.phone,
      id_type: bookingData.guest.idType || null,
      id_number: bookingData.guest.idNumber || null,
      is_primary: true,
      created_at: now,
    };

    if (!supabase) {
      const mappedGuest = mapGuestFromDb(guestRow);
      const mappedBooking = mapBookingFromDb(bookingRow, [mappedGuest]);
      return { booking: mappedBooking, guest: mappedGuest };
    }

    // 1. Insert Booking into Supabase
    const { data: insertedBooking, error: bookErr } = await supabase
      .from('bookings')
      .insert(bookingRow)
      .select()
      .single();

    if (bookErr) {
      throw new Error(`Failed to insert booking into Supabase: ${bookErr.message}`);
    }

    // 2. Insert Primary Guest into Supabase
    const { data: insertedGuest, error: guestErr } = await supabase
      .from('guests')
      .insert(guestRow)
      .select()
      .single();

    if (guestErr) {
      console.error('[SupabaseDatabase] Error inserting guest:', guestErr.message);
    }

    // 3. Insert Additional Guests if provided
    if (bookingData.additionalGuests && bookingData.additionalGuests.length > 0) {
      const additionalRows = bookingData.additionalGuests.map((ag, idx) => ({
        id: `gst-${Date.now()}-${idx + 2}`,
        booking_id: bookingData.bookingId,
        full_name: ag.fullName,
        email: (ag.email || bookingData.guest.email).toLowerCase(),
        phone: ag.phone || bookingData.guest.phone,
        is_primary: false,
        created_at: now,
      }));
      await supabase.from('guests').insert(additionalRows);
    }

    const mappedGuest = mapGuestFromDb(insertedGuest || guestRow);
    const mappedBooking = mapBookingFromDb(insertedBooking, [mappedGuest]);

    return { booking: mappedBooking, guest: mappedGuest };
  }

  static async confirmPaymentAndBooking(params: {
    bookingId: string;
    transactionId: string;
    method: string;
    amount: number;
    gatewayResponse?: any;
  }): Promise<{ booking: Booking; payment: Payment; invoice: Invoice }> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    const paymentId = `pay-${Date.now()}`;
    const paymentRow = {
      id: paymentId,
      booking_id: params.bookingId,
      transaction_id: params.transactionId,
      amount: params.amount,
      currency: 'INR',
      method: params.method,
      status: 'COMPLETED',
      gateway_response: params.gatewayResponse || null,
      created_at: now,
    };

    const invoiceId = `inv-${Date.now()}`;
    const invoiceNum = `INV-${new Date().getFullYear()}-${params.bookingId.slice(-6).toUpperCase()}`;
    const invoiceRow = {
      id: invoiceId,
      invoice_number: invoiceNum,
      booking_id: params.bookingId,
      subtotal: params.amount,
      tax_amount: 0,
      total_amount: params.amount,
      status: 'PAID',
      issued_at: now,
      created_at: now,
    };

    if (!supabase) {
      const dummyBooking: any = {
        id: params.bookingId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paidAmount: params.amount,
        paymentTransactionId: params.transactionId,
        updatedAt: now,
      };
      return {
        booking: dummyBooking,
        payment: mapPaymentFromDb(paymentRow),
        invoice: mapInvoiceFromDb(invoiceRow),
      };
    }

    // 1. Update Booking
    const { data: updatedBooking, error: bookErr } = await supabase
      .from('bookings')
      .update({
        status: 'CONFIRMED',
        payment_status: 'PAID',
        paid_amount: params.amount,
        payment_transaction_id: params.transactionId,
        payment_gateway: params.method,
        lock_expires_at: null,
        updated_at: now,
      })
      .eq('id', params.bookingId)
      .select()
      .single();

    if (bookErr) {
      throw new Error(`Failed to confirm booking payment in Supabase: ${bookErr.message}`);
    }

    // 2. Insert Payment
    const { data: insertedPayment, error: payErr } = await supabase
      .from('payments')
      .insert(paymentRow)
      .select()
      .single();

    if (payErr) {
      console.warn('[SupabaseDatabase] Warning inserting payment record:', payErr.message);
    }

    // 3. Insert Invoice
    const { data: insertedInvoice, error: invErr } = await supabase
      .from('invoices')
      .insert(invoiceRow)
      .select()
      .single();

    if (invErr) {
      console.warn('[SupabaseDatabase] Warning inserting invoice record:', invErr.message);
    }

    // 4. Fetch guests to build comprehensive booking object
    const { data: guestsData } = await supabase
      .from('guests')
      .select('*')
      .eq('booking_id', params.bookingId);

    const payment = mapPaymentFromDb(insertedPayment || paymentRow);
    const invoice = mapInvoiceFromDb(insertedInvoice || invoiceRow);
    const booking = mapBookingFromDb(
      updatedBooking,
      guestsData || [],
      [payment],
      [invoice]
    );

    return { booking, payment, invoice };
  }

  static async releaseBookingHold(bookingId: string): Promise<Booking | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancellation_reason: 'Hold expired or released prior to checkout.',
        lock_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('status', 'PENDING')
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return mapBookingFromDb(data);
  }

  static async getBookingById(idOrRef: string): Promise<Booking | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    try {
      const { data: bookingData, error: bookErr } = await supabase
        .from('bookings')
        .select('*')
        .or(`id.eq.${idOrRef},reference_code.eq.${idOrRef}`)
        .maybeSingle();

      if (bookErr || !bookingData) return null;

      const [guestsRes, paymentsRes, invoicesRes] = await Promise.all([
        supabase.from('guests').select('*').eq('booking_id', bookingData.id),
        supabase.from('payments').select('*').eq('booking_id', bookingData.id),
        supabase.from('invoices').select('*').eq('booking_id', bookingData.id),
      ]);

      return mapBookingFromDb(
        bookingData,
        guestsRes.data || [],
        paymentsRes.data || [],
        invoicesRes.data || []
      );
    } catch (err) {
      console.warn('[SupabaseDatabase] getBookingById error:', err);
      return null;
    }
  }

  static async listBookings(filter?: {
    userId?: string;
    status?: string;
    search?: string;
    email?: string;
    refCode?: string;
  }): Promise<Booking[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

      if (filter?.userId) {
        query = query.eq('user_id', filter.userId);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.refCode) {
        query = query.eq('reference_code', filter.refCode.toUpperCase());
      }

      const { data: bookingsData, error } = await query;
      if (error || !bookingsData || bookingsData.length === 0) return [];

      const bookingIds = bookingsData.map((b: any) => b.id);

      const [guestsRes, paymentsRes, invoicesRes] = await Promise.all([
        supabase.from('guests').select('*').in('booking_id', bookingIds),
        supabase.from('payments').select('*').in('booking_id', bookingIds),
        supabase.from('invoices').select('*').in('booking_id', bookingIds),
      ]);

      const guestsByBooking = new Map<string, any[]>();
      (guestsRes.data || []).forEach((g: any) => {
        const arr = guestsByBooking.get(g.booking_id) || [];
        arr.push(g);
        guestsByBooking.set(g.booking_id, arr);
      });

      const paymentsByBooking = new Map<string, any[]>();
      (paymentsRes.data || []).forEach((p: any) => {
        const arr = paymentsByBooking.get(p.booking_id) || [];
        arr.push(p);
        paymentsByBooking.set(p.booking_id, arr);
      });

      const invoicesByBooking = new Map<string, any[]>();
      (invoicesRes.data || []).forEach((i: any) => {
        const arr = invoicesByBooking.get(i.booking_id) || [];
        arr.push(i);
        invoicesByBooking.set(i.booking_id, arr);
      });

      let results = bookingsData.map((b: any) =>
        mapBookingFromDb(
          b,
          guestsByBooking.get(b.id) || [],
          paymentsByBooking.get(b.id) || [],
          invoicesByBooking.get(b.id) || []
        )
      );

      // Email filter
      if (filter?.email) {
        const emailLower = filter.email.toLowerCase();
        results = results.filter(
          (b) =>
            b.customerEmail?.toLowerCase() === emailLower ||
            b.guests?.some((g: any) => g.email.toLowerCase() === emailLower)
        );
      }

      // Search term filter
      if (filter?.search) {
        const term = filter.search.toLowerCase();
        results = results.filter(
          (b) =>
            b.referenceCode.toLowerCase().includes(term) ||
            b.customerName?.toLowerCase().includes(term) ||
            b.customerEmail?.toLowerCase().includes(term) ||
            b.guests?.some(
              (g: any) =>
                g.fullName.toLowerCase().includes(term) ||
                g.email.toLowerCase().includes(term) ||
                g.phone.includes(term)
            )
        );
      }

      return results;
    } catch (err) {
      console.warn('[SupabaseDatabase] listBookings error:', err);
      return [];
    }
  }

  static async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const rowUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) rowUpdates.status = updates.status;
    if (updates.paymentStatus !== undefined) rowUpdates.payment_status = updates.paymentStatus;
    if (updates.notes !== undefined) rowUpdates.notes = updates.notes;
    if (updates.internalNotes !== undefined) rowUpdates.internal_notes = updates.internalNotes;
    if (updates.cancellationReason !== undefined) rowUpdates.cancellation_reason = updates.cancellationReason;
    if (updates.refundAmount !== undefined) rowUpdates.refund_amount = updates.refundAmount;
    if (updates.refundStatus !== undefined) rowUpdates.refund_status = updates.refundStatus;

    const { data, error } = await supabase
      .from('bookings')
      .update(rowUpdates)
      .or(`id.eq.${bookingId},reference_code.eq.${bookingId}`)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return this.getBookingById(data.id);
  }

  static async cancelBooking(
    bookingId: string,
    reason: string,
    notes?: string,
    cancelledBy = 'CUSTOMER',
    refundAmount = 0
  ): Promise<{ booking: Booking; cancellation: any } | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const now = new Date().toISOString();

    const { data: updatedBooking, error: bookErr } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason,
        refund_amount: refundAmount,
        refund_status: refundAmount > 0 ? 'PENDING' : 'NOT_APPLICABLE',
        updated_at: now,
      })
      .eq('id', bookingId)
      .select()
      .maybeSingle();

    if (bookErr || !updatedBooking) return null;

    const cancellationId = `can-${Date.now()}`;
    const cancellationRow = {
      id: cancellationId,
      booking_id: bookingId,
      reason,
      notes: notes || null,
      refund_amount: refundAmount,
      cancelled_by: cancelledBy,
      created_at: now,
    };

    await supabase.from('cancellations').insert(cancellationRow);

    const fullBooking = await this.getBookingById(bookingId);
    return {
      booking: fullBooking || mapBookingFromDb(updatedBooking),
      cancellation: cancellationRow,
    };
  }

  // ==========================================================================
  // AUDIT LOGS
  // ==========================================================================

  static async addAuditLog(log: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const supabase = getSupabaseServerClient();
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const logRow = {
      id,
      user_id: log.userId || null,
      action: log.action,
      entity: log.entity,
      entity_id: log.entityId || null,
      details: log.details || null,
      ip_address: log.ipAddress || '127.0.0.1',
      created_at: now,
    };

    if (supabase) {
      try {
        await supabase.from('audit_logs').insert(logRow);
      } catch (err: any) {
        console.warn('[SupabaseDatabase] addAuditLog notice:', err?.message);
      }
    }

    return mapAuditLogFromDb(logRow);
  }

  static async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data.map(mapAuditLogFromDb);
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // PRICING RULES & COUPONS
  // ==========================================================================

  static async getPricingRules(): Promise<PricingRule[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error || !data) return [];
      return data.map(mapPricingRuleFromDb);
    } catch {
      return [];
    }
  }

  static async createPricingRule(ruleData: Partial<PricingRule>): Promise<PricingRule> {
    const supabase = getSupabaseServerClient();
    const id = ruleData.id || `rule-${Date.now()}`;
    const now = new Date().toISOString();

    const ruleRow = {
      id,
      villa_id: ruleData.villaId || 'villa-suroor-main',
      name: ruleData.name || 'Custom Pricing Rule',
      rule_type: ruleData.ruleType || 'SEASONAL',
      priority: ruleData.priority || 10,
      start_date: ruleData.startDate || null,
      end_date: ruleData.endDate || null,
      price_multiplier: ruleData.priceMultiplier || null,
      fixed_price: ruleData.fixedPrice || null,
      min_stay_nights: ruleData.minStayNights || 1,
      max_stay_nights: ruleData.maxStayNights || null,
      extra_guest_fee: ruleData.extraGuestFee || 2500,
      is_weekend_rule: Boolean(ruleData.isWeekendRule),
      is_active: ruleData.isActive !== false,
      created_at: now,
    };

    if (supabase) {
      await supabase.from('pricing_rules').insert(ruleRow);
    }

    return mapPricingRuleFromDb(ruleRow);
  }

  static async getCoupons(): Promise<Coupon[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapCouponFromDb);
    } catch {
      return [];
    }
  }

  static async createCoupon(couponData: Partial<Coupon>): Promise<Coupon> {
    const supabase = getSupabaseServerClient();
    const id = couponData.id || `cpn-${Date.now()}`;
    const now = new Date().toISOString();

    const couponRow = {
      id,
      code: (couponData.code || '').toUpperCase().trim(),
      description: couponData.description || null,
      discount_type: couponData.discountType || 'PERCENTAGE',
      discount_value: Number(couponData.discountValue || 0),
      min_booking_value: Number(couponData.minBookingValue || 0),
      max_discount: couponData.maxDiscount ? Number(couponData.maxDiscount) : null,
      valid_from: couponData.validFrom || new Date().toISOString().split('T')[0],
      valid_until: couponData.validUntil || '2026-12-31',
      usage_limit: Number(couponData.usageLimit || 100),
      used_count: 0,
      is_active: couponData.isActive !== false,
      created_at: now,
    };

    if (supabase) {
      await supabase.from('coupons').insert(couponRow);
    }

    return mapCouponFromDb(couponRow);
  }

  // ==========================================================================
  // REVIEWS & CONTACT
  // ==========================================================================

  static async listReviews(): Promise<Review[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapReviewFromDb);
    } catch {
      return [];
    }
  }

  static async addReview(reviewData: {
    villaId?: string;
    guestName: string;
    rating: number;
    comment: string;
    userEmail?: string;
  }): Promise<Review> {
    const supabase = getSupabaseServerClient();
    const id = `rev-${Date.now()}`;
    const now = new Date().toISOString();

    const reviewRow = {
      id,
      villa_id: reviewData.villaId || 'villa-suroor-main',
      guest_name: reviewData.guestName,
      rating: Math.min(5, Math.max(1, reviewData.rating)),
      comment: reviewData.comment,
      user_email: reviewData.userEmail || null,
      is_verified: true,
      is_approved: true,
      created_at: now,
    };

    if (supabase) {
      await supabase.from('reviews').insert(reviewRow);
    }

    return mapReviewFromDb(reviewRow);
  }

  static async addContactMessage(msg: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    ip?: string;
  }): Promise<ContactMessage> {
    const supabase = getSupabaseServerClient();
    const id = `msg-${Date.now()}`;
    const now = new Date().toISOString();

    const msgRow = {
      id,
      name: msg.name,
      email: msg.email.toLowerCase(),
      phone: msg.phone || null,
      subject: msg.subject || null,
      message: msg.message,
      ip: msg.ip || null,
      status: 'UNREAD',
      created_at: now,
    };

    if (supabase) {
      try {
        await supabase.from('contact_messages').insert(msgRow);
      } catch (err: any) {
        console.warn('[SupabaseDatabase] addContactMessage notice:', err?.message);
      }
    }

    return {
      id,
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      subject: msg.subject,
      message: msg.message,
      ip: msg.ip,
      status: 'UNREAD',
      createdAt: now,
    };
  }

  static async checkContactRateLimit(ip: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return true;

    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('ip', ip)
        .gte('created_at', tenMinutesAgo);

      if (!error && count !== null && count >= 5) {
        return false; // Limit exceeded
      }
      return true;
    } catch {
      return true;
    }
  }
}
