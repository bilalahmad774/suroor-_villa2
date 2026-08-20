/**
 * Static content for the villa — kept in one place so copy edits don't
 * require touching component code. Later this can move to a CMS or DB.
 *
 * IMPORTANT: All data here is clearly marked DEMO where it is illustrative.
 * No real guest reviews, real distances, or real pricing are claimed.
 */

import type { Room } from '@/types/domain';
import { siteConfig } from '@/config/siteConfig';
import { defaultPricingConfig, getRoomPrice } from '@/config/pricingConfig';

export const villaInfo = {
  name: 'Suroor Villa',
  tagline: 'A private three-bedroom retreat in the pine valleys of Kashmir',
  location: 'Gulmarg Road, Kashmir, India',
  maxGuests: 6,
  bedrooms: 3,
  bathrooms: 3,
  propertyType: 'Private luxury villa',
  checkIn: '2:00 PM',
  checkOut: '11:00 AM',
  pricePerNight: defaultPricingConfig.entireVillaPricePerNight,
  description:
    'Set on a quiet ridge above the pine line, Suroor Villa is a three-bedroom sanctuary built from local stone and timber. Floor-to-ceiling glass frames the Himalayan ridge, while interiors balance Kashmiri craft with quiet, modern comfort. The villa is rented as a single private estate — your group alone.',
};

export const entireVillaInfo = {
  id: 'entire-villa',
  name: 'Entire Villa',
  tagline: 'All 3 private suites & exclusive estate buyout',
  pricePerNight: defaultPricingConfig.entireVillaPricePerNight,
  capacity: 6,
  bedrooms: 3,
  bathrooms: 3,
  description:
    'Full private buyout of Suroor Villa including all 3 luxury suites (The Master Suite, The Pine Suite, and The Garden Room), private chef dining, Kashmiri butler service, and private landscaped grounds for your group alone.',
};

export const propertyStats = [
  { value: '3', label: 'Private suites' },
  { value: '6', label: 'Guests maximum' },
  { value: '3', label: 'En-suite baths' },
  { value: '1', label: 'Estate, yours alone' },
];

export const villaDetails = [
  { label: 'Bedrooms', value: '3 private suites' },
  { label: 'Guest capacity', value: 'Up to 6 guests' },
  { label: 'Bathrooms', value: '3 en-suite baths' },
  { label: 'Property type', value: 'Private luxury villa' },
  { label: 'Location', value: 'Gulmarg Road, Kashmir' },
  { label: 'Check-in', value: '2:00 PM' },
  { label: 'Check-out', value: '11:00 AM' },
  { label: 'Minimum stay', value: '1 night' },
];

export const rooms: Room[] = [
  {
    id: 'room-1',
    name: 'The Master Suite',
    category: 'master',
    description:
      'A king-bedded suite with a private balcony, fireplace, and an uninterrupted view of the ridgeline. Marble bath with rain shower and a deep soaking tub.',
    capacity: 2,
    basePricePerNight: getRoomPrice('room-1'),
    amenities: ['King bed', 'Private balcony', 'Fireplace', 'Soaking tub', 'Mountain view'],
    images: [],
    isActive: true,
    bedType: 'King bed',
    bathroom: 'En-suite with soaking tub & rain shower',
    view: 'Himalayan ridgeline',
    size: 'DEMO — to be confirmed',
  },
  {
    id: 'room-2',
    name: 'The Pine Suite',
    category: 'deluxe',
    description:
      'A deluxe king room framed by pine forest. Plush seating nook, writing desk, and an en-suite bath with marble vanity.',
    capacity: 2,
    basePricePerNight: getRoomPrice('room-2'),
    amenities: ['King bed', 'Forest view', 'En-suite bath', 'Writing desk'],
    images: [],
    isActive: true,
    bedType: 'King bed',
    bathroom: 'En-suite with marble vanity',
    view: 'Pine forest',
    size: 'DEMO — to be confirmed',
  },
  {
    id: 'room-3',
    name: 'The Garden Room',
    category: 'garden',
    description:
      'A flexible twin-to-king room opening onto the herb garden. Bright, airy, and ideal for children or friends sharing the villa.',
    capacity: 2,
    basePricePerNight: getRoomPrice('room-3'),
    amenities: ['Twin-to-king beds', 'Garden access', 'En-suite bath'],
    images: [],
    isActive: true,
    bedType: 'Twin-to-king beds',
    bathroom: 'En-suite with walk-in shower',
    view: 'Herb garden',
    size: 'DEMO — to be confirmed',
  },
];

export const amenities = [
  { icon: 'Waves', label: 'Heated infinity pool' },
  { icon: 'ChefHat', label: 'Private chef & Kashmiri kitchen' },
  { icon: 'Flame', label: 'Wood-fired hearth' },
  { icon: 'Wifi', label: 'High-speed Wi-Fi' },
  { icon: 'Car', label: 'Airport transfers' },
  { icon: 'ConciergeBell', label: 'On-call concierge' },
  { icon: 'Trees', label: 'Landscaped pine gardens' },
  { icon: 'Sparkles', label: 'Daily housekeeping' },
];

