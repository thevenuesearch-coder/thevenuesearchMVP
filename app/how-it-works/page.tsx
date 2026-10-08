import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { pageMetadata, absoluteUrl, SITE_NAME, SITE_URL } from "../../lib/seo";
import { serializeJsonLd } from "../../lib/structured-data";
import { fetchVenuesServer } from "../../lib/venues";
import { imgProps } from "../../lib/image";
import styles from "./how-it-works.module.css";

/* -------------------------------------------------------------------------
   How It Works — VenueSearch
   Server component. No client JS: the FAQ uses native <details>; every infographic is
   plain HTML/CSS/inline SVG.

   The hero collage uses real venue photos from Supabase when they can be fetched, and
   falls back to a decorative SVG when they cannot. Nothing else on the page is data-driven:
   the comparison graphic uses neutral placeholders, never made-up values.

   ACCURACY: every product claim below was checked against this repo
   (app/book/*, app/compare, components/PublicVenueDetails, app/profile, lib/compare).
   Starting prices are deliberately NOT mentioned: SHOW_PUBLIC_STARTING_PRICE is false.
   Organization + WebSite JSON-LD already come from app/layout.tsx, so they are not
   repeated here.
   ------------------------------------------------------------------------- */

/* Hero photos refresh hourly; the page stays cacheable. */
export const revalidate = 3600;

const PAGE_PATH = "/how-it-works";
const PAGE_URL = absoluteUrl(PAGE_PATH);

const TITLE = "How VenueSearch Works | Find, Compare & Book Wedding Venues";
const DESCRIPTION =
  "Discover, compare and book wedding venues in India. See how VenueSearch takes you from first search to a held date, with verified venue profiles.";

const base = pageMetadata({
  title: "How VenueSearch Works",
  description: DESCRIPTION,
  path: PAGE_PATH,
});

export const metadata: Metadata = {
  ...base,
  // `absolute` stops the root "%s | The Venue Search" template from lengthening the title.
  title: { absolute: TITLE },
  openGraph: { ...base.openGraph, title: TITLE },
  twitter: { ...base.twitter, title: TITLE },
};

/* ---- Routes (all confirmed on the live site's header/footer) ------------- */
const ROUTES = {
  explore: "/explore",
  collections: "/collections",
  weddingVenues: "/wedding-venues",
  forVenues: "/for-venues",
  planner: "/planner",
  compare: "/compare",
  shortlist: "/profile#shortlist",
  bookings: "/profile#bookings",
} as const;

/* ---- Icons (inline SVG, decorative) -------------------------------------- */
function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className ?? styles.icon}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const I = {
  search: (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </Icon>
  ),
  explore: (
    <Icon>
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6h6v6M9 11h.01M15 11h.01" />
    </Icon>
  ),
  compare: (
    <Icon>
      <rect x="3" y="4" width="7" height="16" rx="1.5" />
      <rect x="14" y="4" width="7" height="16" rx="1.5" />
    </Icon>
  ),
  heart: (
    <Icon>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </Icon>
  ),
  plan: (
    <Icon>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6" />
    </Icon>
  ),
  book: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
      <path d="m9 16 2 2 4-4" />
    </Icon>
  ),
  details: (
    <Icon>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  ),
  pin: (
    <Icon>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Icon>
  ),
  spaces: (
    <Icon>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </Icon>
  ),
  guests: (
    <Icon>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.4c1.8.8 3 2.6 3 5.6" />
    </Icon>
  ),
  bed: (
    <Icon>
      <path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />
      <circle cx="7" cy="11" r="1.6" />
    </Icon>
  ),
  camera: (
    <Icon>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  ),
  proposal: (
    <Icon>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </Icon>
  ),
  fit: (
    <Icon>
      <path d="m12 3 2.2 5.3L20 9l-4.3 3.9L17 19l-5-3-5 3 1.3-6.1L4 9l5.8-.7L12 3Z" />
    </Icon>
  ),
  calendar: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </Icon>
  ),
  wallet: (
    <Icon>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-1Z" />
      <circle cx="16.5" cy="14" r="1.2" />
    </Icon>
  ),
  checklist: (
    <Icon>
      <path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" />
      <path d="M12 6.5h8M12 12.5h8M12 18.5h8" />
    </Icon>
  ),
  access: (
    <Icon>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M12 8v6l3 5M12 11h5M9.5 21a5 5 0 0 1-1.5-9" />
    </Icon>
  ),
  party: (
    <Icon>
      <path d="M4 20 9 6l9 9-14 5Z" />
      <path d="M14 4v2M19 8h2M18 3l-1 1.5M20 13l-1.5-.5" />
    </Icon>
  ),
  check: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16 9.5" />
    </Icon>
  ),
};

