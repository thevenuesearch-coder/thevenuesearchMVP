-- Destination wedding properties (Udaipur, Jaipur, Jodhpur, Jaisalmer, Goa, Kochi)
--
-- Source of truth: "Destination Wedding Properties in India" research table.
-- Capacities and room names beyond that table were verified against
-- operator pages where possible (Taj / IHCL, Oberoi, Raffles); see
-- venue_rooms.source_url / source_note for per-room provenance.
--
-- RULES
--   * Nothing is invented: unknown capacities stay NULL on spaces; the app
--     renders "Capacity on request" (lib/capacity.ts). venues.capacity_max is
--     NOT NULL, so 0 is stored for "unknown" and is treated as unknown by the app.
--   * verified = false on every row: these are researched listings, not
--     venue-confirmed partners. Flip per venue once confirmed.
--   * Idempotent: a venue whose slug already exists is skipped entirely
--     (no overwrite, no duplicate spaces/rooms).
--   * Hyderabad is intentionally excluded (already present / out of scope).
--   * Images, coordinates, prices and hold fees are intentionally left empty.

DO $do$
DECLARE
  data jsonb := $j$[
 {"slug":"the-oberoi-udaivilas-udaipur","name":"The Oberoi Udaivilas","city":"Udaipur","dest":"Udaipur","type":"Luxury Resort","tags":["Luxury","Resort","Destination Wedding"],"status":"published","cap":110,"prefix":"oberoi-udaivilas",
  "desc":"A luxury resort in Udaipur offering palatial lakefront venues for weddings, celebrations and business events.",
  "spaces":[["Chandra Mahal I & II",110],["Meeting Room I",null],["Meeting Room II",null],["Meeting Room III",null],["The Cocktail Room",48]],
  "rooms":["Premier Room","Premier Room with Pool View","Premier Garden View Room with Semi-Private Pool","Premier City Palace View Room with Semi-Private Pool","Luxury Suite with Private Pool","Kohinoor Suite with Private Pool"],
  "rstatus":"published","rurl":"https://www.oberoihotels.com/hotels-in-udaipur-udaivilas-resort/accommodation/",
  "rnote":"Category name as listed in VenueSearch research table (sourced from official Oberoi page). Size, occupancy and features not yet captured."},
 {"slug":"the-leela-palace-udaipur","name":"The Leela Palace Udaipur","city":"Udaipur","dest":"Udaipur","type":"Luxury Palace","tags":["Luxury","Palace","Destination Wedding"],"status":"published","cap":0,"prefix":"leela-udaipur",
  "desc":"A lakeside palace hotel in Udaipur with ballrooms, a courtyard, a terrace and conference halls.",
  "spaces":[["Mewar Ballroom",null],["Marwar Ballroom",null],["Inner Courtyard",null],["Marwar Terrace",null],["Mewar Conference Hall",null],["Marwar Conference Hall",null]],
  "rooms":["Grand Heritage Lake View Room","Grand Heritage Garden View Room","Royal Suite"],
  "rstatus":"published","rurl":"https://www.theleela.com/accommodation/leela-palace-udaipur/udaipur-rooms",
  "rnote":"Category name as listed in VenueSearch research table. Other categories still require verification."},
 {"slug":"taj-lake-palace-udaipur","name":"Taj Lake Palace","city":"Udaipur","dest":"Udaipur","type":"Luxury Palace","tags":["Palace","Luxury","Heritage","Destination Wedding"],"status":"published","cap":75,"prefix":"taj-lake-palace",
  "desc":"A palace hotel on Lake Pichola in Udaipur with 65 rooms and 18 suites.","address":"P O Box No 5, Lake Pichola, Udaipur 313001",
  "spaces":[["Mewar Mahal",75]],
  "rooms":["Luxury Room","Palace Room","Historical Suite","Royal Suite","Grand Royal Suite"],
  "rstatus":"published","rurl":"https://ihcldigitaldirectory.com/Taj-factsheets/Taj-Lake-Palace-Udaipur.pdf",
  "rnote":"Not itemised in the research table. Category names verified against the IHCL (Taj) property factsheet; some listings split Luxury Room by Garden View or Lake View. Confirm with property."},
 {"slug":"raffles-udaipur","name":"Raffles Udaipur","city":"Udaipur","dest":"Udaipur","type":"Luxury Resort","tags":["Luxury","Resort","Lawn","Destination Wedding"],"status":"published","cap":700,"prefix":"raffles-udaipur",
  "desc":"A luxury island resort on Udai Sagar Lake near Udaipur with 101 rooms and suites, five lawns, a garden temple and a ballroom.",
  "spaces":[["Great Park",700],["Parterre Lawn",null],["Garden Temple",null],["Ballroom",null]],
  "rooms":[],"rstatus":"draft","rurl":"https://www.raffles.com/udaipur/rooms-and-suites/","rnote":""},
 {"slug":"fairmont-jaipur","name":"Fairmont Jaipur","city":"Jaipur","dest":"Jaipur","type":"Luxury Hotel","tags":["Luxury","Hotel","Destination Wedding"],"status":"published","cap":0,"prefix":"fairmont-jaipur",
  "desc":"A luxury hotel in Jaipur with dedicated wedding and event venues.",
  "spaces":[["Sohalia",null],["Maira",null]],
  "rooms":["Fairmont King","Fairmont Room Twin","Fairmont Suite","Fairmont Gold"],
  "rstatus":"published","rurl":"https://www.fairmont.com/en/hotels/jaipur/fairmont-jaipur/rooms.html",
  "rnote":"Category name as listed in VenueSearch research table. Additional event venues are listed by the property and not yet captured."},
 {"slug":"umaid-bhawan-palace-jodhpur","name":"Umaid Bhawan Palace","city":"Jodhpur","dest":"Jodhpur","type":"Luxury Palace","tags":["Palace","Luxury","Heritage","Destination Wedding"],"status":"published","cap":1500,"prefix":"umaid-bhawan",
  "desc":"A palace hotel in Jodhpur operated by Taj, with banquet halls, courtyards and the Baradari lawn for weddings and events.",
  "spaces":[["Marwar Hall",150],["Rathore Hall",150],["Baradari",1500],["Fountain Courtyard",75]],
  "rooms":["Palace Room King Bed","Historical 1 Bedroom Suite","Royal 1 Bedroom Suite","Grand Royal 1 Bedroom Suite","Mehfil Suite","Maharaja Suite","Maharani Suite"],
  "rstatus":"published","rurl":"https://www.tajhotels.com/en-in/hotels/umaid-bhawan-palace-jodhpur/rooms-and-suites",
  "rnote":"Category name as listed in VenueSearch research table (sourced from official Taj page). Size, occupancy and features not yet captured."},
 {"slug":"jaisalmer-marriott-resort-spa-jaisalmer","name":"Jaisalmer Marriott Resort & Spa","city":"Jaisalmer","dest":"Jaisalmer","type":"Luxury Resort","tags":["Resort","Luxury","Destination Wedding"],"status":"published","cap":0,"prefix":"jaisalmer-marriott","address":"Jaisalmer-Sam-Dhanana Road, Police Line, Jaisalmer 345001",
  "desc":"A 135-room resort in Jaisalmer with a ballroom, garden and courtyard spaces for weddings and events.",
  "spaces":[["Golden Ballroom",null],["Studio Room 1",null],["Studio Room 2",null],["Palm Garden",null],["Oasis Courtyard",null],["Swimming Pool and Deck Area",null]],
  "rooms":["Deluxe Room","Oasis View Room","Fort View Room","Marriott Jaisalmer Suite","Royal Room"],
  "rstatus":"draft","rurl":"https://www.marriott.com/en-us/hotels/jsamc-jaisalmer-marriott-resort-and-spa/rooms/",
  "rnote":"Not itemised in the research table. Names corroborated by third-party sources (Outlook Traveller, hotel-listing sites); Marriott page could not be accessed. Needs confirmation with the property before publishing."},
 {"slug":"taj-exotica-resort-spa-goa","name":"Taj Exotica Resort & Spa, Goa","city":"Benaulim","dest":"Goa","type":"Luxury Resort","tags":["Resort","Luxury","Beach","Lawn","Destination Wedding"],"status":"published","cap":700,"prefix":"taj-exotica-goa","address":"Calwaddo, Benaulim, Goa 403716",
  "desc":"A beachfront resort in Benaulim, South Goa, with a ballroom, sea-facing lawns and meeting venues for weddings and events.",
  "spaces":[["Saleta 1",50],["Saleta 2",50],["Sala Grande",500],["Beach Lawns",700],["Lobster Village Lawns",500],["Rain Forest Lawn",400],["Boardroom",11]],
  "rooms":["Villa Room Garden View (King/Twin)","Premium Villa Room Garden View (King/Twin)","Luxury Suite with Living Area Sea View","Executive Suite with Living Area Sea View","Presidential Villa with Plunge Pool","Two Bedroom Family Suite with Living Area Sea View","Two Bedroom Garden Villa Room"],
  "rstatus":"published","rurl":"https://www.tajhotels.com/en-in/hotels/taj-exotica-goa/rooms-and-suites",
  "rnote":"Category name as listed in VenueSearch research table (sourced from official Taj page). Size, occupancy and features not yet captured."},
 {"slug":"alila-diwa-goa","name":"Alila Diwa Goa","city":"Goa","dest":"Goa","type":"Luxury Resort","tags":["Resort","Luxury","Destination Wedding"],"status":"published","cap":0,"prefix":"alila-diwa-goa",
  "desc":"A resort in Goa offering the Udeta venue and the Alila Ballroom & Lawns for weddings and events.",
  "spaces":[["Udeta",null],["Alila Ballroom & Lawns",null]],
  "rooms":["1 King Bed Loft Room with Balcony","2 Twin Beds Loft Room with Balcony","1 King Bed Room with Balcony","2 Twin Beds Room with Balcony"],
  "rstatus":"published","rurl":"https://www.hyatt.com/alila-hotels-and-resorts/en-US/goial-alila-diwa-goa/rooms",
  "rnote":"Category name as listed in VenueSearch research table. Other categories still require verification."},
 {"slug":"grand-hyatt-kochi-bolgatty","name":"Grand Hyatt Kochi Bolgatty","city":"Kochi","dest":"Kochi","type":"Luxury Hotel","tags":["Luxury","Hotel","Backwater","Destination Wedding"],"status":"published","cap":0,"prefix":"grand-hyatt-kochi",
  "desc":"A hotel in Kochi, Kerala, with ballrooms, salons, a lawn and a houseboat venue for weddings and events.",
  "spaces":[["Liwa Ballroom",null],["Vembanad Ballroom",null],["Grand Ballroom",null],["Grand Salon 1 & 2",null],["The Residence Library",null],["Atelier 1–3",null],["Chef's Table",null],["The Houseboat",null],["Palm Lawn",null]],
  "rooms":["1 King Bed","2 Twin Beds","1 King Bed Backwater View","2 Twin Beds Backwater View","1 King Bed Club Access","2 Twin Beds Club Access","Grand Suite King","Grand Terrace Suite","Grand Executive Suite","Presidential Suite","Two Bedroom Villa","Three Bedroom Villa"],
  "rstatus":"published","rurl":"https://www.hyatt.com/grand-hyatt/en-US/cokgh-grand-hyatt-kochi-bolgatty/rooms",
  "rnote":"Category name as listed in VenueSearch research table. Size, occupancy and features not yet captured."}
]$j$::jsonb;
  v jsonb; vid uuid; s jsonb; r text; i int;
