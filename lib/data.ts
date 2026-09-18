export type Venue = {
  id: string;
  name: string;
  destination: string;
  city: string;
  country: string;
  type: string;
  capacity: number;
  price: number;
  hold: number;
  rating: number;
  verified: boolean;
  image: string;
  tags: string[];
  desc: string;
};

export const destinations = [
  'Hyderabad',
  'Kerala',
  'Goa',
  'Udaipur',
  'Jaipur',
  'Himalaya',
  'Sri Lanka',
  'Bali',
  'Phuket',
];

export const venues: Venue[] = [

  /* =====================================================
     HYDERABAD
  ===================================================== */

  {
    id: 'hyderabad-1',
    name: 'Taj Falaknuma Palace',
    destination: 'Hyderabad',
    city: 'Hyderabad',
    country: 'India',
    type: 'Royal Palace',
    capacity: 600,
    price: 0,
    hold: 0,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Palace',
      'Royal',
      'Luxury',
      'Heritage',
    ],
    desc:
      'A grand heritage palace with opulent interiors, landscaped gardens and distinctive spaces for royal celebrations.',
  },

  {
    id: 'hyderabad-2',
    name: 'Park Hyatt Hyderabad',
    destination: 'Hyderabad',
    city: 'Hyderabad',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 600,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Luxury',
      'Ballroom',
      'City',
      'Modern',
    ],
    desc:
      'A refined city venue featuring a pillarless ballroom, residential-style event spaces and bespoke event services.',
  },

  {
    id: 'hyderabad-3',
    name: 'Hyatt Hyderabad Gachibowli',
    destination: 'Hyderabad',
    city: 'Hyderabad',
    country: 'India',
    type: 'Luxury Hotel',
    capacity: 600,
    price: 0,
    hold: 0,
    rating: 4.7,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Lawn',
      'Modern',
      'Large Events',
      'City',
    ],
    desc:
      'A contemporary Hyderabad wedding venue with a large landscaped lawn, ballroom and dedicated wedding planning team.',
  },
  {
  id: 'hyderabad-4',
  name: 'Arth Resorts',
  destination: 'Hyderabad',
  city: 'Moinabad',
  country: 'India',
  type: 'Luxury Resort',
  capacity: 1500,
  price: 0,
  hold: 0,
  rating: 4.8,
  verified: true,
  image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  tags: [
    'Resort',
    'Luxury',
    'Lawns',
    'Destination Wedding'
  ],
  desc: 'A tranquil luxury resort near Hyderabad with a convention hall, banquet hall and multiple celebration lawns designed for weddings and large gatherings.'
},

{
  id: 'hyderabad-5',
  name: 'Trident Hyderabad',
  destination: 'Hyderabad',
  city: 'HITEC City',
  country: 'India',
  type: 'Luxury Hotel',
  capacity: 1110,
  price: 0,
  hold: 0,
  rating: 4.8,
  verified: true,
  image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85',
  tags: [
    'Luxury',
    'Ballroom',
    'City',
    'Large Events'
  ],
  desc: 'A luxury HITEC City hotel with flexible wedding and event spaces including the Kaveri Ballroom and multiple function rooms.'
},

{
  id: 'hyderabad-6',
  name: 'Radisson Hotel Hyderabad Hitec City',
  destination: 'Hyderabad',
  city: 'HITEC City',
  country: 'India',
  type: 'Luxury Hotel',
  capacity: 196,
  price: 0,
  hold: 0,
  rating: 4.7,
  verified: true,
  image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85',
  tags: [
    'Modern',
    'City',
    'Events',
    'Luxury'
  ],
  desc: 'A contemporary HITEC City hotel with flexible indoor and outdoor event spaces, catering and dedicated event coordination.'
},