/* ---- Content ------------------------------------------------------------- */

type Step = {
  title: string;
  body: string;
  icon: ReactNode;
  link?: { href: string; label: string };
};

const STEPS: Step[] = [
  {
    title: "Discover",
    icon: I.search,
    body: "Search by destination, venue type and guest capacity.",
    link: { href: ROUTES.explore, label: "Search venues" },
  },
  {
    title: "Explore",
    icon: I.explore,
    body: "Open a profile to see its spaces, rooms and photos.",
  },
  {
    title: "Compare",
    icon: I.compare,
    body: "Put up to four venues side by side.",
    link: { href: ROUTES.compare, label: "Compare venues" },
  },
  {
    title: "Shortlist",
    icon: I.heart,
    body: "Save your favourites and return to them anytime.",
    link: { href: ROUTES.shortlist, label: "Your shortlist" },
  },
  {
    title: "Review & Plan",
    icon: I.plan,
    body: "Share your date, guest count and budget with the venue.",
  },
  {
    title: "Book",
    icon: I.book,
    body: "Hold a date or book online to secure it.",
    link: { href: ROUTES.bookings, label: "Your bookings" },
  },
];

const BOOKING_OPTIONS = ["Venue Only", "Rooms Only", "Venue + Rooms"];

const FIT_FLOW: { label: string; icon: ReactNode }[] = [
  { label: "Guest Count", icon: I.guests },
  { label: "Event Type", icon: I.party },
  { label: "Venue", icon: I.explore },
  { label: "Booking", icon: I.check },
];

const COMPARE_ROWS = ["Location", "Guest capacity", "Rooms", "Event spaces"];

const INFO: { title: string; body: string; icon: ReactNode }[] = [
  { title: "Venue Details", body: "Highlights, services and inclusions where provided.", icon: I.details },
  { title: "Location", body: "Destination, city and venue type.", icon: I.pin },
  { title: "Event Spaces", body: "Spaces for your ceremony, reception and functions.", icon: I.spaces },
  { title: "Guest Capacity", body: "How many guests each venue can host.", icon: I.guests },
  { title: "Rooms", body: "Room categories where a venue offers stays.", icon: I.bed },
  { title: "Photos", body: "Real venue imagery to judge each space.", icon: I.camera },
  { title: "Pricing", body: "Request a proposal for your date and guest count.", icon: I.proposal },
  { title: "Event Suitability", body: "See which spaces fit your guests and event.", icon: I.fit },
];

const PLANNING: { title: string; body: string; icon: ReactNode }[] = [
  { title: "Guest Capacity", body: "Match your guest count to each ceremony and reception space.", icon: I.guests },
  { title: "Location", body: "Think about travel time, airport access and road links.", icon: I.pin },
  { title: "Rooms", body: "Check room numbers and categories if guests stay on site.", icon: I.bed },
  { title: "Event Spaces", body: "List your functions, then check each has a suitable space.", icon: I.spaces },
  { title: "Dates", body: "Keep two or three date options ready; peak dates go fast.", icon: I.calendar },
  { title: "Budget", body: "Ask what is included and what is charged separately.", icon: I.wallet },
  { title: "Requirements", body: "Check rules on vendors, music, timings and decor.", icon: I.checklist },
  { title: "Accessibility", body: "Look at step-free access, parking and vendor loading.", icon: I.access },
];

