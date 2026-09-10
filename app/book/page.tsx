import { venues } from '../../lib/data';
import BookForm from './BookForm';

type PageProps = {
  searchParams: Promise<{
    venue?: string;
    mode?: string;
  }>;
};

export default async function Book({ searchParams }: PageProps) {
  const params = await searchParams;
  const venue = venues.find((x) => x.id === params.venue) || venues[0];
  const mode = params.mode || 'enquiry';

  return <BookForm venueName={venue.name} venueId={venue.id} mode={mode} />;
}
