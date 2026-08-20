import { type ComponentType } from 'react';
import {
  Waves,
  ChefHat,
  Flame,
  Wifi,
  Car,
  ConciergeBell,
  Trees,
  Sparkles,
  Mountain,
  Snowflake,
  Camera,
  Binoculars,
  Flower2,
  Sunrise,
  Compass,
  type LucideProps,
} from 'lucide-react';

/**
 * Centralized icon registry so config/content files can reference icons by
 * string name without importing React components.
 */
export const iconMap: Record<string, ComponentType<LucideProps>> = {
  Waves,
  ChefHat,
  Flame,
  Wifi,
  Car,
  ConciergeBell,
  Trees,
  Sparkles,
  Mountain,
  Snowflake,
  Camera,
  Binoculars,
  Flower2,
  Sunrise,
  Compass,
};

export function getIcon(name: string): ComponentType<LucideProps> {
  const Icon = iconMap[name];
  if (!Icon) {
    throw new Error(`Icon "${name}" not found in iconMap. Add it to src/lib/icons.ts.`);
  }
  return Icon;
}