const FAQS: { q: string; a: string; cta?: { href: string; label: string } }[] = [
  {
    q: "What is VenueSearch?",
    a: "VenueSearch (The Venue Search) is a wedding venue booking platform for India. Discover, compare and book wedding and event venues in one place.",
  },
  {
    q: "How does VenueSearch work?",
    a: "Discover venues by destination, venue type and guest capacity, then explore profiles, compare and shortlist. When one looks right, send an enquiry, request a proposal or start a booking, and secure your date with an Instant Hold or online booking.",
  },
  {
    q: "How can I find a wedding venue on VenueSearch?",
    a: "Use the Explore page to filter by destination, venue type and guest capacity, or browse curated collections for ideas.",
    cta: { href: ROUTES.explore, label: "Explore wedding venues" },
  },
  {
    q: "Can I compare wedding venues before booking?",
    a: "Yes. Compare up to four venues side by side on venue type, guest capacity, room categories and event spaces. A blank cell means no verified value is available yet.",
    cta: { href: ROUTES.compare, label: "Compare venues" },
  },
  {
    q: "Can I search wedding venues based on guest count?",
    a: "Yes. Filter by guest capacity on the Explore page. When you start a booking, the spaces offered are the ones that fit your guest count.",
  },
  {
    q: "Can I check the rooms available at a wedding venue?",
    a: "Where a venue offers accommodation, its profile lists rooms and room categories. You can book Venue Only, Rooms Only or Venue + Rooms.",
  },
  {
    q: "Can I book a wedding venue through VenueSearch?",
    a: "Yes. Send an enquiry or request a proposal, or start a booking for the venue, rooms or both. Booking moves through event details, room details if needed, and review and payment.",
  },
  {
    q: "How does the VenueSearch booking process work?",
    a: "Enter your event dates, guest count and spaces, add room details if you are booking rooms, then review and pay online to secure it. The remaining balance is settled directly with the venue or hotel under its payment terms.",
  },
  {
    q: "What is the difference between Instant Hold and Instant Book?",
    a: "An Instant Hold provisionally reserves a date on your main venue while you finalise decisions. Instant Book is for eligible smaller sub-events, such as mehendi, sangeet or haldi spaces, where confirmation can happen immediately.",
  },
  {
    q: "Does VenueSearch prevent double bookings?",
    a: "VenueSearch is built around a no-double-booking guarantee. Competing requests for the same venue space and date are resolved at the database layer, so a date cannot be confirmed twice.",
  },
  {
    q: "Can I find destination wedding venues in India?",
    a: "Yes, starting with a Hyderabad launch. The Explore page shows the destinations and venues currently listed.",
    cta: { href: ROUTES.weddingVenues, label: "Browse wedding venues" },
  },
  {
    q: "How do I choose the right wedding venue?",
    a: "Start with your guest count, dates and budget, then compare venues on location, event spaces, rooms and inclusions. The checklist on this page covers what to check.",
    cta: { href: "#planning", label: "See what to check before booking" },
  },
  {
    q: "Can wedding planners and venues use VenueSearch?",
    a: "Yes. VenueSearch has a planner workspace for planners, and venues can apply to be listed.",
    cta: { href: ROUTES.forVenues, label: "List your venue" },
  },
];

