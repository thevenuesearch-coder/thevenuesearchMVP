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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Cursor />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