{
  id: 'hyderabad-7',
  name: 'ITC Kohenur',
  destination: 'Hyderabad',
  city: 'Madhapur',
  country: 'India',
  type: 'Luxury Hotel',
  capacity: 900,
  price: 0,
  hold: 0,
  rating: 4.9,
  verified: true,
  image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85',
  tags: [
    'Luxury',
    'Waterfront',
    'Ballroom',
    'Large Events'
  ],
  desc: 'A luxury Hyderabad wedding destination with the pillar-less Deccan Stateroom, Golconda Greens and Pearl Deck overlooking Durgam Lake.'
},


  /* =====================================================
     KERALA
  ===================================================== */

  {
    id: 'kerala-1',
    name: 'Kumarakom Lake Resort',
    destination: 'Kerala',
    city: 'Kumarakom',
    country: 'India',
    type: 'Backwater Resort',
    capacity: 400,
    price: 0,
    hold: 0,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Backwaters',
      'Luxury',
      'Heritage',
      'Lakefront',
    ],
    desc:
      'A heritage-inspired backwater resort overlooking Vembanad Lake, suited to intimate and multi-day celebrations.',
  },

  {
    id: 'kerala-2',
    name: 'The Leela Kovalam',
    destination: 'Kerala',
    city: 'Kovalam',
    country: 'India',
    type: 'Clifftop Resort',
    capacity: 750,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Beach',
      'Clifftop',
      'Luxury',
      'Sea View',
    ],
    desc:
      'A clifftop coastal resort with expansive sea views, landscaped spaces and dedicated wedding venues.',
  },

  {
    id: 'kerala-3',
    name: 'Grand Hyatt Kochi Bolgatty',
    destination: 'Kerala',
    city: 'Kochi',
    country: 'India',
    type: 'Island Resort',
    capacity: 3000,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Island',
      'Waterfront',
      'Large Events',
      'Luxury',
    ],
    desc:
      'A large waterfront resort on Bolgatty Island offering extensive event spaces for grand destination celebrations.',
  },


  /* =====================================================
     GOA
  ===================================================== */

  {
    id: 'goa-1',
    name: 'Taj Exotica Resort & Spa Goa',
    destination: 'Goa',
    city: 'South Goa',
    country: 'India',
    type: 'Beach Resort',
    capacity: 700,
    price: 0,
    hold: 0,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Beach',
      'Luxury',
      'Beachfront',
      'Large Events',
    ],
    desc:
      'A South Goa luxury resort with expansive lawns, ballroom spaces and beachfront wedding settings.',
  },

  {
    id: 'goa-2',
    name: 'W Goa',
    destination: 'Goa',
    city: 'Vagator',
    country: 'India',
    type: 'Beach Resort',
    capacity: 600,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Beach',
      'Contemporary',
      'Luxury',
      'Vagator',
    ],
    desc:
      'A contemporary beachfront resort near Vagator with indoor and outdoor event spaces designed for celebrations.',
  },

  {
    id: 'goa-3',
    name: 'Alila Diwa Goa',
    destination: 'Goa',
    city: 'Majorda',
    country: 'India',
    type: 'Luxury Resort',
    capacity: 500,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Luxury',
      'Tropical',
      'Modern',
      'Wedding Resort',
    ],
    desc:
      'A refined resort surrounded by paddy fields and coconut palms, with spaces for ceremonies, mehendi and receptions.',
  },


  /* =====================================================
     UDAIPUR
  ===================================================== */

  {
    id: 'udaipur-1',
    name: 'The Leela Palace Udaipur',
    destination: 'Udaipur',
    city: 'Udaipur',
    country: 'India',
    type: 'Luxury Palace',
    capacity: 500,
    price: 1250000,
    hold: 75000,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Lake View',
      'Luxury',
      'Destination Wedding',
    ],
    desc:
      'A lakefront palace experience with grand lawns, intimate courtyards and cinematic views of Lake Pichola.',
  },

  {
    id: 'udaipur-2',
    name: 'Raffles Udaipur',
    destination: 'Udaipur',
    city: 'Udaipur',
    country: 'India',
    type: 'Island Resort',
    capacity: 300,
    price: 1100000,
    hold: 75000,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Island',
      'Luxury',
      'Stay',
    ],
    desc:
      'An immersive island resort designed for multi-day celebrations and intimate destination weddings.',
  },

  {
    id: 'udaipur-3',
    name: 'Taj Lake Palace',
    destination: 'Udaipur',
    city: 'Udaipur',
    country: 'India',
    type: 'Heritage Palace',
    capacity: 250,
    price: 950000,
    hold: 75000,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Heritage',
      'Lake View',
      'Iconic',
    ],
    desc:
      'A timeless lake palace setting for elegant celebrations, ceremonies and private events.',
  },

  {
    id: 'udaipur-4',
    name: 'The Oberoi Udaivilas',
    destination: 'Udaipur',
    city: 'Udaipur',
    country: 'India',
    type: 'Luxury Resort',
    capacity: 450,
    price: 1350000,
    hold: 75000,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Luxury',
      'Gardens',
      'Lake View',
    ],
    desc:
      'Palatial architecture, manicured gardens and exceptional hospitality for high-touch celebrations.',
  },

  {
    id: 'udaipur-5',
    name: 'Aurika Udaipur',
    destination: 'Udaipur',
    city: 'Udaipur',
    country: 'India',
    type: 'Hilltop Resort',
    capacity: 350,
    price: 700000,
    hold: 70000,
    rating: 4.7,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Hilltop',
      'Modern',
      'Views',
    ],
    desc:
      'A contemporary destination wedding canvas with expansive views and flexible event spaces.',
  },

  {
    id: 'udaipur-6',
    name: 'Ananta Udaipur',
    destination: 'Udaipur',
    city: 'Udaipur',
    country: 'India',
    type: 'Resort',
    capacity: 600,
    price: 650000,
    hold: 65000,
    rating: 4.6,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Large Events',
      'Resort',
      'Views',
    ],
    desc:
      'A large-format resort suited to energetic celebrations, guest stays and multi-event wedding weekends.',
  },


  /* =====================================================
     JAIPUR
  ===================================================== */

  {
    id: 'jaipur-1',
    name: 'Rambagh Palace',
    destination: 'Jaipur',
    city: 'Jaipur',
    country: 'India',
    type: 'Royal Palace',
    capacity: 800,
    price: 0,
    hold: 0,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Royal',
      'Palace',
      'Heritage',
      'Luxury',
    ],
    desc:
      'A historic Jaipur palace surrounded by Mughal gardens and heritage architecture for grand royal celebrations.',
  },

  {
    id: 'jaipur-2',
    name: 'Jai Mahal Palace',
    destination: 'Jaipur',
    city: 'Jaipur',
    country: 'India',
    type: 'Heritage Palace',
    capacity: 3000,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Heritage',
      'Royal',
      'Gardens',
      'Large Events',
    ],
    desc:
      'A heritage palace with expansive landscaped lawns and event spaces suitable for intimate and grand celebrations.',
  },

  {
    id: 'jaipur-3',
    name: 'Alila Fort Bishangarh',
    destination: 'Jaipur',
    city: 'Bishangarh',
    country: 'India',
    type: 'Fort Resort',
    capacity: 250,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Fort',
      'Heritage',
      'Hills',
      'Luxury',
    ],
    desc:
      'A restored heritage fort overlooking the Aravallis, creating a dramatic setting for intimate destination weddings.',
  },


  /* =====================================================
     HIMALAYA
  ===================================================== */

  {
    id: 'himalaya-1',
    name: 'JW Marriott Mussoorie Walnut Grove',
    destination: 'Himalaya',
    city: 'Mussoorie',
    country: 'India',
    type: 'Mountain Resort',
    capacity: 275,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Mountains',
      'Luxury',
      'Mussoorie',
      'Views',
    ],
    desc:
      'A luxury mountain resort in Mussoorie with indoor and outdoor event spaces and dedicated wedding services.',
  },

  {
    id: 'himalaya-2',
    name: 'Taj Rishikesh Resort & Spa',
    destination: 'Himalaya',
    city: 'Rishikesh',
    country: 'India',
    type: 'Riverside Resort',
    capacity: 200,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Ganga',
      'Mountains',
      'Riverside',
      'Luxury',
    ],
    desc:
      'A Himalayan foothills retreat beside the Ganga with lawns and intimate event spaces for destination celebrations.',
  },

  {
    id: 'himalaya-3',
    name: 'Ananda in the Himalayas',
    destination: 'Himalaya',
    city: 'Narendranagar',
    country: 'India',
    type: 'Mountain Retreat',
    capacity: 300,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Himalayas',
      'Wellness',
      'Nature',
      'Luxury',
    ],
    desc:
      'A secluded Himalayan retreat surrounded by forest and mountain landscapes, suited to intimate destination celebrations.',
  },


  /* =====================================================
     SRI LANKA
  ===================================================== */

  {
    id: 'srilanka-1',
    name: 'Shangri-La Colombo',
    destination: 'Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    type: 'Luxury City Resort',
    capacity: 3000,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Oceanfront',
      'Luxury',
      'Ballroom',
      'Colombo',
    ],
    desc:
      'A luxury Colombo waterfront property with expansive ballroom and outdoor event spaces for large celebrations.',
  },

  {
    id: 'srilanka-2',
    name: 'Galle Face Hotel',
    destination: 'Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    type: 'Heritage Oceanfront Hotel',
    capacity: 1000,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Heritage',
      'Oceanfront',
      'Colonial',
      'Luxury',
    ],
    desc:
      'An iconic oceanfront heritage hotel with ballrooms and the Chequerboard outdoor venue overlooking the Indian Ocean.',
  },

  {
    id: 'srilanka-3',
    name: 'Anantara Peace Haven Tangalle Resort',
    destination: 'Sri Lanka',
    city: 'Tangalle',
    country: 'Sri Lanka',
    type: 'Beach Resort',
    capacity: 300,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Beach',
      'Clifftop',
      'Tropical',
      'Luxury',
    ],
    desc:
      'A secluded southern-coast resort with ocean views, tropical gardens and dedicated wedding planning.',
  },


  /* =====================================================
     BALI
  ===================================================== */

  {
    id: 'bali-1',
    name: 'AYANA Bali',
    destination: 'Bali',
    city: 'Jimbaran',
    country: 'Indonesia',
    type: 'Clifftop Resort',
    capacity: 3000,
    price: 0,
    hold: 0,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Clifftop',
      'Ocean View',
      'Luxury',
      'Large Events',
    ],
    desc:
      'A large integrated resort with ocean-facing wedding venues, gardens, private villas and dedicated wedding specialists.',
  },

  {
    id: 'bali-2',
    name: 'Alila Villas Uluwatu',
    destination: 'Bali',
    city: 'Uluwatu',
    country: 'Indonesia',
    type: 'Clifftop Villa Resort',
    capacity: 100,
    price: 0,
    hold: 0,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Clifftop',
      'Ocean View',
      'Intimate',
      'Villa',
    ],
    desc:
      'An intimate clifftop wedding destination overlooking the Indian Ocean, designed for private celebrations.',
  },

  {
    id: 'bali-3',
    name: 'Andaz Bali',
    destination: 'Bali',
    city: 'Sanur',
    country: 'Indonesia',
    type: 'Beach Resort',
    capacity: 450,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Beach',
      'Garden',
      'Modern',
      'Sanur',
    ],
    desc:
      'A tropical Sanur resort offering garden, beach and village-inspired settings with options for exclusive celebrations.',
  },


  /* =====================================================
     PHUKET
  ===================================================== */

  {
    id: 'phuket-1',
    name: 'Amanpuri',
    destination: 'Phuket',
    city: 'Phuket',
    country: 'Thailand',
    type: 'Luxury Beach Resort',
    capacity: 500,
    price: 0,
    hold: 0,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Beach',
      'Private',
      'Luxury',
      'Island',
    ],
    desc:
      'A private peninsula resort with beaches, pavilions and villas designed for intimate and exclusive celebrations.',
  },

  {
    id: 'phuket-2',
    name: 'JW Marriott Phuket Resort & Spa',
    destination: 'Phuket',
    city: 'Mai Khao',
    country: 'Thailand',
    type: 'Beach Resort',
    capacity: 600,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Beach',
      'Indian Wedding',
      'Luxury',
      'Large Events',
    ],
    desc:
      'A beachfront Phuket resort with indoor and outdoor event spaces and dedicated services for Indian destination weddings.',
  },

  {
    id: 'phuket-3',
    name: 'The Naka Island',
    destination: 'Phuket',
    city: 'Phuket',
    country: 'Thailand',
    type: 'Island Resort',
    capacity: 200,
    price: 0,
    hold: 0,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=85',
    tags: [
      'Island',
      'Beach',
      'Private',
      'Luxury',
    ],
    desc:
      'A private island resort setting suited to intimate destination weddings, beachfront ceremonies and multi-day celebrations.',
  },
];

export const collections = [
  [
    'Royal Udaipur',
    'Palaces, lakeside lawns and heritage grandeur',
  ],
  [
    'Intimate Retreats',
    'Private, elegant settings for smaller celebrations',
  ],
  [
    'Lakefront Grandeur',
    'Iconic water views and unforgettable ceremonies',
  ],
  [
    'Modern Royalty',
    'Contemporary luxury with destination character',
  ],
  [
    'Tropical Escapes',
    'Beachfront celebrations across Goa, Bali, Sri Lanka and Phuket',
  ],
  [
    'Mountain Weddings',
    'Himalayan retreats, forests and dramatic mountain views',
  ],
];