/* ---- India outline (simplified, decorative) ------------------------------ */
/* [lon, lat] points projected into a ~205x192 box. Illustration only, not a survey map. */
const INDIA_OUTLINE: [number, number][] = [
  [68.2, 23.7], [68.9, 22.3], [70.4, 20.8], [72.5, 21.3], [72.9, 19.9], [72.8, 19.0],
  [73.4, 17.0], [73.8, 15.5], [74.8, 12.9], [76.2, 9.9], [77.5, 8.1], [78.4, 8.9],
  [79.8, 10.3], [80.3, 13.1], [80.1, 15.4], [81.8, 16.8], [83.3, 17.7], [85.0, 19.4],
  [86.0, 19.8], [87.0, 21.3], [88.4, 21.7], [88.7, 22.6], [88.1, 24.4], [88.9, 25.2],
  [90.2, 25.2], [91.6, 25.1], [92.3, 24.2], [92.6, 22.0], [93.3, 23.3], [94.3, 24.0],
  [94.6, 25.6], [95.2, 26.8], [96.5, 27.3], [97.3, 28.2], [95.8, 29.2], [93.5, 28.6],
  [91.7, 27.8], [89.6, 28.2], [88.9, 27.2], [88.1, 27.9], [86.0, 27.9], [84.2, 28.4],
  [81.9, 30.0], [80.2, 30.8], [79.0, 31.4], [78.8, 32.7], [79.4, 34.0], [78.3, 35.5],
  [76.5, 35.8], [75.2, 36.9], [74.1, 36.0], [74.5, 34.7], [74.0, 33.1], [74.3, 32.1],
  [74.6, 31.1], [73.9, 30.2], [71.8, 29.0], [71.0, 28.0], [70.2, 27.0], [69.6, 26.0],
  [70.2, 25.0], [68.9, 24.3],
];

const project = ([lon, lat]: [number, number]) => ({
  x: Math.round((lon - 66.5) * 6.4 * 10) / 10,
  y: Math.round((38 - lat) * 6.4 * 10) / 10,
});

const INDIA_PATH =
  INDIA_OUTLINE.map((pt, i) => {
    const { x, y } = project(pt);
    return `${i === 0 ? "M" : "L"}${x} ${y}`;
  }).join(" ") + " Z";

const HYDERABAD = project([78.48, 17.39]);

/* ---- Hero photos (real venue images, with graceful fallback) ------------- */
type HeroPhoto = { name: string; destination: string; image: string };

async function getHeroPhotos(): Promise<HeroPhoto[]> {
  try {
    const venues = await fetchVenuesServer();
    const seen = new Set<string>();
    const photos: HeroPhoto[] = [];
    for (const v of venues) {
      if (!v.image || seen.has(v.image)) continue;
      seen.add(v.image);
      photos.push({ name: v.name, destination: v.destination || v.city, image: v.image });
      if (photos.length === 3) break;
    }
    return photos;
  } catch {
    return [];
  }
}

/* ---- Structured data: built from the same arrays that render the page ---- */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "en-IN",
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${PAGE_URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "How it works", item: PAGE_URL },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

const jsonLd = serializeJsonLd(structuredData);

