import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { pageMetadata, absoluteUrl, SITE_NAME, SITE_URL } from "../../lib/seo";
import { serializeJsonLd } from "../../lib/structured-data";
import styles from "./how-it-works.module.css";

/* -------------------------------------------------------------------------
   How It Works — VenueSearch
   Server component. No client JS: the FAQ uses native <details> and the journey
   line uses CSS scroll-driven animation (progressive enhancement).

   ACCURACY: every product claim below was checked against this repo
   (app/book/*, app/compare, components/PublicVenueDetails, app/profile, lib/compare).
   Starting prices are deliberately NOT mentioned: SHOW_PUBLIC_STARTING_PRICE is false.
   Organization + WebSite JSON-LD already come from app/layout.tsx, so they are not
   repeated here.
   ------------------------------------------------------------------------- */

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
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className={styles.icon}
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

const icons = {
  discover: (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </Icon>
  ),
  evaluate: (
    <Icon>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  ),
  compare: (
    <Icon>
      <rect x="3" y="4" width="7" height="16" rx="1.5" />
      <rect x="14" y="4" width="7" height="16" rx="1.5" />
    </Icon>
  ),
  request: (
    <Icon>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </Icon>
  ),
  hold: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
      <path d="m9 16 2 2 4-4" />
    </Icon>
  ),
  track: (
    <Icon>
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </Icon>
  ),
};

/* ---- Content ------------------------------------------------------------- */

type Step = {
  title: string;
  body: string;
  icon: ReactNode;
  details?: string[];
  links?: { href: string; label: string }[];
};

const STEPS: Step[] = [
  {
    title: "Discover",
    icon: icons.discover,
    body: "Find wedding venues by destination, venue type and guest capacity. Start from the full list of venues, or browse curated collections if you are still deciding where to celebrate.",
    links: [
      { href: ROUTES.explore, label: "Search wedding venues" },
      { href: ROUTES.collections, label: "Browse venue collections" },
    ],
  },
  {
    title: "Evaluate",
    icon: icons.evaluate,
    body: "Open a venue profile to review its location, venue type, event spaces, guest capacity, guest rooms and photography, along with highlights, services and inclusions where the venue provides them. The aim is to judge a venue on facts, not on a forwarded brochure.",
  },
  {
    title: "Compare",
    icon: icons.compare,
    body: "Choose up to four venues and see them side by side: venue type, guest capacity, room categories and event and function spaces. Only verified details are shown, and a blank means no verified value is available yet, never a guess. You can also keep a shortlist of favourites.",
    links: [
      { href: ROUTES.compare, label: "Compare venues side by side" },
      { href: ROUTES.shortlist, label: "Open your shortlist" },
    ],
  },
  {
    title: "Request",
    icon: icons.request,
    body: "Ask a question, request a proposal or start an assisted booking when a venue looks right. An enquiry takes your event date, guest count and estimated budget, so the venue can respond with the right information.",
  },
  {
    title: "Hold or book",
    icon: icons.hold,
    body: "An Instant Hold lets you provisionally reserve a date on your main venue while you finalise decisions. For booking, you choose Venue Only, Rooms Only or Venue + Rooms and move through three stages.",
    details: [
      "Event details: your event dates and guest count, and the venue spaces that fit your guests.",
      "Room details: if you are booking rooms, your check-in and check-out dates and room categories.",
      "Review and payment: check your booking, then pay online to secure it. The remaining balance is settled directly with the venue or hotel under its payment terms.",
    ],
  },
  {
    title: "Confirm and track",
    icon: icons.track,
    body: "Once payment completes you see confirmation for the dates you selected. Your bookings and shortlist stay in your profile, and planners can manage a wedding and its sub-events from the planner workspace.",
    links: [
      { href: ROUTES.bookings, label: "See your bookings" },
      { href: ROUTES.planner, label: "Open the planner workspace" },
    ],
  },
];

