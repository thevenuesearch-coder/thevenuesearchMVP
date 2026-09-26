import '../styles/globals.css';
import type { Metadata } from 'next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import Cursor from '../components/Cursor';

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
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
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
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Cursor />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
