'use client';

import { useState, useEffect, useCallback } from 'react';
import { defaultPricingConfig, type PricingConfig } from '@/config/pricingConfig';

export interface AccommodationItem {
  id: string;
  name: string;
  type: string;
  base_price_per_night: number;
  currency: string;
  capacity: number;
  is_active: boolean;
}

export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricingConfig);
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/pricing', {
        headers: { credentials: 'same-origin' },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch pricing (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.pricing) {
        setPricing(data.pricing);
      }
      if (data.accommodations) {
        setAccommodations(data.accommodations);
      }
    } catch (err: any) {
      console.warn('[usePricing] Notice: Using fallback baseline pricing:', err.message);
      setError(err.message || 'Failed to load live pricing.');
      // Keep defaultPricingConfig as reliable fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const getRoomPrice = useCallback(
    (roomId?: string): number => {
      if (!roomId || roomId === 'entire-villa' || roomId === 'villa-suroor-main') {
        return pricing.entireVillaPricePerNight || 30000;
      }
      return pricing.roomPrices?.[roomId] ?? pricing.roomPricePerNight ?? 15000;
    },
    [pricing]
  );

  const getAccommodation = useCallback(
    (id: string): AccommodationItem | undefined => {
      return accommodations.find((a) => a.id === id);
    },
    [accommodations]
  );

  return {
    pricing,
    accommodations,
    entireVillaPrice: pricing.entireVillaPricePerNight || 30000,
    roomPrice: pricing.roomPricePerNight || 15000,
    getRoomPrice,
    getAccommodation,
    isLoading,
    error,
    refreshPricing: fetchPricing,
  };
}