const WHY: { title: string; body: string }[] = [
  {
    title: "Wedding venues in one place",
    body: "Search wedding venues and event venues from a single platform instead of piecing options together from messages, calls and PDFs.",
  },
  {
    title: "Compare venues side by side",
    body: "Wedding venue comparison works best on the same verified details. Put up to four venues next to each other and see the differences, not how each venue presents itself.",
  },
  {
    title: "Search by guest capacity",
    body: "Filter by guest capacity from the first search, and when you book, the spaces offered are the ones that fit your guest count.",
  },
  {
    title: "Verified profiles, real imagery",
    body: "Venue profiles are built around verified information and authentic photography, so you know what you are evaluating.",
  },
  {
    title: "Rooms and venue in one booking",
    body: "Book the venue, the rooms, or both in a single flow, with your event dates, check-in and check-out and requirements kept together.",
  },
  {
    title: "Built for planners as well as couples",
    body: "A planner workspace and a shortlist you can return to keep everyone working from the same picture.",
  },
];

const FIND: { term: string; detail: string }[] = [
  {
    term: "Location and venue type",
    detail: "Where the venue is and what kind of venue it is, such as a luxury hotel or banquet hall.",
  },
  {
    term: "Event and function spaces",
    detail: "The spaces available for your ceremony, reception and other functions.",
  },
  {
    term: "Guest capacity",
    detail: "How many guests the venue can host, so you can match it to your guest list.",
  },
  {
    term: "Guest rooms",
    detail: "Rooms and room categories where the venue offers accommodation, with in-room amenities where provided.",
  },
  {
    term: "Photography",
    detail: "Real imagery of the venue so you can judge its spaces and atmosphere.",
  },
  {
    term: "Highlights, services and inclusions",
    detail: "What the venue highlights, the services it offers and any special inclusions, where provided.",
  },
  {
    term: "Booking options",
    detail: "Whether to send an enquiry, request a proposal, start an assisted booking or book online.",
  },
];

const PLANNING: { title: string; body: string }[] = [
  {
    title: "Guest capacity",
    body: "Decide your realistic guest count first, then check how it fits each ceremony and reception space. A venue that holds your guests for a seated dinner may feel very different when everyone is standing for the ceremony.",
  },
  {
    title: "Location and travel",
    body: "Think about how your guests will arrive. Distance from the nearest airport or station, road access and travel time matter even more for destination weddings, where most of your guests are travelling.",
  },
  {
    title: "Accommodation",
    body: "If you want a wedding venue with accommodation on site, find out how many rooms it has and in which categories, and whether you can hold a block for family. Where rooms are limited, plan nearby alternatives early.",
  },
  {
    title: "Event spaces",
    body: "Indian weddings often run across several functions: mehendi, sangeet, the ceremony and the reception. List the functions you want, then check that the venue has suitable spaces, indoor fallbacks and enough room to move between them.",
  },
  {
    title: "Dates and seasons",
    body: "Auspicious dates, peak wedding season, school holidays and monsoon months all affect availability and cost. Have two or three date options ready so you can choose the best venue and date together.",
  },
  {
    title: "Availability and holds",
    body: "Popular dates go quickly. Confirm availability for your exact dates and, if you need time to decide, ask whether the venue can hold the date for you.",
  },
  {
    title: "Budget",
    body: "Ask what is included in the venue price and what is charged separately, such as decoration, catering, power, taxes or overtime. Compare total cost, not just the headline number.",
  },
  {
    title: "Vendor and event requirements",
    body: "Check whether you can bring your own caterer, decorator and photographer, and what the venue's rules are on music, timings and fireworks or open flames.",
  },
  {
    title: "Accessibility and logistics",
    body: "Look at step-free access for elders and guests with mobility needs, parking, loading access for vendors, and where guests will wait between events.",
  },
];

const CHECKLIST: string[] = [
  "Is my exact date available, and can it be held?",
  "How many guests can each space host for the format I want?",
  "What is included in the price, and what is extra?",
  "How many rooms are available, and in which categories?",
  "Can I use my own vendors?",
  "What are the timing and music restrictions?",
  "Is there a weather or indoor backup plan?",
];

