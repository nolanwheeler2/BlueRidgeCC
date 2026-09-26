// pages/index.js
// The club's home: GET /club - its name, courses, time zone, and which
// kinds of booking it offers (avenues), each linking to its test page.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Result from '../components/Result';
import { api } from '../lib/verdeClient';

const PAGES = [
  ['tee_times', '/tee-times', 'Tee times', 'Availability, quotes, booking, card payments'],
  ['simulators', '/simulators', 'Simulators', 'Bays by the hour'],
  ['courts', '/courts', 'Courts', 'Pickleball and tennis, with rentals'],
  ['lodging', '/rooms', 'Rooms', 'Stays at the club'],
  ['dining', '/dining', 'Dining', 'Table reservations'],
  ['tournaments', '/tournaments', 'Tournaments', 'Upcoming events and guest entries'],
  ['private_events', '/private-events', 'Private events', 'Weddings, outings, meetings'],
];

export default function Home() {
  const [r, setR] = useState(null);
  useEffect(() => { api('/club').then(setR); }, []);
  const club = r?.json?.club;
  return (
    <Layout>
      <div className="hero">
        <h1>{club?.name || 'Blue Ridge CC'}</h1>
        <p>A test website for Verde&rsquo;s Booking API. Every page here books through the API, the way a club&rsquo;s own site or app would.</p>
        {club ? <p className="ui">{club.location || ''}{club.timezone ? ' - times in ' + club.timezone : ''}</p> : null}
        {club?.courses?.length ? <p className="ui">Courses: {club.courses.map((c) => c.name + (c.holes ? ' (' + c.holes + ')' : '')).join(', ')}</p> : null}
      </div>
      <h2>Book</h2>
      <div className="grid">
        {PAGES.map(([avenue, href, label, sub]) => (
          <Link key={href} href={href} className="card">
            <b>{label}</b>
            <span className="note">{sub}</span>
            {club?.avenues && avenue in club.avenues ? (
              <div className={club.avenues[avenue] ? 'ok note' : 'warn note'} style={{ marginTop: 6 }}>
                {club.avenues[avenue] ? 'On at this club' : 'Not switched on at this club'}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
      <h2>GET /club</h2>
      <Result result={r} />
    </Layout>
  );
}
