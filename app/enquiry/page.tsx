import EnquiryClient from './EnquiryClient';

type SearchParams = {
  venue?: string | string[];
  space?: string | string[];
};

type EnquiryPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function EnquiryPage({
  searchParams,
}: EnquiryPageProps) {
  const params = await searchParams;

  const venueId =
    typeof params.venue === 'string'
      ? params.venue
      : Array.isArray(params.venue)
        ? params.venue[0]
        : '';

  const spaceId =
    typeof params.space === 'string'
      ? params.space
      : Array.isArray(params.space)
        ? params.space[0]
        : '';

  return (
    <EnquiryClient
      venueId={venueId}
      spaceId={spaceId}
    />
  );
}