const FAQS: { q: string; a: string; cta?: { href: string; label: string } }[] = [
  {
    q: "What is VenueSearch?",
    a: "VenueSearch (The Venue Search) is an online wedding venue booking platform for India. You can discover, compare and book wedding venues and event venues, with venue profiles, shortlisting, enquiries and booking together in one place.",
  },
  {
    q: "How does VenueSearch work?",
    a: "You discover venues by destination, venue type and guest capacity, evaluate their profiles, then compare venues and shortlist favourites. When a venue looks right you send an enquiry, request a proposal or start a booking, secure your date with an Instant Hold or an online booking, and follow your bookings from your profile.",
  },
  {
    q: "How can I find a wedding venue on VenueSearch?",
    a: "Use the Explore page to look for wedding venues, filtering by destination, venue type and guest capacity. You can also browse curated collections if you want ideas before you decide on a location.",
    cta: { href: ROUTES.explore, label: "Explore wedding venues" },
  },
  {
    q: "Can I compare wedding venues before booking?",
    a: "Yes. The compare page lets you choose up to four venues and see them side by side: venue type, guest capacity, room categories and event and function spaces. Only verified details are shown, and a blank cell means no verified value is available yet.",
    cta: { href: ROUTES.compare, label: "Compare venues" },
  },
  {
    q: "Can I search wedding venues based on guest count?",
    a: "Yes. You can filter venues by guest capacity on the Explore page. When you start a booking, the venue spaces offered are the ones that can host your guest count.",
  },
  {
    q: "Can I check the rooms available at a wedding venue?",
    a: "Where a venue offers accommodation, its profile lists guest rooms and room categories. You can book the venue, the rooms, or both together by choosing Venue Only, Rooms Only or Venue + Rooms when you start a booking.",
  },
  {
    q: "Can I book a wedding venue through VenueSearch?",
    a: "Yes. You can send an enquiry or request a proposal, or start a booking for the venue, rooms or both. The booking moves through event details, room details if you are booking rooms, and a review and payment stage.",
  },
  {
    q: "How does the VenueSearch booking process work?",
    a: "You enter your event dates, guest count and venue spaces, add check-in and check-out dates and room categories if you are booking rooms, then review everything and pay online to secure the booking. The remaining balance is settled directly with the venue or hotel under its payment terms. You see confirmation for the dates you selected, and the booking appears in your profile.",
  },
  {
    q: "What is the difference between Instant Hold and Instant Book?",
    a: "An Instant Hold lets you provisionally reserve a date on your main venue while you finalise decisions. Instant Book is used for eligible smaller sub-events, such as mehendi, sangeet or haldi spaces, where confirmation can happen immediately.",
  },
  {
    q: "Does VenueSearch prevent double bookings?",
    a: "VenueSearch is built around a no-double-booking guarantee. Competing requests for the same venue space and date are resolved at the database layer, so one date cannot be confirmed twice.",
  },
  {
    q: "Can I find destination wedding venues in India?",
    a: "VenueSearch is built for finding destination wedding venues in India, starting with a Hyderabad launch. Search the Explore page to see which destinations and venues are currently listed.",
    cta: { href: ROUTES.weddingVenues, label: "Browse wedding venues" },
  },
  {
    q: "How do I choose the right wedding venue?",
    a: "Start with your guest count, dates and budget, then compare venues on location, event spaces, accommodation and what is included. The planning guide on this page lists the factors worth checking and questions to ask a venue before you commit.",
    cta: { href: "#planning", label: "Read the venue planning guide" },
  },
  {
    q: "Can wedding planners and venues use VenueSearch?",
    a: "Yes. VenueSearch has a planner workspace for planners, and venues can apply to be listed.",
    cta: { href: ROUTES.forVenues, label: "List your venue" },
  },
];

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
export default function HowItWorksPage() {
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
            <div>
              <h1 className={styles.heroTitle}>
                How VenueSearch Works: Find, Compare &amp; Book Wedding Venues
              </h1>
              <p className={styles.heroLead}>
                VenueSearch is a wedding venue search and booking platform for India. Discover,
                compare and book wedding venues and event venues in one place: search by
                destination and guest count, compare venues on consistent information, and secure
                your date.
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
            <nav aria-label="The six steps" className={styles.heroIndex}>
              <p>The six steps</p>
              <ol>
                {STEPS.map((step, i) => (
                  <li key={step.title}>
                    <a href={`#step-${i + 1}`}>{step.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </header>

      {/* Journey */}
      <section className={`${styles.section} ${styles.journey}`} aria-labelledby="journey-title">
        <div className={`${styles.container} ${styles.journeyGrid}`}>
          <div className={styles.journeyIntro}>
            <h2 id="journey-title" className={styles.h2}>
              From first search to a held date
            </h2>
            <p className={styles.lead}>
              Six steps take you from a long list of wedding venues to a confirmed date. Each step
              builds on the one before it.
            </p>
          </div>

          <ol className={styles.steps}>
            {STEPS.map((step, i) => (
              <li key={step.title} id={`step-${i + 1}`} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <article className={styles.card}>
                  <div className={styles.cardHead}>
                    {step.icon}
                    <h3 className={styles.h3}>
                      <span className={styles.srOnly}>Step {i + 1}: </span>
                      {step.title}
                    </h3>
                  </div>
                  <p>{step.body}</p>
                  {step.details && (
                    <ol className={styles.stages}>
                      {step.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ol>
                  )}
                  {step.links && (
                    <ul className={styles.linkList}>
                      {step.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href}>{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Guarantee */}
      <section className={`${styles.section} ${styles.band}`} aria-labelledby="guarantee-title">
        <div className={styles.container}>
          <h2 id="guarantee-title" className={`${styles.h2} ${styles.onDark}`}>
            One date, one booking
          </h2>
          <p className={`${styles.lead} ${styles.onDark}`}>
            VenueSearch is built around a no-double-booking guarantee. When more than one request
            arrives for the same venue space and date, the database decides which one succeeds, so
            a date can never be confirmed twice.
          </p>
        </div>
      </section>

      {/* Why */}
      <section className={styles.section} aria-labelledby="why-title">
        <div className={styles.container}>
          <h2 id="why-title" className={styles.h2}>
            Why use VenueSearch?
          </h2>
          <p className={styles.lead}>
            Choosing a venue is usually the first and biggest decision in a wedding. VenueSearch is
            designed to make it clearer and quicker.
          </p>
          <ul className={styles.grid}>
            {WHY.map((item) => (
              <li key={item.title} className={styles.tile}>
                <h3 className={styles.h3}>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What you can find */}
      <section
        className={`${styles.section} ${styles.tinted}`}
        aria-labelledby="find-title"
      >
        <div className={styles.container}>
          <h2 id="find-title" className={styles.h2}>
            What can you find on VenueSearch?
          </h2>
          <p className={styles.lead}>
            Venue profiles follow a consistent structure, so you can find what matters quickly and
            compare venues fairly. The details shown vary by venue, and a venue profile only
            includes what has been provided and verified.
          </p>
          <dl className={styles.findList}>
            {FIND.map((item) => (
              <div key={item.term} className={styles.findItem}>
                <dt>{item.term}</dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.inlineCta}>
            See it for yourself:{" "}
            <Link href={ROUTES.explore}>explore wedding venues</Link> or{" "}
            <Link href={ROUTES.collections}>browse collections</Link>.
          </p>
        </div>
      </section>

      {/* Planning guide */}
      <section
        id="planning"
        className={`${styles.section} ${styles.planning}`}
        aria-labelledby="planning-title"
      >
        <div className={styles.container}>
          <h2 id="planning-title" className={styles.h2}>
            Planning a wedding venue? Here&rsquo;s what to consider
          </h2>
          <p className={styles.lead}>
            If you are wondering how to choose a wedding venue, these are the things that most
            often decide how a venue works in practice, whether or not you use VenueSearch. Settle
            them early and wedding venue selection gets much simpler.
          </p>

          <div className={styles.guide}>
            {PLANNING.map((item) => (
              <article key={item.title} className={styles.guideItem}>
                <h3 className={styles.h3}>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <aside className={styles.checklist} aria-labelledby="checklist-title">
            <h3 id="checklist-title" className={styles.h3}>
              Questions to ask before you book a venue
            </h3>
            <ul>
              {CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>

          <p className={styles.inlineCta}>
            Ready to put this into practice? Start with{" "}
            <Link href={ROUTES.weddingVenues}>wedding venues</Link> or look through our{" "}
            <Link href={ROUTES.collections}>venue collections</Link> for destination wedding ideas.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className={`${styles.section} ${styles.tinted}`}
        aria-labelledby="faq-title"
      >
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
            Ready to find your venue?
          </h2>
          <p className={`${styles.lead} ${styles.onDark}`}>
            Explore, compare and choose the right wedding venue for your celebration.
          </p>
          <div className={styles.actions}>
            <Link href={ROUTES.weddingVenues} className={styles.btnPrimary}>
              Explore Wedding Venues
            </Link>
            <Link href={ROUTES.compare} className={styles.btnGhost}>
              Compare Venues
            </Link>
          </div>
          <p className={`${styles.small} ${styles.onDark}`}>
            Run a venue? <Link href={ROUTES.forVenues}>List your venue on VenueSearch</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
