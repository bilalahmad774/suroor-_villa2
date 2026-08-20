// Centralized domain types for the Suroor Villa booking platform.
// These mirror the future Supabase schema and keep client/server code in sync.

export type UUID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // ISO 8601

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'refunded'
  | 'completed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentProvider = 'razorpay' | 'stripe';

export type RoomCategory =
  | 'master'
  | 'deluxe'
  | 'garden'
  | 'attic';

export interface Room {
  id: UUID;
  name: string;
  category: RoomCategory;
  description: string;
  capacity: number;
  basePricePerNight: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  bedType: string;
  bathroom: string;
  view: string;
  size: string;
}

export interface Booking {
  id: UUID;
  userId: UUID;
  roomId: UUID;
  checkIn: ISODate;
  checkOut: ISODate;
  guests: number;
  nights: number;
  subtotal: number;
  taxes: number;
  total: number;
  status: BookingStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Payment {
  id: UUID;
  bookingId: UUID;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: ISODateTime;
}

export interface Review {
  id: UUID;
  bookingId: UUID;
  userId: UUID;
  rating: number; // 1-5
  title: string;
  body: string;
  isPublished: boolean;
  createdAt: ISODateTime;
}

export interface AvailabilitySlot {
  roomId: UUID;
  date: ISODate;
  isAvailable: boolean;
  pricePerNight: number;
  isPeakSeason: boolean;
}

export interface PricingRule {
  id: UUID;
  roomId: UUID | null; // null = applies to all rooms
  label: string;
  startDate: ISODate;
  endDate: ISODate;
  multiplier: number; // e.g. 1.5 for 50% premium
  isActive: boolean;
}

export interface User {
  id: UUID;
  email: string;
  fullName: string;
  phone?: string;
  role: 'guest' | 'admin';
  createdAt: ISODateTime;
}

export interface Invoice {
  id: UUID;
  bookingId: UUID;
  invoiceNumber: string;
  pdfUrl?: string;
  issuedAt: ISODateTime;
}