BEGIN
  FOR v IN SELECT * FROM jsonb_array_elements(data) LOOP
    vid := NULL;
    INSERT INTO venues(name, slug, city, destination, country, type, description, capacity_max, indicative_price, address, status, featured, verified, tags)
    VALUES (v->>'name', v->>'slug', v->>'city', v->>'dest', 'India', v->>'type', v->>'desc', (v->>'cap')::int, 0, v->>'address', (v->>'status')::venue_status, false, false,
            ARRAY(SELECT jsonb_array_elements_text(v->'tags')))
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO vid;
    IF vid IS NOT NULL THEN
      FOR s IN SELECT * FROM jsonb_array_elements(v->'spaces') LOOP
        INSERT INTO venue_spaces(venue_id, name, slug, capacity)
        VALUES (vid, s->>0, (v->>'prefix') || '-' || trim(both '-' from lower(regexp_replace(s->>0,'[^a-zA-Z0-9]+','-','g'))), NULLIF(s->>1,'')::int);
      END LOOP;
      i := 0;
      FOR r IN SELECT jsonb_array_elements_text(v->'rooms') LOOP
        i := i + 1;
        INSERT INTO venue_rooms(venue_id, slug, name, source_url, source_note, status, sort_order)
        VALUES (vid, trim(both '-' from lower(regexp_replace(r,'[^a-zA-Z0-9]+','-','g'))), r, v->>'rurl', v->>'rnote', v->>'rstatus', i);
      END LOOP;
    END IF;
  END LOOP;
END
$do$;