/* ---- Page ---------------------------------------------------------------- */
export default async function HowItWorksPage() {
  const photos = await getHeroPhotos();

  return (
    <main id="main-content" className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.container}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">How it works</li>
            </ol>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>How VenueSearch works</p>
              <h1 className={styles.heroTitle}>
                Find, Compare &amp; Book Your Perfect Wedding Venue
              </h1>
              <p className={styles.heroLead}>
                A simpler way to discover, compare and book wedding venues across India.
              </p>
              <div className={styles.actions}>
                <Link href={ROUTES.explore} className={styles.btnPrimary}>
                  Explore Venues
                </Link>
                <Link href={ROUTES.compare} className={styles.btnGhost}>
                  Compare Venues
                </Link>
              </div>
            </div>

            {photos.length > 0 ? (
              <div
                className={`${styles.collage} ${
                  photos.length === 1 ? styles.collageOne : photos.length === 2 ? styles.collageTwo : ""
                }`}
              >
                {photos.map((photo, i) => (
                  <figure
                    key={photo.image}
                    className={`${styles.shot} ${i === 0 ? styles.shotMain : styles.shotSide}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      {...imgProps(photo.image, `${photo.name}, ${photo.destination}`, {
                        width: i === 0 ? 720 : 480,
                        height: i === 0 ? 900 : 560,
                        sizes: i === 0 ? "(min-width: 62rem) 26rem, 60vw" : "(min-width: 62rem) 16rem, 40vw",
                        priority: i === 0,
                      })}
                    />
                    <figcaption>
                      <strong>{photo.name}</strong>
                      {photo.destination ? <span>{photo.destination}</span> : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className={styles.collageFallback} aria-hidden="true">
                <svg viewBox="0 0 400 420" className={styles.heroArt} focusable="false">
                  <defs>
                    <linearGradient id="hiw-sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#2a2350" />
                      <stop offset="1" stopColor="#0f1b3a" />
                    </linearGradient>
                    <linearGradient id="hiw-glow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#28b9d3" />
                      <stop offset="1" stopColor="#8e6bea" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="420" rx="28" fill="url(#hiw-sky)" />
                  <g fill="none" stroke="url(#hiw-glow)" strokeWidth="2.5">
                    <path d="M70 360V200a130 130 0 0 1 260 0v160" />
                    <path d="M105 360V205a95 95 0 0 1 190 0v155" opacity=".7" />
                    <path d="M140 360V210a60 60 0 0 1 120 0v150" opacity=".45" />
                  </g>
                  <g stroke="#f7f4ef" strokeWidth="2" opacity=".85">
                    <path d="M200 70v34" />
                    <path d="M180 104h40l-8 26h-24Z" fill="#28b9d3" fillOpacity=".25" />
                  </g>
                  <rect x="40" y="360" width="320" height="10" rx="5" fill="#f7f4ef" opacity=".25" />
                  <circle cx="82" cy="332" r="6" fill="#8e6bea" />
                  <circle cx="318" cy="332" r="6" fill="#28b9d3" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main infographic: the journey */}
      <section className={`${styles.section} ${styles.journey}`} aria-labelledby="journey-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Six simple steps</p>
            <h2 id="journey-title" className={styles.h2}>
              How VenueSearch Works
            </h2>
            <p className={styles.lead}>From first search to a secured date.</p>
          </div>

          <ol className={styles.journeySteps}>
            {STEPS.map((step, i) => (
              <li key={step.title} id={`step-${i + 1}`} className={styles.jStep}>
                <span className={styles.jNode}>
                  {step.icon}
                  <span className={styles.jNum} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <div className={styles.jBody}>
                  <h3 className={styles.jTitle}>
                    <span className={styles.srOnly}>Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p>{step.body}</p>
                  {step.link && (
                    <Link href={step.link.href} className={styles.jLink}>
                      {step.link.label}
                      <span aria-hidden="true"> &rarr;</span>
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.bookStrip}>
            <p className={styles.bookStripLabel}>Booking options</p>
            <ul className={styles.pills}>
              {BOOKING_OPTIONS.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <p className={styles.bookStripNote}>
              Secure a date with an Instant Hold, or pay online to book.{" "}
              <Link href={ROUTES.planner}>Planners: open the workspace</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Visual comparison section */}
      <section className={`${styles.section} ${styles.tinted}`} aria-labelledby="decisions-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 id="decisions-title" className={styles.h2}>
              Make Better Venue Decisions
            </h2>
          </div>

          <ul className={styles.vizGrid}>
            <li className={styles.vizCard}>
              <div className={styles.vizBox} aria-hidden="true">
                <div className={styles.cmp}>
                  <span />
                  <b>Venue A</b>
                  <b>Venue B</b>
                  {COMPARE_ROWS.map((row) => (
                    <div key={row} className={styles.cmpRow}>
                      <span>{row}</span>
                      <i />
                      <i />
                    </div>
                  ))}
                </div>
              </div>
              <h3 className={styles.h3}>Compare Side by Side</h3>
              <p>Location, guest capacity, rooms and event spaces in one view.</p>
            </li>

            <li className={styles.vizCard}>
              <div className={`${styles.vizBox} ${styles.mapBox}`} aria-hidden="true">
                <svg viewBox="-2 -2 210 198" className={styles.map} focusable="false">
                  <path d={INDIA_PATH} className={styles.mapShape} />
                  <circle cx={HYDERABAD.x} cy={HYDERABAD.y} r="10" className={styles.pulse} />
                  <circle cx={HYDERABAD.x} cy={HYDERABAD.y} r="4.5" className={styles.pinDot} />
                  <text x={HYDERABAD.x + 10} y={HYDERABAD.y + 4} className={styles.mapLabel}>
                    Hyderabad
                  </text>
                </svg>
              </div>
              <h3 className={styles.h3}>Discover Across India</h3>
              <p>Search destinations across India, starting with Hyderabad.</p>
            </li>

            <li className={styles.vizCard}>
              <div className={styles.vizBox} aria-hidden="true">
                <ol className={styles.flow}>
                  {FIT_FLOW.map((f) => (
                    <li key={f.label}>
                      <span className={styles.flowNode}>{f.icon}</span>
                      <span className={styles.flowLabel}>{f.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <h3 className={styles.h3}>Find the Right Fit</h3>
              <p>Guest count and event type lead you to the right venue, then to booking.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* Venue information */}
      <section className={styles.section} aria-labelledby="info-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 id="info-title" className={styles.h2}>
              What you will find on every venue
            </h2>
            <p className={styles.lead}>
              Profiles follow one structure, and show only what has been provided and verified.
            </p>
          </div>

          <ul className={styles.iconGrid}>
            {INFO.map((item) => (
              <li key={item.title} className={styles.iconCard}>
                <span className={styles.iconBadge}>{item.icon}</span>
                <h3 className={styles.iconTitle}>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>

          <p className={styles.inlineCta}>
            See it for yourself: <Link href={ROUTES.explore}>explore wedding venues</Link> or{" "}
            <Link href={ROUTES.collections}>browse collections</Link>.
          </p>
        </div>
      </section>

      {/* Planning */}
      <section
        id="planning"
        className={`${styles.section} ${styles.tinted}`}
        aria-labelledby="planning-title"
      >
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 id="planning-title" className={styles.h2}>
              What Should You Check Before Booking?
            </h2>
          </div>

          <ul className={styles.iconGrid}>
            {PLANNING.map((item) => (
              <li key={item.title} className={`${styles.iconCard} ${styles.checkCard}`}>
                <span className={styles.iconBadge}>{item.icon}</span>
                <h3 className={styles.iconTitle}>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.section} aria-labelledby="faq-title">
        <div className={`${styles.container} ${styles.faqWrap}`}>
          <h2 id="faq-title" className={styles.h2}>
            Frequently asked questions
          </h2>
          <div className={styles.faq}>
            {FAQS.map((item) => (
              <details key={item.q} name="faq" className={styles.faqItem}>
                <summary>
                  <h3 className={styles.faqQ}>{item.q}</h3>
                </summary>
                <div className={styles.faqA}>
                  <p>{item.a}</p>
                  {item.cta && (
                    <p>
                      <Link href={item.cta.href}>{item.cta.label}</Link>
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className={`${styles.section} ${styles.band}`} aria-labelledby="cta-title">
        <div className={`${styles.container} ${styles.ctaBlock}`}>
          <h2 id="cta-title" className={`${styles.h2} ${styles.onDark}`}>
            Find Your Perfect Wedding Venue Today
          </h2>
          <div className={styles.actions}>
            <Link href={ROUTES.explore} className={styles.btnPrimary}>
              Explore Venues
            </Link>
            <Link href={ROUTES.compare} className={styles.btnGhost}>
              Compare Venues
            </Link>
          </div>
          <nav aria-label="More from VenueSearch" className={styles.footLinks}>
            <Link href={ROUTES.weddingVenues}>Wedding venues</Link>
            <Link href={ROUTES.collections}>Venue collections</Link>
            <Link href={ROUTES.planner}>Planner workspace</Link>
            <Link href={ROUTES.forVenues}>List your venue</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