export const experiences = [
  {
    icon: 'Snowflake',
    title: 'Gulmarg gondola & winter skiing',
    description:
      'A guided day on the Gulmarg gondola — one of the highest cable cars in the world. Equipment, instructor, and a mountain lunch arranged by your concierge.',
    imageKey: 'nearbyAttractions' as const,
  },
  {
    icon: 'Camera',
    title: 'Arisimigal meadow trek',
    description:
      'A half-day guided walk through alpine meadows and pine forest, with a packed Kashmiri picnic and panoramic ridge photography.',
    imageKey: 'exterior' as const,
  },
  {
    icon: 'Flower2',
    title: 'Srinagar Mughal gardens & Dal Lake',
    description:
      'A full-day excursion to the old city — shikara ride on Dal Lake, Mughal gardens, and a private lunch in a houseboat dining room.',
    imageKey: 'nearbyAttractions' as const,
  },
  {
    icon: 'Sunrise',
    title: 'Sunrise ridge yoga',
    description:
      'A private sunrise yoga session on the villa terrace, overlooking the Himalayan ridgeline. Mats, instructor, and herbal tea included.',
    imageKey: 'exterior' as const,
  },
  {
    icon: 'ChefHat',
    title: 'Kashmiri Wazwan cooking class',
    description:
      'Join the villa chef for a hands-on Wazwan masterclass — learn the slow-cooked recipes that define Kashmiri cuisine, then dine together.',
    imageKey: 'dining' as const,
  },
  {
    icon: 'Binoculars',
    title: 'Stargazing on the terrace',
    description:
      'A clear-sky evening with a local astronomer, telescope, and Kashmiri kahwa. The high-altitude dark sky is extraordinary.',
    imageKey: 'exterior' as const,
  },
];

export const nearbyAttractions = [
  {
    name: 'Gulmarg',
    distance: '13 km',
    travelTime: '~30 mins drive',
    description:
      'The meadow of flowers — gondola rides, summer trekking, and winter skiing.',
    imageKey: 'nearbyAttractions' as const,
    mapUrl: 'https://maps.google.com/?q=Gulmarg',
  },
  {
    name: 'Drung Waterfall',
    distance: '3 km',
    travelTime: '~10 mins drive',
    description:
      'A hidden valley cascade, dramatic in spring melt and gentle in late summer.',
    imageKey: 'nearbyAttractions' as const,
    mapUrl: 'https://maps.google.com/?q=Drung+Waterfall+Kashmir',
  },
];

export const reviews = [
  {
    name: 'Aanya & Rohan',
    location: 'Mumbai',
    rating: 5,
    title: 'A week we will not forget',
    body: 'The villa is even more beautiful than the photographs. Mornings on the balcony with the mountains, evenings by the fire with a meal from the private chef — it was perfect.',
  },
  {
    name: 'The Mehra family',
    location: 'Delhi',
    rating: 5,
    title: 'Felt like our own private estate',
    body: 'Three families, three bedrooms, zero compromise on comfort. The concierge arranged a day on Dal Lake and a guided trek in Gulmarg. Seamless.',
  },
  {
    name: 'Sara K.',
    location: 'London',
    rating: 5,
    title: 'The most restful stay of our trip',
    body: 'Quiet, private, and beautifully designed. The infinity pool at sunset is something I keep thinking about. We are already planning to return.',
  },
];

export const faqs = [
  {
    question: 'Is the villa booked as a whole or per room?',
    answer:
      'Suroor Villa is booked as a single private estate — all three suites are yours. We do not rent individual rooms to separate groups.',
  },
  {
    question: 'What is the maximum number of guests?',
    answer:
      'The villa comfortably sleeps six adults across three suites. Additional children or staff can be accommodated on request — please ask the concierge.',
  },
  {
    question: 'Is a private chef included?',
    answer:
      'Yes. A private chef prepares breakfast, lunch, and dinner from a curated Kashmiri and pan-Indian menu. Groceries are sourced locally and billed at cost.',
  },
  {
    question: 'How do I get to the villa?',
    answer:
      'Complimentary airport transfers from Srinagar are included in every stay. Your concierge will coordinate arrival times and any road conditions.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      'A full refund is available up to 14 days before check-in. Within 14 days, the first night is non-refundable. Force-majeure exceptions are handled case by case.',
  },
  {
    question: 'Is the villa suitable for children?',
    answer:
      'Absolutely. The Garden Room can be configured with twin beds, and the concierge can arrange child-friendly meals, activities, and supervision on request.',
  },
];

export const contactInfo = {
  get ownerName() {
    return siteConfig.ownerName;
  },
  get phone() {
    return siteConfig.ownerPhone;
  },
  get phoneHref() {
    return siteConfig.phoneHref;
  },
  get email() {
    return siteConfig.ownerEmail;
  },
  get emailHref() {
    return siteConfig.emailHref;
  },
  get whatsapp() {
    return siteConfig.whatsappNumber;
  },
  get whatsappHref() {
    return siteConfig.whatsappHref;
  },
  address: siteConfig.address,
  mapEmbedUrl: siteConfig.mapEmbedUrl,
  mapLink: siteConfig.mapUrl,
  social: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
  },
};

export const navLinks = [
  { label: 'The Villa', href: '/#villa' },
  { label: 'Suites', href: '/#suites' },
  { label: 'Experience', href: '/#experiences' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Amenities', href: '/#amenities' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Contact', href: '/contact' },
];

export const footerLinks = {
  explore: [
    { label: 'The Villa', href: '/#villa' },
    { label: 'Suites', href: '/#suites' },
    { label: 'Experience', href: '/#experiences' },
    { label: 'Gallery', href: '/#gallery' },
    { label: 'Amenities', href: '/#amenities' },
  ],
  stays: [
    { label: 'Check availability', href: '/#booking' },
    { label: 'Pricing & seasons', href: '/#suites' },
    { label: 'Guest Dashboard', href: '/dashboard' },
    { label: 'Cancellation policy', href: '/#faq' },
  ],
  get contact() {
    return [
      { label: siteConfig.ownerEmail, href: siteConfig.emailHref },
      { label: siteConfig.ownerPhone, href: siteConfig.phoneHref },
    ];
  },
};
