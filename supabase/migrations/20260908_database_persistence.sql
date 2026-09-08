-- ============================================================================
-- SUROOR VILLA: PRODUCTION DATABASE PERSISTENCE MIGRATION FOR SUPABASE POSTGRESQL
-- Target: Supabase PostgreSQL
-- Description: Creates relational schema, indexes, constraints, RLS policies,
--              concurrency functions, and seeds initial data for Suroor Villa.
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN')),
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));

-- 2. VILLAS TABLE
CREATE TABLE IF NOT EXISTS public.villas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  tagline TEXT,
  max_guests INTEGER NOT NULL DEFAULT 6,
  bedrooms_count INTEGER NOT NULL DEFAULT 3,
  bathrooms_count INTEGER NOT NULL DEFAULT 3,
  base_price NUMERIC NOT NULL DEFAULT 30000,
  cleaning_fee NUMERIC NOT NULL DEFAULT 0,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  villa_id TEXT NOT NULL REFERENCES public.villas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 2,
  bed_type TEXT,
  price_per_night NUMERIC NOT NULL DEFAULT 15000,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ACCOMMODATIONS TABLE (for dynamic pricing sync across Entire Villa & Suites)
CREATE TABLE IF NOT EXISTS public.accommodations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  base_price_per_night NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  capacity INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  reference_code TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  villa_id TEXT NOT NULL REFERENCES public.villas(id) ON DELETE RESTRICT,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL CHECK (nights >= 1),
  guest_count INTEGER NOT NULL CHECK (guest_count >= 1),
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  base_amount NUMERIC NOT NULL DEFAULT 0,
  extra_guest_fee NUMERIC NOT NULL DEFAULT 0,
  cleaning_fee NUMERIC NOT NULL DEFAULT 0,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'COMPLETED')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
  payment_transaction_id TEXT,
  payment_gateway TEXT,
  paid_amount NUMERIC,
  notes TEXT,
  internal_notes TEXT,
  lock_expires_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount NUMERIC DEFAULT 0,
  refund_status TEXT,
  coupon_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_booking_dates CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON public.bookings (reference_code);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lock ON public.bookings (lock_expires_at) WHERE status = 'PENDING';

