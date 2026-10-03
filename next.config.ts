import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/venues/hyderabad-1',
        destination: '/venues/taj-falaknuma-palace-hyderabad',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-2',
        destination: '/venues/hilton-hyderabad-genome-valley-resort-spa',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-3',
        destination: '/venues/novotel-hyderabad-convention-centre',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-4',
        destination: '/venues/trident-hyderabad',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-5',
        destination: '/venues/radisson-hotel-hyderabad-hitec-city',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-6',
        destination: '/venues/itc-kohenur-hyderabad',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-7',
        destination: '/venues/westin-hyderabad-mindspace',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-8',
        destination: '/venues/taj-krishna-hyderabad',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-9',
        destination: '/venues/hyderabad-marriott-hotel-convention-centre',
        permanent: true,
      },
      {
        source: '/venues/hyderabad-10',
        destination: '/venues/park-hyatt-hyderabad',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
