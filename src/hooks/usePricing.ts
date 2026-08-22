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
  updated_at?: string;
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
      const res = await fetch(`/api/pricing?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to fetch pricing (HTTP ${res.status})`);
      }

      if (data.pricing) {
        setPricing(data.pricing);
      }
      if (data.accommodations) {
        setAccommodations(data.accommodations);
      }
    } catch (err: any) {
      console.warn('[usePricing] Notice on live pricing fetch:', err.message);
      setError(err.message || 'Unable to load real-time accommodation prices.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const entireVillaPrice = pricing.entireVillaPricePerNight;
  const roomPrice = pricing.roomPricePerNight;

  const getRoomPrice = useCallback(
    (roomId?: string): number => {
      if (!roomId || roomId === 'entire-villa' || roomId === 'villa-suroor-main') {
        return pricing.entireVillaPricePerNight;
      }
      return pricing.roomPrices?.[roomId] ?? pricing.roomPricePerNight;
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
    entireVillaPrice,
    roomPrice,
    getRoomPrice,
    getAccommodation,
    isLoading,
    error,
    refreshPricing: fetchPricing,
  };
}
