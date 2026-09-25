import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'List Your Venue',
  description:
    'Turn availability into better demand. List your hotel or venue on The Venue Search for qualified wedding enquiries, calendar visibility and higher-intent bookings.',
};

export default function ForVenues(){return <main className="partner"><div className="partnerHero"><span className="kicker">FOR VENUE PARTNERS</span><h1>Turn availability into <em>better demand.</em></h1><p>Venue Search gives premium hotels and venues a trusted infrastructure layer for qualified enquiries, calendar visibility and higher-intent bookings.</p><Link data-cursor="open" className="primaryBtn" href="mailto:thevenuesearch@gmail.com?subject=Venue%20Partner%20Enquiry">Become a partner →</Link></div><div className="partnerGrid">{[['01','Verified profile','Present your capacity, spaces, policies, logistics and pricing in a consistent format.'],['02','Demand intelligence','Understand what planners and couples are searching for — not just who sends an enquiry.'],['03','Calendar control','Manage availability and protect your inventory from conflicting holds.'],['04','Better conversion','Receive cleaner, higher-intent requests and respond from one partner workflow.']].map(x=><div className="partnerFeature" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div></main>}
