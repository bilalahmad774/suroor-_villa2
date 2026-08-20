/**
 * Centralized image configuration for the Suroor Villa website.
 *
 * Every image path used across the site is declared here. React components
 * import from this file instead of hard-coding URLs, so swapping in
 * licensed or client-owned photographs later means editing this one file.
 *
 * Current images are the client's uploaded demo photographs, served from
 * /public/images/. Replace the `src` values (and optionally `alt`) with
 * final licensed/client-owned assets when ready.
 */

export interface ImageAsset {
  src: string;
  alt: string;
  /** Optional caption shown in galleries / lightboxes. */
  caption?: string;
}

export interface ImageCategory {
  /** Primary hero/cover image for the section. */
  hero: ImageAsset;
  /** Supporting images for galleries and detail views. */
  gallery: ImageAsset[];
}

export const imageConfig = {
  hero: {
    hero: {
      src: '/images/exterior/exterior_(10).jpg',
      alt: 'Suroor Villa glowing at dusk against the Kashmir valley',
      caption: 'The villa at golden hour, overlooking the pine valley',
    },
    gallery: [
      {
        src: '/images/exterior/exterior_(11).jpg',
        alt: 'Villa facade with warm interior lights at twilight',
      },
      {
        src: '/images/exterior/exterior_(3).jpg',
        alt: 'Villa terrace facing the Himalayan ridge',
      },
    ],
  },

  exterior: {
    hero: {
      src: '/images/exterior/exterior_(11).jpg',
      alt: 'Stone and timber exterior of Suroor Villa',
      caption: 'Hand-cut stone and local timber architecture',
    },
    gallery: [
      {
        src: '/images/exterior/exterior_(3).jpg',
        alt: 'Villa terraces nestled into the hillside',
      },
      {
        src: '/images/exterior/exterior_(4).jpg',
        alt: 'Exterior detail at dusk',
      },
      {
        src: '/images/exterior/exterior_(5).jpg',
        alt: 'Garden-facing exterior facade',
      },
      {
        src: '/images/exterior/exterior_(6).jpg',
        alt: 'Poolside deck and terrace',
      },
      {
        src: '/images/exterior/exterior_(7).jpg',
        alt: 'Villa entrance and stonework',
      },
      {
        src: '/images/exterior/exterior_(8).jpg',
        alt: 'Rear exterior with valley view',
      },
    ],
  },

  livingRoom: {
    hero: {
      src: '/images/livingroom/livingRoom1.jpg',
      alt: 'Living lounge with fireplace and floor-to-ceiling windows',
      caption: 'The great lounge — fireplace, linen sofas, valley light',
    },
    gallery: [
      {
        src: '/images/livingroom/livingRoom1_(2).jpg',
        alt: 'Living room opening onto the terrace',
      },
      {
        src: '/images/livingroom/livingRoom1_(3).jpg',
        alt: 'Sofa grouping beside the hearth',
      },
      {
        src: '/images/livingroom/livingRoom2.jpg',
        alt: 'Second living room with seating area',
      },
      {
        src: '/images/livingroom/livingRoom_(2).jpg',
        alt: 'Lounge detail with natural light',
      },
      {
        src: '/images/livingroom/livingarea.webp',
        alt: 'Open-plan living area',
      },
      {
        src: '/images/livingroom/livlingroom2.jpg',
        alt: 'Cozy living corner',
      },
    ],
  },

  bedroom1: {
    hero: {
      src: '/images/bedroom/bedroom1.webp',
      alt: 'Master suite with mountain view',
      caption: 'The Master Suite — king bed, private balcony, pine views',
    },
    gallery: [
      {
        src: '/images/bedroom/bedroom1_(2).webp',
        alt: 'Master suite sitting area',
      },
    ],
  },

  bedroom2: {
    hero: {
      src: '/images/bedroom/bedroom2.jpg',
      alt: 'Deluxe bedroom with framed mountain vista',
      caption: 'The Pine Suite — deluxe king with framed valley vista',
    },
    gallery: [
      {
        src: '/images/bedroom/bedroom2_(2).jpg',
        alt: 'Deluxe bedroom detail and natural light',
      },
    ],
  },

  bedroom3: {
    hero: {
      src: '/images/bedroom/bedroom_(2).jpg',
      alt: 'Garden bedroom with bright windows',
      caption: 'The Garden Room — twin-to-king, opening to the herb garden',
    },
    gallery: [],
  },

  bathrooms: {
    hero: {
      src: '/images/bathroom/bathroom.jpg',
      alt: 'Marble bathroom with walk-in shower',
      caption: 'Marble-clad bath with rain shower and valley light',
    },
    gallery: [
      {
        src: '/images/bathroom/bathroom_(2).jpg',
        alt: 'Vanity with round mirror and marble finishes',
      },
      {
        src: '/images/bathroom/bathroom_(3).jpg',
        alt: 'Spacious shower cabin with marble tile',
      },
      {
        src: '/images/bathroom/bathroom.webp',
        alt: 'Double vanity under soft lighting',
      },
    ],
  },

  dining: {
    hero: {
      src: '/images/dining/dining.jpg',
      alt: 'Elegant dining table with floral centerpiece',
      caption: 'The dining table — seating for six, Kashmiri cuisine',
    },
    gallery: [
      {
        src: '/images/dining/dining_(2).jpg',
        alt: 'Dining setup with candles and tableware',
      },
    ],
  },

  amenities: {
    hero: {
      src: '/images/exterior/exterior_(6).jpg',
      alt: 'Outdoor terrace and poolside amenities',
      caption: 'The terrace — overlooking the ridgeline',
    },
    gallery: [
      {
        src: '/images/exterior/exterior_(7).jpg',
        alt: 'Villa entrance and landscaped grounds',
      },
      {
        src: '/images/exterior/exterior_(8).jpg',
        alt: 'Outdoor seating with valley view',
      },
    ],
  },

  gallery: {
    hero: {
      src: '/images/exterior/exterior_(10).jpg',
      alt: 'Villa at twilight — overview',
      caption: 'A walk through Suroor Villa',
    },
    gallery: [
      {
        src: '/images/exterior/exterior_(11).jpg',
        alt: 'Villa exterior at sunset',
      },
      {
        src: '/images/livingroom/livingRoom1.jpg',
        alt: 'Living room fireplace',
      },
      {
        src: '/images/bedroom/bedroom1.webp',
        alt: 'Master suite mountain view',
      },
      {
        src: '/images/bathroom/bathroom.jpg',
        alt: 'Marble bathroom',
      },
      {
        src: '/images/dining/dining.jpg',
        alt: 'Dining table setting',
      },
      {
        src: '/images/exterior/exterior_(6).jpg',
        alt: 'Outdoor terrace',
      },
      {
        src: '/images/livingroom/livingRoom2.jpg',
        alt: 'Second living room',
      },
      {
        src: '/images/bedroom/bedroom2.jpg',
        alt: 'Deluxe bedroom',
      },
      {
        src: '/images/exterior/exterior_(7).jpg',
        alt: 'Villa entrance and grounds',
      },
      {
        src: '/images/exterior/exterior_(8).jpg',
        alt: 'Rear exterior terrace with mountain views',
      },
      {
        src: '/images/livingroom/livingRoom1_(2).jpg',
        alt: 'Living lounge terrace connection',
      },
      {
        src: '/images/exterior/exterior_(3).jpg',
        alt: 'Villa terraces nestled into the hillside',
      },
    ],
  },

  nearbyAttractions: {
    hero: {
      src: '/images/attractions/nearbyAttractions_gulmarg.jfif',
      alt: 'Gulmarg valley with snowcapped mountains',
      caption: 'Gulmarg — meadow of flowers, 13 km away',
    },
    gallery: [
      {
        src: '/images/attractions/nearbyAttractions_drungwaterfall.jpg',
        alt: 'Drung waterfall cascading through the valley',
        caption: 'Drung Waterfall — 3 km away',
      },
    ],
  },
} satisfies Record<string, ImageCategory>;

export type ImageConfig = typeof imageConfig;
export type ImageCategoryKey = keyof typeof imageConfig;

/** Helper to fetch a category's hero image. */
export function getHeroImage(category: ImageCategoryKey): ImageAsset {
  return imageConfig[category].hero;
}

/** Helper to fetch a category's full gallery (hero + supporting). */
export function getCategoryGallery(category: ImageCategoryKey): ImageAsset[] {
  const c = imageConfig[category];
  return [c.hero, ...c.gallery];
}
