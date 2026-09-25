import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'From first search to a confirmed date — how The Venue Search helps couples and planners discover, compare, hold and book verified wedding venues with no double-booking.',
};

export default function How(){return <main className="page"><div className="centerIntro"><span className="kicker">A CLEARER WAY TO BOOK</span><h1>From first search to a confirmed date.</h1><p>Venue Search is designed as a decision and transaction engine — not another listing portal.</p></div><div className="steps">{[['01','Discover','Search by destination, venue and guest count.'],['02','Evaluate','Use verified profiles, authentic imagery, capacity and logistics.'],['03','Compare','Shortlist favourites and make a decision with consistent information.'],['04','Request','Ask a question, request a proposal or start an assisted booking.'],['05','Hold / Book','Secure the date through Instant Hold for main venues or Instant Book for eligible smaller events.'],['06','Track','Keep your wedding and connected sub-events in one shared view.']].map(s=><div className="step" key={s[0]}><span>{s[0]}</span><div><h3>{s[1]}</h3><p>{s[2]}</p></div></div>)}</div><section className="trustPanel"><h2>The database protects the promise.</h2><p>Venue Search is built around a no-double-booking guarantee: competing requests for the same venue space and date are resolved at the database layer, so one date cannot be confirmed twice.</p><Link data-cursor="open" className="primaryBtn" href="/explore">Explore verified venues →</Link></section></main>}
