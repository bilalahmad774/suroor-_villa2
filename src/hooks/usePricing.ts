'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import type { PricingConfig } from '@/config/pricingConfig';

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
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch live from the server endpoint
      const res = await fetch(`/api/pricing?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.accommodations && data.accommodations.length > 0) {
          setPricing(data.pricing);
          setAccommodations(data.accommodations);
          setIsLoading(false);
          return;
        }
      }

      // 2. Direct browser-side fallback query to Supabase public.accommodations
      const { data: sbData, error: sbError } = await supabase
        .from('accommodations')
        .select('id, name, type, base_price_per_night, currency, capacity, is_active, updated_at')
        .order('id', { ascending: true });

      if (sbError) {
        throw new Error(sbError.message);
      }

      if (sbData && sbData.length > 0) {
        const parsed: AccommodationItem[] = sbData.map((item: any) => ({
          id: String(item.id),
          name: String(item.name || item.id),
          type: String(item.type || 'standard'),
          base_price_per_night: Number(item.base_price_per_night) || 0,
          currency: String(item.currency || 'INR'),
          capacity: Number(item.capacity) || 2,
          is_active: item.is_active !== false,
          updated_at: item.updated_at,
        }));

        const entireVilla = parsed.find((a) => a.id === 'entire-villa');
        const room1 = parsed.find((a) => a.id === 'room-1');
        const roomPrices: Record<string, number> = {};
        parsed.forEach((a) => {
          roomPrices[a.id] = a.base_price_per_night;
        });

        const clientConfig: PricingConfig = {
          entireVillaPricePerNight: entireVilla?.base_price_per_night ?? (roomPrices['entire-villa'] || 0),
          roomPricePerNight: room1?.base_price_per_night ?? 0,
          currency: entireVilla?.currency || 'INR',
          currencySymbol: '₹',
          roomPrices: {
            'room-1': room1?.base_price_per_night ?? 0,
            ...roomPrices,
          },
        };

        setAccommodations(parsed);
        setPricing(clientConfig);
      } else {
        setError('No accommodation records found in public.accommodations table.');
      }
    } catch (err: any) {
      console.warn('[usePricing] Notice loading accommodation prices:', err.message);
      setError(err.message || 'Unable to load real-time prices from database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const entireVillaPrice =
    accommodations.find((a) => a.id === 'entire-villa')?.base_price_per_night ??
    pricing?.entireVillaPricePerNight ??
    null;

  const roomPrice =
    accommodations.find((a) => a.id === 'room-1')?.base_price_per_night ??
    pricing?.roomPricePerNight ??
    null;

  const getRoomPrice = useCallback(
    (roomId?: string): number | null => {
      if (!roomId || roomId === 'entire-villa' || roomId === 'villa-suroor-main') {
        const v = accommodations.find((a) => a.id === 'entire-villa');
        if (v) return v.base_price_per_night;
        return pricing?.entireVillaPricePerNight ?? null;
      }
      const r = accommodations.find((a) => a.id === roomId);
      if (r) return r.base_price_per_night;
      return pricing?.roomPrices?.[roomId] ?? pricing?.roomPricePerNight ?? null;
    },
    [accommodations, pricing]
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
