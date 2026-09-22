import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: 'A venue slug is required.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('venues')
    .select(
      `
        id,
        slug,
        name,
        destination,
        city,
        country,
        type,
        capacity_max,
        indicative_price,
        hold_fee,
        rating,
        verified,
        hero_image,
        tags,
        description,
        venue_spaces (
          id,
          slug,
          name,
          capacity,
          image_url,
          description,
          tags
        ),
        venue_rooms (
          id,
          slug,
          name,
          image_url,
          gallery_urls,
          bed_type,
          max_occupancy,
          occupancy_note,
          size_sqm,
          size_sqft,
          view_type,
          description,
          features,
          bathroom_details,
          amenities,
          technology,
          dining_details,
          services,
          special_inclusions,
          has_balcony,
          floor_location,
          source_url,
          status,
          sort_order
        )
      `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Venue not found.' },
      { status: 404 }
    );
  }

  /*
   * Rooms are filtered/sorted here rather than in the query
   * itself -- a Supabase nested select embeds the related rows
   * as-is, so 'draft' rooms would otherwise leak to the public
   * API before they're ready to publish.
   */
  const publishedRooms = (
    (data as any).venue_rooms || []
  )
    .filter((room: any) => room.status === 'published')
    .sort(
      (a: any, b: any) =>
        (a.sort_order || 0) - (b.sort_order || 0)
    );

  return NextResponse.json({
    data: {
      ...data,
      venue_rooms: publishedRooms,
    },
  });
}
