export type VenueSpace = {
  id: string;
  name: string;
  capacity: number;
  image: string;
  description: string;
  tags: string[];
};

export type Venue = {
  id: string;
  name: string;
  destination: string;
  city: string;
  country: string;
  type: string;
  capacity: number;
  price: number;
  hold: number | null;
  rating: number;
  verified: boolean;
  image: string;
  tags: string[];
  desc: string;
  venueSpaces: VenueSpace[];
};

export const destinations = ['Hyderabad'];

export const venues: Venue[] = [
  {
    id: 'hyderabad-1',
    name: 'Taj Falaknuma Palace',
    destination: 'Hyderabad',
    city: 'Hyderabad',
    country: 'India',
    type: 'Luxury Palace',
    capacity: 1200,
    price: 0,
    hold: null,
    rating: 4.9,
    verified: true,
    image:
      '/images/venues/TAJ-1.jpg',
    tags: ['Palace', 'Luxury', 'Heritage', 'Destination Wedding'],
    desc:
      'A majestic palace wedding destination offering an unforgettable royal setting for intimate and grand celebrations.',
    venueSpaces: [
      {
        id: 'taj-falaknuma-main-lawns',
        name: 'Main Lawns',
        capacity: 1200,
        image:
          '/images/venues/TAJ-2.jpg',
        description:
          'A grand outdoor lawn designed for spectacular weddings and large celebrations.',
        tags: ['Outdoor', 'Large Events', 'Wedding'],
      },
      {
        id: 'taj-falaknuma-pool-lawns',
        name: 'Pool Lawns',
        capacity: 500,
        image:
          '/images/venues/TAJ-3.jpg',
        description:
          'An elegant poolside setting suited for stylish receptions and evening celebrations.',
        tags: ['Poolside', 'Outdoor', 'Reception'],
      },
      {
        id: 'taj-falaknuma-rajasthani-gardens',
        name: 'Rajasthani Gardens',
        capacity: 150,
        image:
          '/images/venues/TAJ-4.jpg',
        description:
          'A charming heritage garden space for intimate celebrations and traditional ceremonies.',
        tags: ['Garden', 'Intimate', 'Heritage'],
      },
      {
        id: 'taj-falaknuma-coronation-hall',
        name: 'Coronation Hall',
        capacity: 60,
        image:
          '/images/venues/TAJ-5.png',
        description:
          'An intimate royal indoor setting perfect for elegant private celebrations.',
        tags: ['Indoor', 'Intimate', 'Royal'],
      },
      {
        id: 'taj-falaknuma-durbar-hall',
        name: 'Ballroom – Durbar Hall',
        capacity: 150,
        image:
          '/images/venues/TAJ-6.jpg',
        description:
          'A sophisticated indoor ballroom surrounded by the grandeur of the palace.',
        tags: ['Ballroom', 'Indoor', 'Luxury'],
      },
      {
        id: 'taj-falaknuma-jade-room',
        name: 'Jade Room & Jade Terrace',
        capacity: 60,
        image:
          '/images/venues/TAJ-7.jpg',
        description:
          'An intimate indoor and terrace setting for refined private events.',
        tags: ['Terrace', 'Intimate', 'Luxury'],
      },
      {
        id: 'taj-falaknuma-101-dining',
        name: '101 Dining Hall',
        capacity: 90,
        image:
          '/images/venues/TAJ-8.jpg',
        description:
          'An elegant dining space for private dinners and intimate celebrations.',
        tags: ['Dining', 'Private Events'],
      },
      {
        id: 'taj-falaknuma-boardroom',
        name: 'Boardroom',
        capacity: 20,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A private setting suited for small gatherings and intimate meetings.',
        tags: ['Private', 'Small Events'],
      },
    ],
  },

  {
    id: 'hyderabad-2',
    name: 'Hilton Hyderabad Genome Valley Resort & Spa',
    destination: 'Hyderabad',
    city: 'Genome Valley',
    country: 'India',
    type: 'Luxury Resort',
    capacity: 1800,
    price: 0,
    hold: null,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=90',
    tags: ['Resort', 'Luxury', 'Lawn', 'Destination Wedding'],
    desc:
      'A contemporary luxury resort offering expansive lawns, elegant ballrooms and premium hospitality.',
    venueSpaces: [
      {
        id: 'hilton-cassia-lawn',
        name: 'Cassia Lawn',
        capacity: 1800,
        image:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=90',
        description:
          'A spectacular outdoor lawn designed for large weddings and celebrations.',
        tags: ['Lawn', 'Large Events', 'Wedding'],
      },
      {
        id: 'hilton-bauhinia-lawn',
        name: 'Bauhinia Lawn',
        capacity: 500,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A landscaped outdoor venue suited for elegant celebrations.',
        tags: ['Lawn', 'Outdoor'],
      },
      {
        id: 'hilton-plumeria-lawn',
        name: 'Plumeria Lawn',
        capacity: 500,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A versatile garden venue for intimate and mid-sized events.',
        tags: ['Garden', 'Outdoor'],
      },
      {
        id: 'hilton-cassia-ballroom',
        name: 'Cassia Ballroom',
        capacity: 600,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A refined ballroom for sophisticated indoor celebrations.',
        tags: ['Ballroom', 'Indoor', 'Luxury'],
      },
      {
        id: 'hilton-celosia-ballroom',
        name: 'Celosia Ballroom',
        capacity: 300,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A stylish indoor ballroom suitable for weddings and social events.',
        tags: ['Ballroom', 'Indoor'],
      },
      {
        id: 'hilton-lotus-mandapam',
        name: 'Lotus Mandapam',
        capacity: 150,
        image:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90',
        description:
          'A dedicated ceremonial space ideal for intimate wedding rituals.',
        tags: ['Wedding', 'Ceremony', 'Intimate'],
      },
      {
        id: 'hilton-lotus-deck',
        name: 'Lotus Deck',
        capacity: 70,
        image:
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=90',
        description:
          'An elegant open-air deck for private celebrations and receptions.',
        tags: ['Deck', 'Outdoor'],
      },
      {
        id: 'hilton-canna-indica',
        name: 'Canna Indica',
        capacity: 120,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A private event room designed for smaller celebrations.',
        tags: ['Indoor', 'Private'],
      },
    ],
  },

  {
    id: 'hyderabad-3',
    name: 'Novotel Hyderabad Convention Centre',
    destination: 'Hyderabad',
    city: 'HITEC City',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 2000,
    price: 0,
    hold: null,
    rating: 4.7,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1800&q=90',
    tags: ['Hotel', 'Convention', 'Large Events', 'Wedding'],
    desc:
      'A contemporary hospitality destination with extensive event infrastructure for large celebrations.',
    venueSpaces: [
      {
        id: 'novotel-convention-centre',
        name: 'Convention Centre',
        capacity: 2000,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A large-scale event environment designed for major weddings, conferences and celebrations.',
        tags: ['Convention', 'Large Events'],
      },
      {
        id: 'novotel-grand-ballroom',
        name: 'Grand Ballroom',
        capacity: 1000,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A sophisticated ballroom suitable for large indoor celebrations.',
        tags: ['Ballroom', 'Indoor'],
      },
      {
        id: 'novotel-event-lawns',
        name: 'Event Lawns',
        capacity: 1200,
        image:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=90',
        description:
          'Spacious outdoor event lawns for weddings and large gatherings.',
        tags: ['Lawn', 'Outdoor', 'Wedding'],
      },
      {
        id: 'novotel-banquet-hall',
        name: 'Banquet Hall',
        capacity: 500,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A versatile indoor space for receptions, ceremonies and private events.',
        tags: ['Banquet', 'Indoor'],
      },
    ],
  },

  {
    id: 'hyderabad-4',
    name: 'Trident Hyderabad',
    destination: 'Hyderabad',
    city: 'HITEC City',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 900,
    price: 0,
    hold: null,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=90',
    tags: ['Hotel', 'Luxury', 'Wedding'],
    desc:
      'A refined luxury hotel in the heart of HITEC City with elegant spaces for premium celebrations.',
    venueSpaces: [
      {
        id: 'trident-kaveri',
        name: 'Kaveri',
        capacity: 250,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'An elegant event space for sophisticated weddings and social gatherings.',
        tags: ['Indoor', 'Wedding'],
      },
      {
        id: 'trident-godavari',
        name: 'Godavari',
        capacity: 300,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A spacious event venue suitable for celebrations and receptions.',
        tags: ['Indoor', 'Reception'],
      },
      {
        id: 'trident-padma',
        name: 'Padma',
        capacity: 250,
        image:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90',
        description:
          'A polished event space for intimate and mid-sized celebrations.',
        tags: ['Indoor', 'Celebration'],
      },
      {
        id: 'trident-padma-godavari',
        name: 'Padma & Godavari',
        capacity: 600,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A combined event space designed for larger celebrations.',
        tags: ['Large Events', 'Indoor'],
      },
      {
        id: 'trident-all-spaces',
        name: 'Kaveri, Godavari & Padma',
        capacity: 900,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'The combined event configuration for large-scale celebrations.',
        tags: ['Large Events', 'Wedding'],
      },
      {
        id: 'trident-tulip-iris',
        name: 'Tulip & Iris',
        capacity: 45,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A private setting for small gatherings and intimate occasions.',
        tags: ['Private', 'Intimate'],
      },
    ],
  },

  {
    id: 'hyderabad-5',
    name: 'Radisson Hotel Hyderabad Hitec City',
    destination: 'Hyderabad',
    city: 'HITEC City',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 196,
    price: 0,
    hold: null,
    rating: 4.6,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1800&q=90',
    tags: ['Hotel', 'Intimate Weddings', 'Luxury'],
    desc:
      'A modern luxury hotel offering sophisticated spaces for intimate weddings, receptions and private events.',
    venueSpaces: [
      {
        id: 'radisson-summit-ii',
        name: 'Summit II',
        capacity: 196,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'The largest event configuration at the property for receptions and celebrations.',
        tags: ['Event Hall', 'Reception'],
      },
      {
        id: 'radisson-crystal-i',
        name: 'Crystal I',
        capacity: 182,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A refined event space suitable for weddings and private celebrations.',
        tags: ['Event Hall', 'Wedding'],
      },
      {
        id: 'radisson-crystal-ii',
        name: 'Crystal II',
        capacity: 150,
        image:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90',
        description:
          'A flexible indoor space for celebrations and social events.',
        tags: ['Indoor', 'Celebration'],
      },
      {
        id: 'radisson-summit-i',
        name: 'Summit I',
        capacity: 140,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A sophisticated event room for intimate and mid-sized gatherings.',
        tags: ['Indoor', 'Intimate'],
      },
      {
        id: 'radisson-crest',
        name: 'Crest',
        capacity: 82,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A private event room for smaller celebrations.',
        tags: ['Private', 'Small Events'],
      },
      {
        id: 'radisson-council-iii',
        name: 'Council III',
        capacity: 48,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A compact private room for intimate gatherings.',
        tags: ['Private', 'Intimate'],
      },
      {
        id: 'radisson-council-i-ii',
        name: 'Council I & II',
        capacity: 26,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'Flexible smaller meeting and private event rooms.',
        tags: ['Private', 'Small Events'],
      },
    ],
  },

  {
    id: 'hyderabad-6',
    name: 'ITC Kohenur',
    destination: 'Hyderabad',
    city: 'Madhapur',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 900,
    price: 0,
    hold: null,
    rating: 4.9,
    verified: true,
    image:
      '/images/venues/itc-kohenur.png',
    tags: ['Luxury', 'Hotel', 'Wedding', 'Premium'],
    desc:
      'An elegant luxury hotel overlooking Durgam Cheruvu, offering sophisticated spaces for premium celebrations.',
    venueSpaces: [
      {
        id: 'itc-deccan-stateroom',
        name: 'Deccan Stateroom',
        capacity: 900,
        image:
          '/images/venues/ITC-1.jpeg',
        description:
          'The signature grand event space designed for large-scale celebrations.',
        tags: ['Grand Hall', 'Large Events', 'Wedding'],
      },
      {
        id: 'itc-golconda-greens',
        name: 'Golconda Greens',
        capacity: 550,
        image:
          '/images/venues/ITC-2.jpeg',
        description:
          'An expansive green setting suitable for elegant outdoor celebrations.',
        tags: ['Outdoor', 'Lawn', 'Wedding'],
      },
      {
        id: 'itc-pearl-deck',
        name: 'Pearl Deck',
        capacity: 75,
        image:
          '/images/venues/ITC-3.jpeg',
        description:
          'A stylish deck overlooking the surrounding landscape.',
        tags: ['Deck', 'Intimate'],
      },
      {
        id: 'itc-board-room',
        name: 'Hi-tech Board Room',
        capacity: 25,
        image:
          '/images/venues/ITC-4.jpeg',
        description:
          'A private room designed for small gatherings.',
        tags: ['Private', 'Small Events'],
      },
    ],
  },

  {
    id: 'hyderabad-7',
    name: 'The Westin Hyderabad Mindspace',
    destination: 'Hyderabad',
    city: 'HITEC City',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 600,
    price: 0,
    hold: null,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1800&q=90',
    tags: ['Luxury', 'Hotel', 'Wedding', 'Events'],
    desc:
      'A contemporary luxury hotel offering elegant ballrooms, lawns and event spaces for celebrations.',
    venueSpaces: [
      {
        id: 'westin-ballroom',
        name: 'Westin Ballroom',
        capacity: 500,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A sophisticated ballroom for weddings, receptions and large celebrations.',
        tags: ['Ballroom', 'Indoor', 'Wedding'],
      },
      {
        id: 'westin-lawns',
        name: 'Westin Lawns',
        capacity: 600,
        image:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=90',
        description:
          'A spacious outdoor lawn for grand celebrations and wedding ceremonies.',
        tags: ['Lawn', 'Outdoor', 'Wedding'],
      },
      {
        id: 'westin-elevate',
        name: 'Elevate',
        capacity: 300,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A stylish event space for sophisticated private celebrations.',
        tags: ['Event Space', 'Luxury'],
      },
      {
        id: 'westin-pool',
        name: 'Poolside',
        capacity: 120,
        image:
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1800&q=90',
        description:
          'A beautiful poolside environment for intimate celebrations and cocktail events.',
        tags: ['Poolside', 'Outdoor', 'Intimate'],
      },
    ],
  },

  {
    id: 'hyderabad-8',
    name: 'Taj Krishna',
    destination: 'Hyderabad',
    city: 'Banjara Hills',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 1300,
    price: 0,
    hold: null,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=90',
    tags: ['Luxury', 'Hotel', 'Wedding', 'Heritage'],
    desc:
      'A landmark luxury hotel in Hyderabad offering grand indoor and outdoor settings for celebrations.',
    venueSpaces: [
      {
        id: 'taj-krishna-gardenia',
        name: 'Gardenia',
        capacity: 1300,
        image:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=90',
        description:
          'A grand outdoor setting designed for large weddings and celebrations.',
        tags: ['Garden', 'Large Events', 'Wedding'],
      },
      {
        id: 'taj-krishna-grand-ballroom',
        name: 'Grand Ballroom',
        capacity: 1000,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A magnificent ballroom for large-scale indoor celebrations.',
        tags: ['Ballroom', 'Luxury', 'Large Events'],
      },
      {
        id: 'taj-krishna-emerald',
        name: 'Emerald',
        capacity: 1000,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'An elegant event space suitable for premium celebrations.',
        tags: ['Indoor', 'Luxury'],
      },
      {
        id: 'taj-krishna-garden-room',
        name: 'Garden Room',
        capacity: 120,
        image:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90',
        description:
          'An intimate indoor event room for private celebrations.',
        tags: ['Indoor', 'Intimate'],
      },
      {
        id: 'taj-krishna-sapphire',
        name: 'Sapphire',
        capacity: 120,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A polished private event space for smaller gatherings.',
        tags: ['Private', 'Indoor'],
      },
      {
        id: 'taj-krishna-golden-room',
        name: 'Golden Room',
        capacity: 80,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'An intimate room designed for private celebrations.',
        tags: ['Private', 'Intimate'],
      },
      {
        id: 'taj-krishna-pearl-room',
        name: 'Pearl Room',
        capacity: 40,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A compact private setting for small gatherings.',
        tags: ['Private', 'Small Events'],
      },
    ],
  },

  {
    id: 'hyderabad-9',
    name: 'Hyderabad Marriott Hotel & Convention Centre',
    destination: 'Hyderabad',
    city: 'Tank Bund',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 1400,
    price: 0,
    hold: null,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=90',
    tags: ['Hotel', 'Convention', 'Luxury', 'Large Events'],
    desc:
      'A premium city hotel with a large convention centre, gardens and sophisticated event spaces.',
    venueSpaces: [
      {
        id: 'marriott-convention-centre',
        name: 'Marriott Convention Centre',
        capacity: 1400,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A large convention environment designed for major weddings and events.',
        tags: ['Convention', 'Large Events'],
      },
      {
        id: 'marriott-pearl-gardens',
        name: 'Pearl Gardens',
        capacity: 700,
        image:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=90',
        description:
          'A landscaped outdoor venue suitable for grand wedding celebrations.',
        tags: ['Garden', 'Outdoor', 'Wedding'],
      },
      {
        id: 'marriott-amethyst-gardens',
        name: 'Amethyst Gardens',
        capacity: 400,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A spacious garden setting for elegant outdoor celebrations.',
        tags: ['Garden', 'Outdoor'],
      },
      {
        id: 'marriott-sapphire-ballroom-i',
        name: 'Sapphire Ballroom I',
        capacity: 170,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'A refined ballroom for intimate and mid-sized celebrations.',
        tags: ['Ballroom', 'Indoor'],
      },
      {
        id: 'marriott-sapphire-ballroom-ii',
        name: 'Sapphire Ballroom II',
        capacity: 150,
        image:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90',
        description:
          'An elegant indoor venue for receptions and private events.',
        tags: ['Ballroom', 'Indoor'],
      },
    ],
  },

  {
    id: 'hyderabad-10',
    name: 'Park Hyatt Hyderabad',
    destination: 'Hyderabad',
    city: 'Banjara Hills',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 600,
    price: 0,
    hold: null,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=90',
    tags: ['Luxury', 'Hotel', 'Wedding', 'Premium'],
    desc:
      'A contemporary luxury hotel with elegant event rooms and a sophisticated ballroom for premium celebrations.',
    venueSpaces: [
      {
        id: 'park-hyatt-ballroom',
        name: 'The Ballroom',
        capacity: 600,
        image:
          'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1800&q=90',
        description:
          'The signature ballroom for elegant weddings, receptions and large celebrations.',
        tags: ['Ballroom', 'Luxury', 'Wedding'],
      },
      {
        id: 'park-hyatt-ballroom-i',
        name: 'Ballroom I',
        capacity: 120,
        image:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=90',
        description:
          'A flexible ballroom section suitable for smaller celebrations.',
        tags: ['Ballroom', 'Indoor'],
      },
      {
        id: 'park-hyatt-manor',
        name: 'The Manor',
        capacity: 120,
        image:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90',
        description:
          'A collection of elegant private event rooms for intimate celebrations.',
        tags: ['Private', 'Luxury'],
      },
      {
        id: 'park-hyatt-event-room',
        name: 'Event Room',
        capacity: 80,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'A sophisticated private room for intimate gatherings.',
        tags: ['Private', 'Indoor'],
      },
      {
        id: 'park-hyatt-boardroom',
        name: 'Boardroom',
        capacity: 12,
        image:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90',
        description:
          'An exclusive private room for small gatherings.',
        tags: ['Private', 'Small Events'],
      },
    ],
  },
];

export function getVenueById(id: string): Venue | undefined {
  return venues.find((venue) => venue.id === id);
}