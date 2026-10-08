/**
 * Verified amenities & services per venue.
 *
 * RULES (do not relax):
 *  - Only add a feature when the cited source states it for THAT
 *    property. Never copy between venues or from a hotel brand.
 *  - Never add a "no"/"not available" entry. Unverified = leave out.
 *  - Prefer official property pages; 'google' for Google Business /
 *    Maps; 'authoritative' only when no official page states it
 *    (e.g. a hotel-supplied industry-association fact sheet).
 *  - Third-party booking sites (Booking.com, Expedia, Hotels.com,
 *    Kayak, trade-listing aggregators) are NOT acceptable sources.
 *
 * Each entry: [feature_key, evidence_from_source, optional detail].
 * feature_key values are defined in lib/compare/features.ts.
 * Venues are keyed by their public slug (venues.slug).
 *
 * Verified 2026-10-08. Venues with no entry (or an empty list) have
 * no verified features yet and will show blank cells.
 */

const VERIFIED_AT = '2026-10-08';

const src = (url, type = 'official') => ({
  sourceUrl: url,
  sourceType: type,
  verifiedAt: VERIFIED_AT,
});

export const venueFeaturesData = [
  {
    slug: 'taj-falaknuma-palace-hyderabad',
    sources: [
      {
        ...src(
          'https://www.tajhotels.com/en-in/hotels/taj-falaknuma-palace-hyderabad'
        ),
        features: [
          ['swimming_pool', 'Wellness: "Large outdoor swimming pool"'],
          ['spa', 'FAQ: "has the J Wellness Circle Spa"'],
          ['fitness_centre', 'Wellness: "24-hour fitness centre"', '24-hour'],
          ['wifi', 'Hotel: "Inclusive of basic Wi-Fi/Premium Wi-Fi at nominal charge"'],
          [
            'parking',
            'Hotel: "Outdoor parking facility for maximum of 350 cars"',
            'Up to 350 cars',
          ],
          [
            'restaurant',
            'Dining: Adaa, Celeste, Gol Bungalow ("3 restaurants and 1 bar")',
            'Adaa, Celeste, Gol Bungalow',
          ],
          [
            'cuisines',
            'Dining: Adaa (Indian Hyderabadi), Celeste (Italian, International), Gol Bungalow (Indian, Italian, Multi-Cuisine)',
            'Indian (Hyderabadi) · Italian · International · Multi-cuisine',
          ],
          ['bar_lounge', 'Dining: "Hookah Bar (Multi-Cuisine, Finger Food)"', 'Hookah Bar'],
          ['accessibility', 'Hotel: "Facilities for the specially abled"'],
          ['business_centre', 'Hotel: "24-hour business centre with high-speed Wi-Fi, workstations"', '24-hour'],
          ['concierge', 'Hotel: "Concierge services"'],
          ['room_service', 'Hotel: "24-hour in-room dining"', '24-hour'],
          ['laundry', 'Hotel: "24-hour laundry"', '24-hour'],
          ['airport_transfer', 'FAQ: "we offer convenient airport pick-up and drop-off services"'],
          ['travel_desk', 'Hotel: "Travel desk, car rental services"'],
          ['doctor_on_call', 'Hotel: "24-hour on-call doctor (charges apply)"', '24-hour'],
          ['safe_deposit_lockers', 'Hotel: "Currency exchange, safe deposit lockers"'],
        ],
      },
    ],
  },

  {
    slug: 'hilton-hyderabad-genome-valley-resort-spa',
    sources: [
      {
        ...src(
          'https://www.hilton.com/en/hotels/hydhdhi-hilton-hyderabad-genome-valley-resort-spa/hotel-info/'
        ),
        features: [
          ['restaurant', 'Dining: "On-site restaurant"'],
          ['room_service', 'Dining: "Room service"'],
          ['swimming_pool', 'Fitness and recreation: "Outdoor pool"'],
          ['fitness_centre', 'Fitness and recreation: "Fitness center"'],
          ['spa', 'Fitness and recreation: "Spa"'],
          ['concierge', 'Guest services: "Concierge"'],
          ['ev_charging', 'Guest services: "EV charging"; Parking: "EV charging: On-site" (chargeable)'],
          ['wifi', 'Conveniences: "Free WiFi"'],
          ['parking', 'Parking: "Self-parking: Complimentary"'],
          ['valet_parking', 'Parking: "Valet parking: Complimentary"'],
        ],
      },
      {
        ...src(
          'https://www.hilton.com/en/hotels/hydhdhi-hilton-hyderabad-genome-valley-resort-spa'
        ),
        features: [
          [
            'bar_lounge',
            'Overview: "four unique restaurants, including a café, pool bar, and a specialty restaurant"',
            'Pool bar',
          ],
          [
            'cuisines',
            'Overview: "a specialty restaurant offering Asian regional cuisine"',
            'Asian (regional)',
          ],
        ],
      },
    ],
  },

  {
    slug: 'novotel-hyderabad-convention-centre',
    sources: [
      {
        ...src('https://all.accor.com/hotel/6182/index.en.shtml'),
        features: [
          ['swimming_pool', 'Hotel services, on site: "Swimming pool"'],
          ['parking', 'Hotel services, on site: "Car park"'],
          [
            'restaurant',
            'Restaurants: Food Exchange, Permit To Grill, Le Cafe',
            'Food Exchange, Permit To Grill, Le Cafe',
          ],
          [
            'cuisines',
            'Food Exchange: "multi-cuisine restaurant serving food from around the globe"; Permit To Grill: "grills, wraps, burgers, and wood-fired pizzas"',
            'Multi-cuisine · Grills & wood-fired pizza',
          ],
          ['accessibility', 'Hotel services, on site: "Wheelchair accessible"'],
          ['fitness_centre', 'Hotel services, on site: "Fitness center"'],
          ['wifi', 'Hotel services, on site: "Wi-Fi"'],
          ['bar_lounge', 'Hotel services, on site: "Bar"; "The Bar at Novotel Hyderabad"', 'The Bar'],
          ['room_service', 'Hotel services, on site: "Room service"'],
          ['spa', 'Wellness: "a luxury spa offering bespoke massages"'],
        ],
      },
    ],
  },

  /* Trident Hyderabad: official property page could not be reached.
     Nothing is stored until it is verified from tridenthotels.com or
     the Google Business Profile. */
  { slug: 'trident-hyderabad', sources: [] },

  {
    slug: 'radisson-hotel-hyderabad-hitec-city',
    sources: [
      {
        ...src(
          'https://www.radissonhotels.com/en-us/hotels/radisson-hyderabad-hitec-city/services'
        ),
        features: [
          ['laundry', 'Additional amenities: "Laundry service"'],
          ['bar_lounge', 'Dining: "Bar"'],
          ['restaurant', 'Dining: "On-site restaurant(s)"'],
          ['fitness_centre', 'Fitness & Wellness: "Fitness center"'],
          ['swimming_pool', 'Fitness & Wellness: "Outdoor pool"'],
          ['spa', 'Fitness & Wellness: "On-site spa and wellness facility"'],
          ['accessibility', 'Key hotel services: "Accessibility features available"'],
          ['concierge', 'Key hotel services: "Concierge service"'],
          ['wifi', 'Key hotel services: "Free Wi-Fi"'],
        ],
      },
    ],
  },

  {
    slug: 'itc-kohenur-hyderabad',
    sources: [
      {
        ...src('https://www.itchotels.com/in/en/itckohenur-hyderabad/wellbeing'),
        features: [
          ['spa', '"Kaya Kalp – The Royal Spa"'],
          ['fitness_centre', '"Fitness Centre"'],
          ['swimming_pool', '"The outdoor infinity pool at the lobby level"'],
        ],
      },
      {
        ...src(
          'https://www.marriott.com/en-us/hotels/hydlk-itc-kohenur-a-luxury-collection-hotel-hyderabad/overview/'
        ),
        features: [
          ['parking', '"On-site parking is available"'],
          ['wifi', '"has in-room Wi-Fi available to hotel guests"'],
          ['accessibility', '"Accessible Entrance to On-Site Pool / Fitness Center / Spa"'],
        ],
      },
      {
        ...src(
          'https://www.marriott.com/en-us/hotels/hydlk-itc-kohenur-a-luxury-collection-hotel-hyderabad/dining/'
        ),
        features: [
          [
            'restaurant',
            'Dining page: Golconda Pavilion, Yi Jing, Ottimo Cucina Italiana, Dum Pukht Begum\'s, Peshawri',
            "Golconda Pavilion, Yi Jing, Ottimo, Dum Pukht Begum's, Peshawri",
          ],
          [
            'cuisines',
            'Dining page: Golconda Pavilion "Multiple cuisines"; Yi Jing "Chinese"; Ottimo "Italian"; Dum Pukht Begum\'s "Indian"',
            'Multi-cuisine · Chinese · Italian · Indian',
          ],
          [
            'bar_lounge',
            'Dining page: "Peacock Bar ... overlooking the pool"; "SkyPoint ... Luxury bar"',
            'Peacock Bar, SkyPoint',
          ],
          ['dining_24h', 'Dining page: Golconda Pavilion "Open 24/7"'],
        ],
      },
      {
        /* Hotel-supplied fact sheet; used only for items no official page states. */
        ...src(
          'https://www.hotelassociationofindia.com/pdf/Hyderabad/ITC%20Kohenur.pdf',
          'authoritative'
        ),
        features: [
          ['valet_parking', 'Facilities & Services: "Complimentary Valet Parking"'],
          ['room_service', 'Facilities & Services: "24-Hour Room Service"', '24-hour'],
          ['laundry', 'Facilities & Services: "Laundry", "Dry Cleaning Service"'],
        ],
      },
    ],
  },

  {
    slug: 'westin-hyderabad-mindspace',
    sources: [
      {
        ...src(
          'https://www.marriott.com/en-us/hotels/hydwi-the-westin-hyderabad-mindspace/overview/'
        ),
        features: [
          ['swimming_pool', 'Featured amenities: "Outdoor Pool"'],
          ['spa', '"Heavenly Spa by Westin"'],
          ['parking', 'Parking: "Complimentary On-Site Parking"'],
          ['valet_parking', 'Parking: "Complimentary Valet Parking"'],
        ],
      },
      {
        ...src('https://marriott.com/en-us/hotels/hydwi-the-westin-hyderabad-mindspace/dining'),
        features: [
          [
            'restaurant',
            'Dining page: Seasonal Tastes, Prego, Casbah, Splash (poolside); welcome text names Kangan',
            'Seasonal Tastes, Prego, Kangan, Casbah, Splash',
          ],
          [
            'cuisines',
            'Dining page: Seasonal Tastes "Multiple cuisines" (local, Chinese, international); Prego "Italian"; Casbah "Mediterranean"; Kangan "Peshawari and Hyderabadi"',
            'Multi-cuisine · Italian · Mediterranean · Peshawari & Hyderabadi',
          ],
          [
            'bar_lounge',
            'Photos/dining: "Mix Lounge & Bar", "Casbah", "Splash - Poolside Bar"',
            'Mix, Casbah, Splash (poolside)',
          ],
          ['room_service', 'Dining page: "Yes, room service is available"'],
        ],
      },
      {
        ...src('https://www.marriott.com/en-us/hotels/hydwi-the-westin-hyderabad-mindspace/photos'),
        features: [['fitness_centre', 'Official photo gallery: "The Westin Hyderabad Fitness Center"']],
      },
    ],
  },

  {
    slug: 'taj-krishna-hyderabad',
    sources: [
      {
        ...src('https://www.tajhotels.com/en-in/hotels/taj-krishna-hyderabad'),
        features: [
          ['swimming_pool', 'FAQ: "has a refreshing outdoor swimming pool"'],
          ['spa', 'Facilities: "J Wellness Circle Spa"'],
          ['airport_transfer', 'FAQ: "we offer convenient airport pickup and drop-off services"'],
        ],
      },
    ],
  },

  {
    slug: 'hyderabad-marriott-hotel-convention-centre',
    sources: [
      {
        ...src('https://www.marriott.com/hi/hotels/travel/hydmc'),
        features: [
          ['spa', '"a luxury spa"; "Tattva Spa"'],
          ['fitness_centre', '"24-hour fitness center"', '24-hour'],
          ['swimming_pool', '"a sparkling outdoor pool"'],
          ['wifi', '"has in-room Wi-Fi available to hotel guests"'],
        ],
      },
      {
        ...src('https://marriott.com/en-us/hotels/hydmc-hyderabad-marriott-hotel-and-convention-centre/dining'),
        features: [
          [
            'restaurant',
            'Dining page: Okra; Indian restaurant; bakery deli ("Breakfast is served at Okra, Hyderabad Baking Company")',
            'Okra, Hyderabad Baking Company',
          ],
          [
            'cuisines',
            'Dining page: Okra "Indian and international cuisine"; "Specializing in Indian cuisine"',
            'Indian · International',
          ],
          [
            'bar_lounge',
            'Dining page: "A trendy restro-lounge bar with panoramic view of Hussain Sagar Lake"',
            'Lounge bar',
          ],
          ['room_service', 'Dining page: "Yes, room service is available"'],
        ],
      },
    ],
  },

  {
    slug: 'park-hyatt-hyderabad',
    sources: [
      {
        ...src('https://www.hyatt.com/park-hyatt/en-US/hydph-park-hyatt-hyderabad'),
        features: [
          ['fitness_centre', 'Amenities: "Fitness Center"'],
          ['parking', 'Amenities: "Free Parking"'],
          ['valet_parking', 'Amenities: "Valet Parking"'],
          ['swimming_pool', 'Amenities: "Pool"'],
          ['spa', 'Amenities: "Spa"'],
          ['catering', 'Events: "Elevated with award-winning catering and attentive service"'],
        ],
      },
      {
        ...src('https://www.hyatt.com/park-hyatt/en-US/hydph-park-hyatt-hyderabad/dining'),
        features: [
          [
            'restaurant',
            'Dining page: Rika, Tre-Forni, The Dining Room, The Living Room',
            'Rika, Tre-Forni, The Dining Room, The Living Room',
          ],
          [
            'cuisines',
            'Dining page: "fine dining in Indian, Italian and Modern Asian cuisines"',
            'Indian · Italian · Modern Asian',
          ],
          ['room_service', 'Dining page: In-Room Dining "Available 24 hours"', '24-hour'],
        ],
      },
      {
        ...src('https://www.hyattrestaurants.com/en/hyderabad/restaurant/the-dining-room-2'),
        features: [['dining_24h', 'The Dining Room: "Open 24/7"']],
      },
    ],
  },
];
