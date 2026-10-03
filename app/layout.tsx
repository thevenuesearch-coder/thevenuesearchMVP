import '../styles/globals.css';
import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import CursorLoader from '../components/CursorLoader';
import StyledJsxRegistry from '../components/StyledJsxRegistry';

/*
 * Fonts are self-hosted by next/font: no render-blocking request to
 * fonts.googleapis.com, no second hop to fonts.gstatic.com, and a
 * size-adjusted fallback font so text doesn't shift when they load.
 * Same families as before; exposed as CSS variables used by
 * --sans / --serif in globals.css.
 */
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://venuesearch.in'),
  title: {
    default:
      'The Venue Search — Verified Destination Wedding Venues in India',
    template: '%s | The Venue Search',
  },
  description:
    'Discover and book verified destination wedding venues in Hyderabad and across India. Transparent pricing, real availability, and a booking journey built for couples and planners.',
  openGraph: {
    siteName: 'The Venue Search',
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/logo.png', alt: 'The Venue Search' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  verification: {
    google: '4HOlSOS6CARj98VJsSfdyc6QEorwMzImj4wX6tp3ULY',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'The Venue Search',
  url: 'https://venuesearch.in',
  logo: 'https://venuesearch.in/logo.png',
  description:
    'A verified venue discovery and booking platform for wedding and event venues across India.',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'The Venue Search',
  url: 'https://venuesearch.in',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://venuesearch.in/explore?destination={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <a href="#main-content" className="vs-skip-link">
          Skip to main content
        </a>
        <StyledJsxRegistry>
          <CursorLoader />
          <Header />
          {children}
          <Footer />
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
