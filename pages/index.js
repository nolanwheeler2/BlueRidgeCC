// pages/index.js
// The club's home page. Live from Verde: the club's name, place and courses
// (GET /club), which amenities are open online, and upcoming events
// (GET /tournaments).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Mountains from '../components/Mountains';
import { Flag, Screen, Racket, Bed, Fork, Trophy, Glass } from '../components/Icons';
import { api, money } from '../lib/verdeClient';

const AMENITIES = [
  ['tee_times', '/tee-times', 'Tee Times', 'Eighteen holes along the ridge. Book online up to two weeks out.', Flag],
  ['simulators', '/simulators', 'Simulators', 'Play any course in the world, rain or shine, by the hour.', Screen],
  ['courts', '/courts', 'Courts', 'Pickleball and tennis, with paddles and balls to rent.', Racket],
  ['lodging', '/rooms', 'Stay', 'Cottages above the eighteenth green for the night after.', Bed],
  ['dining', '/dining', 'Dining', 'The Grill and the terrace, from breakfast to last light.', Fork],
  ['tournaments', '/tournaments', 'Events', 'Scrambles, member-guests and the season finale.', Trophy],
  ['private_events', '/private-events', 'Private Events', 'Weddings, outings and meetings with the mountains behind you.', Glass],
];

export default function Home() {
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState(null);
  useEffect(() => { api('/club').then(setClub); api('/tournaments').then(setEvents); }, []);
  const c = club?.json?.club;
  const upcoming = (events?.json?.tournaments || []).slice(0, 3);

  const hero = (
    <div className="hero">
      <Mountains className="art" />
      <div className="shade" />
      <div className="content">
        <div className="eyebrow">{c?.location || 'In the Blue Ridge'}</div>
        <h1>Golf where the mountains turn blue.</h1>
        <p>Tee times, simulators, courts, dining and a room for the night - all booked right here.</p>
        <div className="actions">
          <Link href="/tee-times" className="btn light">Book a tee time</Link>
          <Link href="/private-events" className="btn ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.7)' }}>Plan an event</Link>
        </div>
      </div>
    </div>
  );

  return (
    <Layout hero={hero}>
      <section className="block">
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>At the club</div>
          <h2 className="section-title">Everything, one booking away</h2>
          <p className="lead">Pick a time, see the club&rsquo;s price, and it&rsquo;s yours - paid at the club or by card.</p>
          <div className="amenities">
            {AMENITIES.map(([avenue, href, label, sub, Icon]) => {
              const off = c?.avenues && c.avenues[avenue] === false;
              return (
                <Link key={href} href={href} className="amenity" style={off ? { opacity: .55 } : undefined}>
                  <span className="icon"><Icon /></span>
                  <b>{label}</b>
                  <span>{sub}</span>
                  <span className="go">{off ? 'Not available online' : 'Book →'}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="wrap split">
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Coming up</div>
            <h2 className="section-title">Events at Blue Ridge</h2>
            <div className="events">
              {upcoming.length ? upcoming.map((t) => {
                const d = t.starts_at ? new Date(t.starts_at) : null;
                return (
                  <div className="event" key={t.id}>
                    <div className="date"><b>{d ? d.getDate() : '-'}</b><small>{d ? d.toLocaleDateString('en-US', { month: 'short' }) : ''}</small></div>
                    <div className="what"><b>{t.title}</b><span>{t.entry_fee_cents ? money(t.entry_fee_cents) + ' entry' : 'Free'}{t.spots_left != null ? ' · ' + t.spots_left + ' spots left' : ''}</span></div>
                    <Link href="/tournaments" className="btn small ghost">Details</Link>
                  </div>
                );
              }) : <p className="empty">New events are posted here as soon as they&rsquo;re announced.</p>}
            </div>
          </div>
          <div>
            <p className="quote">&ldquo;The fourteenth tee at sunset is the best seat in three states.&rdquo;</p>
            <p className="lead" style={{ marginTop: 18 }}>
              {c ? <>{c.name}{c.location ? ' · ' + c.location : ''}{c.phone ? ' · ' + c.phone : ''}</> : null}
              {c?.courses?.length ? <><br />Courses: {c.courses.map((x) => x.name + (x.holes ? ' (' + x.holes + ')' : '')).join(', ')}</> : null}
            </p>
          </div>
        </div>
      </section>

      <div className="wrap"><Result result={club} title="GET /club" /><Result result={events} title="GET /tournaments" /></div>
    </Layout>
  );
}
