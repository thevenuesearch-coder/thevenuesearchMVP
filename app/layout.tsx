import '../styles/globals.css';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import Cursor from '../components/Cursor';

export const metadata = {
  title: 'The Venue Search — Destination Wedding Venues',
  description: 'A trusted infrastructure layer for destination weddings and events.',
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
