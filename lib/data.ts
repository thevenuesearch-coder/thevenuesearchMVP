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
    capacity: 500,
    price: 0,
    hold: null,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1590073242678-70ee3fc28f95?auto=format&fit=crop&w=1600&q=85',
    tags: ['Palace', 'Luxury', 'Heritage'],
    desc:
      'A majestic palace wedding destination offering an unforgettable royal setting for intimate and grand celebrations.',
  },

  {
    id: 'hyderabad-2',
    name: 'Golkonda Resorts & Spa',
    destination: 'Hyderabad',
    city: 'Gandipet',
    country: 'India',
    type: 'Luxury Resort',
    capacity: 1200,
    price: 0,
    hold: null,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85',
    tags: ['Resort', 'Lawn', 'Luxury'],
    desc:
      'A premium resort surrounded by landscaped gardens, spacious lawns and elegant hospitality spaces.',
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
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=85',
    tags: ['Hotel', 'Convention', 'Large Events'],
    desc:
      'A contemporary destination for large-scale weddings and celebrations with extensive event infrastructure.',
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
    hold: null,
    rating: 4.7,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=85',
    tags: ['Resort', 'Destination Wedding', 'Large Events'],
    desc:
      'A spacious resort destination near Hyderabad designed for memorable weddings, celebrations and large gatherings.',
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
    hold: null,
    rating: 4.8,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85',
    tags: ['Hotel', 'Luxury', 'Wedding'],
    desc:
      'A refined luxury hotel in the heart of HITEC City, offering elegant hospitality and sophisticated event spaces.',
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
    hold: null,
    rating: 4.6,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1600&q=85',
    tags: ['Hotel', 'Intimate Weddings', 'Luxury'],
    desc:
      'A modern luxury hotel suitable for intimate weddings, receptions and private celebrations.',
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
    hold: null,
    rating: 4.9,
    verified: true,
    image:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=85',
    tags: ['Luxury', 'Hotel', 'Wedding'],
    desc:
      'An elegant luxury hotel overlooking Durgam Cheruvu, offering sophisticated spaces for premium celebrations.',
  },
];