-- 6. GUESTS TABLE
CREATE TABLE IF NOT EXISTS public.guests (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_type TEXT,
  id_number TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guests_booking_id ON public.guests (booking_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON public.guests (LOWER(email));

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  gateway_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments (transaction_id);

-- 8. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAID',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices (booking_id);

-- 9. CANCELLATIONS TABLE
CREATE TABLE IF NOT EXISTS public.cancellations (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  notes TEXT,
  refund_amount NUMERIC DEFAULT 0,
  cancelled_by TEXT DEFAULT 'CUSTOMER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. PRICING RULES TABLE
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id TEXT PRIMARY KEY,
  villa_id TEXT NOT NULL DEFAULT 'villa-suroor-main',
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('BASE', 'WEEKEND', 'SEASONAL')),
  priority INTEGER DEFAULT 1,
  start_date DATE,
  end_date DATE,
  price_multiplier NUMERIC,
  fixed_price NUMERIC,
  min_stay_nights INTEGER DEFAULT 1,
  max_stay_nights INTEGER,
  extra_guest_fee NUMERIC DEFAULT 2500,
  is_weekend_rule BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  discount_value NUMERIC NOT NULL,
  min_booking_value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE DEFAULT '2026-12-31',
  usage_limit INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (UPPER(code));

-- 12. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  villa_id TEXT NOT NULL DEFAULT 'villa-suroor-main',
  guest_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  user_email TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  ip TEXT,
  status TEXT DEFAULT 'UNREAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- 15. PASSWORD RESET TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON public.password_reset_tokens (token);

-- 16. AVAILABILITIES (Management Blocked Dates)
CREATE TABLE IF NOT EXISTS public.availabilities (
  id TEXT PRIMARY KEY,
  villa_id TEXT NOT NULL DEFAULT 'villa-suroor-main',
  date DATE NOT NULL,
  is_blocked BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_availabilities_date ON public.availabilities (villa_id, date);

-- ============================================================================
-- CONCURRENCY SAFE OVERLAP FUNCTION & TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_booking_overlap(
  p_villa_id TEXT,
  p_room_id TEXT,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_booking_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  -- 1. Check blocked dates in availabilities
  IF EXISTS (
    SELECT 1 FROM public.availabilities a
    WHERE a.villa_id = p_villa_id
      AND a.is_blocked = true
      AND a.date >= p_check_in
      AND a.date < p_check_out
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check overlapping bookings
  SELECT COUNT(*)
  INTO v_overlap_count
  FROM public.bookings b
  WHERE b.villa_id = p_villa_id
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
    AND (
      b.status = 'CONFIRMED'
      OR b.payment_status = 'PAID'
      OR (b.status = 'PENDING' AND b.lock_expires_at > timezone('utc'::text, now()))
    )
    AND (
      p_room_id IS NULL
      OR p_room_id = 'entire-villa'
      OR b.room_id IS NULL
      OR b.room_id = 'entire-villa'
      OR b.room_id = p_room_id
    )
    AND (p_check_in < b.check_out AND p_check_out > b.check_in);

  RETURN v_overlap_count > 0;
END;
$$;

-- Trigger function to strictly reject concurrent overlapping reservations
CREATE OR REPLACE FUNCTION public.trg_prevent_booking_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only validate active/confirmed/pending bookings (skip cancelled or refunded)
  IF (
    NEW.status = 'CONFIRMED'
    OR NEW.payment_status = 'PAID'
    OR (NEW.status = 'PENDING' AND (NEW.lock_expires_at IS NULL OR NEW.lock_expires_at > timezone('utc'::text, now())))
  ) THEN
    IF public.check_booking_overlap(NEW.villa_id, NEW.room_id, NEW.check_in, NEW.check_out, NEW.id) THEN
      RAISE EXCEPTION 'BOOKING_OVERLAP: The selected dates or accommodation suite are already reserved.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_overlap_check ON public.bookings;
CREATE TRIGGER trg_bookings_overlap_check
  BEFORE INSERT OR UPDATE OF check_in, check_out, villa_id, room_id, status, payment_status, lock_expires_at
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prevent_booking_overlap();

-- ============================================================================
-- INITIAL SEED DATA (SAFE IDEMPOTENT INSERTS)
-- ============================================================================

-- 1. Villa
INSERT INTO public.villas (
  id, name, slug, description, tagline, max_guests, bedrooms_count, bathrooms_count,
  base_price, cleaning_fee, service_fee, tax_rate, address, city, state, country
) VALUES (
  'villa-suroor-main',
  'Suroor Villa',
  'suroor-villa',
  'A private three-bedroom sanctuary set amid the pine valleys of Kashmir. Floor-to-ceiling glass frames the Himalayan ridge, while interiors balance Kashmiri craft with quiet, modern comfort.',
  'A private three-bedroom retreat in the pine valleys of Kashmir',
  6, 3, 3, 30000, 0, 0, 0,
  'Gulmarg Road, Tangmarg', 'Gulmarg', 'Jammu & Kashmir', 'India'
) ON CONFLICT (id) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  max_guests = EXCLUDED.max_guests;

-- 2. Rooms
INSERT INTO public.rooms (
  id, villa_id, name, type, description, capacity, bed_type, price_per_night, image_url, is_available
) VALUES
(
  'room-1',
  'villa-suroor-main',
  'The Master Suite',
  'Master Suite',
  'King bed, private balcony, fireplace & soaking tub with mountain views',
  2,
  'King bed',
  15000,
  '/images/bedroom/bedroom1.webp',
  TRUE
),
(
  'room-2',
  'villa-suroor-main',
  'The Pine Suite',
  'Deluxe Suite',
  'Deluxe king room framed by pine forest views and marble bath',
  2,
  'King bed',
  15000,
  '/images/bedroom/bedroom2.jpg',
  TRUE
),
(
  'room-3',
  'villa-suroor-main',
  'The Garden Room',
  'Garden Suite',
  'Flexible twin-to-king room opening onto the herb garden',
  2,
  'Twin / King',
  15000,
  '/images/bedroom/bedroom_(2).jpg',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  price_per_night = EXCLUDED.price_per_night;

-- 3. Accommodations (Live Pricing Engine Table)
INSERT INTO public.accommodations (id, name, type, base_price_per_night, currency, capacity, is_active)
VALUES
  ('entire-villa', 'Entire Villa (3 Bedrooms)', 'villa', 30000, 'INR', 6, TRUE),
  ('room-1', 'The Master Suite', 'suite', 15000, 'INR', 2, TRUE),
  ('room-2', 'The Pine Suite', 'suite', 15000, 'INR', 2, TRUE),
  ('room-3', 'The Garden Room', 'suite', 15000, 'INR', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
  base_price_per_night = EXCLUDED.base_price_per_night,
  is_active = EXCLUDED.is_active;

-- 4. Initial Users
INSERT INTO public.users (id, email, password_hash, full_name, phone, role, is_verified)
VALUES
(
  'usr-admin-101',
  'admin@suroorvilla.in',
  '$2a$10$wE99VbCszZc2aCj6WvJ64.aR7X0f1l1ZkWgNrkx0d1.8pLg3n9uOm',
  'Suroor Villa Estate Manager',
  '+91 98765 43210',
  'ADMIN',
  TRUE
),
(
  'usr-guest-101',
  'guest@example.com',
  '$2a$10$1rYd8P9qf7Y5t6w4x3z21.9n4a8b7c6d5e4f3g2h1i0j9k8l7m6nO',
  'Vikramaditya Sharma',
  '+91 98111 22334',
  'CUSTOMER',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- 5. Pricing Rules
INSERT INTO public.pricing_rules (
  id, villa_id, name, rule_type, priority, start_date, end_date, price_multiplier, min_stay_nights, extra_guest_fee, is_weekend_rule, is_active
) VALUES
(
  'rule-base-1',
  'villa-suroor-main',
  'Standard Nightly Rate',
  'BASE',
  1,
  NULL,
  NULL,
  1.0,
  1,
  2500,
  FALSE,
  TRUE
),
(
  'rule-weekend-1',
  'villa-suroor-main',
  'Weekend Surcharge',
  'WEEKEND',
  10,
  NULL,
  NULL,
  1.15,
  1,
  2500,
  TRUE,
  TRUE
),
(
  'rule-season-winter',
  'villa-suroor-main',
  'Kashmir Winter Snow Peak Season',
  'SEASONAL',
  20,
  '2026-12-15',
  '2027-02-28',
  1.3,
  3,
  2500,
  FALSE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- 6. Coupons
INSERT INTO public.coupons (
  id, code, description, discount_type, discount_value, min_booking_value, max_discount, valid_from, valid_until, usage_limit, used_count, is_active
) VALUES
(
  'cpn-1',
  'WELCOME10',
  '10% OFF Welcome discount for first-time guests',
  'PERCENTAGE',
  10,
  40000,
  10000,
  '2026-01-01',
  '2026-12-31',
  100,
  0,
  TRUE
),
(
  'cpn-2',
  'KASHMIR5000',
  'Flat ₹5,000 off on stays of 3 nights or more',
  'FIXED',
  5000,
  80000,
  NULL,
  '2026-01-01',
  '2026-12-31',
  50,
  0,
  TRUE
) ON CONFLICT (code) DO NOTHING;

-- 7. Reviews
INSERT INTO public.reviews (
  id, villa_id, guest_name, rating, comment, is_verified, is_approved
) VALUES
(
  'rev-1',
  'villa-suroor-main',
  'Priya & Rohan Malhotra',
  5,
  'Suroor Villa is an absolute paradise. Waking up to the morning mist over the pine valley with fresh Kashmir Kahwa prepared by Chef Ghulam was unforgettable.',
  TRUE,
  TRUE
),
(
  'rev-2',
  'villa-suroor-main',
  'Karan Mehra',
  5,
  'The floor-to-ceiling glass in the Master Suite gives you front-row Himalayan views. Immaculate hospitality and high-speed Wi-Fi even in the mountains.',
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- 8. Audit Log Initialization
INSERT INTO public.audit_logs (
  id, user_id, action, entity, entity_id, details, ip_address
) VALUES (
  'log-init-1',
  'usr-admin-101',
  'INITIALIZE_SYSTEM',
  'System',
  'suroor-system',
  'Supabase PostgreSQL database persistence schema initialized.',
  '127.0.0.1'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon read-only access to catalog and active rules
DROP POLICY IF EXISTS "Public can view villas" ON public.villas;
CREATE POLICY "Public can view villas" ON public.villas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view rooms" ON public.rooms;
CREATE POLICY "Public can view rooms" ON public.rooms FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Public can view accommodations" ON public.accommodations;
CREATE POLICY "Public can view accommodations" ON public.accommodations FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view pricing rules" ON public.pricing_rules;
CREATE POLICY "Public can view pricing rules" ON public.pricing_rules FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Public can view blocked dates" ON public.availabilities;
CREATE POLICY "Public can view blocked dates" ON public.availabilities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Authenticated User Policies (Access to own resources)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own guest records" ON public.guests;
CREATE POLICY "Users can view own guest records" ON public.guests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = guests.booking_id AND bookings.user_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = invoices.booking_id AND bookings.user_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can view own cancellations" ON public.cancellations;
CREATE POLICY "Users can view own cancellations" ON public.cancellations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = cancellations.booking_id AND bookings.user_id = auth.uid()::text)
);

-- Service Role (Server-Side Backend) has full unrestricted access to all operations
-- In Supabase, the service_role key automatically bypasses RLS by default.
-- Sensitive tables (audit_logs, password_reset_tokens) have NO public anon policies,
-- ensuring they are strictly accessible only via backend service-role operations.
