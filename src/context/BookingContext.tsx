'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BookingOptions {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  adults?: number;
  children?: number;
  couponCode?: string;
}

interface BookingContextType {
  isBookingOpen: boolean;
  bookingOptions: BookingOptions;
  openBooking: (options?: BookingOptions) => void;
  closeBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

function getDefaultBookingDates() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 4);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return {
    checkIn: fmt(tomorrow),
    checkOut: fmt(checkOut),
  };
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const defaultDates = getDefaultBookingDates();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingOptions, setBookingOptions] = useState<BookingOptions>({
    checkIn: defaultDates.checkIn,
    checkOut: defaultDates.checkOut,
    guestCount: 4,
    adults: 3,
    children: 1,
  });

  const openBooking = useCallback((options?: BookingOptions) => {
    if (options) {
      setBookingOptions((prev) => ({ ...prev, ...options }));
    }
    setIsBookingOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setIsBookingOpen(false);
  }, []);

  useEffect(() => {
    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<BookingOptions>;
      openBooking(customEvent.detail);
    };

    window.addEventListener('open-booking-modal', handleCustomOpen);
    return () => {
      window.removeEventListener('open-booking-modal', handleCustomOpen);
    };
  }, [openBooking]);

  return (
    <BookingContext.Provider
      value={{
        isBookingOpen,
        bookingOptions,
        openBooking,
        closeBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    const defaultDates = getDefaultBookingDates();
    // Return fallback helpers if accessed outside provider
    return {
      isBookingOpen: false,
      bookingOptions: {
        checkIn: defaultDates.checkIn,
        checkOut: defaultDates.checkOut,
        guestCount: 4,
      },
      openBooking: (options?: BookingOptions) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('open-booking-modal', { detail: options || {} })
          );
        }
      },
      closeBooking: () => {},
    };
  }
  return context;
}
