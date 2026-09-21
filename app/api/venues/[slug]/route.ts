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

  return NextResponse.json({ data });
}
