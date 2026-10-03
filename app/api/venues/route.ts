import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
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
        capacity_min,
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
    .eq('status', 'published')
    .order('featured', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
