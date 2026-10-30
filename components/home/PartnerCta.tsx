import Link from 'next/link';
import { imgProps, isOptimizable } from '../../lib/image';

/* "List your venue with us" — links to the existing /for-venues partner flow. */
export function PartnerCta({ image, imageAlt }: { image?: string; imageAlt?: string }) {
  const items = [
    ['Increased visibility', 'Showcase your venue to a targeted audience.'],
    ['Connect with planners', 'Get enquiries from verified couples and planners.'],
    ['Grow your business', 'Be part of India’s leading wedding venue platform.'],
  ];

  return (
    <section className="vsSection vsWhite" aria-labelledby="partner-title">
      <div className="vsWrap partnerGridV2">
        <div>
          <span className="vsKicker">PARTNER WITH VENUESEARCH</span>
          <h2 id="partner-title">List your venue with us</h2>
          <p className="partnerLead">
            Reach engaged couples, wedding planners and event organisers looking for the perfect venue.
          </p>
          <ul className="partnerItems">
            {items.map(([t, d]) => (
              <li key={t}>
                <span className="partnerDot" aria-hidden="true" />
                <div>
                  <strong>{t}</strong>
                  <span>{d}</span>
                </div>
              </li>
            ))}
          </ul>
          <Link className="primaryBtn large" data-cursor="open" href="/for-venues">
            Partner with us →
          </Link>
        </div>

        {image && isOptimizable(image) && (
          <div className="partnerPhoto">
            <img
              {...imgProps(image, imageAlt || 'Partner venue', {
                width: 760,
                height: 640,
                sizes: '(max-width:900px) 90vw, 560px',
              })}
            />
          </div>
        )}
      </div>
    </section>
  );
}
