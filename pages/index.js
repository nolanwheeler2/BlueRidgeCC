// pages/index.js
// The club's home page. Live from Verde: the club's name, place and courses
// (GET /club), which amenities are open online, and upcoming events
// (GET /tournaments). The rest is the club's own copy.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Mountains from '../components/Mountains';
import Scene from '../components/Scene';
import EventCard from '../components/EventCard';
import { api, money } from '../lib/verdeClient';

const AMENITIES = [
  ['tee_times', '/tee-times', 'Tee Times', 'golf', 'Eighteen holes along the ridge, with views into three states from the back nine.', ['18 holes', 'Carts', 'Twilight rates']],
  ['simulators', '/simulators', 'Simulators', 'sim', 'Play Pebble Beach at lunch. Launch-monitor bays by the hour, rain or shine.', ['By the hour', 'Up to 6 players']],
  ['courts', '/courts', 'Courts', 'court', 'Lit pickleball and tennis courts, with paddles and balls to rent.', ['Pickleball', 'Tennis', 'Rentals']],
  ['lodging', '/rooms', 'Stay', 'room', 'Cottages above the eighteenth green, for the night after the round.', ['Cottages', 'Breakfast']],
  ['packages', '/packages', 'Stay and Play', 'stayplay', 'A cottage, your rounds and dinner on us - one price, booked in one go.', ['Room + golf', 'One price']],
  ['dining', '/dining', 'Dining', 'dining', 'The Grill and the terrace, from breakfast before your round to supper at last light.', ['The Grill', 'Terrace']],
  ['tournaments', '/tournaments', 'Events', 'events', 'Scrambles, the member-guest and the season finale - enter online.', ['Scrambles', 'Leagues']],
  ['private_events', '/private-events', 'Private Events', 'venue', 'Weddings, outings and meetings with the mountains behind you.', ['Weddings', 'Outings', 'Meetings']],
];

const VOICES = [
  ['The fourteenth tee at sunset is the best seat in three states.', 'Member since 2009'],
  ['We booked a tee time, a cottage and dinner in five minutes. Then we did it again the next month.', 'Visiting foursome from Charlotte'],
  ['Our wedding on the eighteenth green - the team handled every detail.', 'Private event, June'],
];

export default function Home() {
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState(null);
  /* Live packages (commit 011): the Stay and Play card shows the lowest
     price on offer, and the club's own package names. */
  const [pkgs, setPkgs] = useState(null);
  useEffect(() => { api('/club').then(setClub); api('/tournaments').then(setEvents); api('/packages').then(setPkgs); }, []);
  const packages = pkgs?.json?.packages || [];
  const fromCents = packages.length ? Math.min(...packages.map((p) => p.price.base_cents)) : null;
  const c = club?.json?.club;
  const upcoming = (events?.json?.tournaments || []).slice(0, 3);
  const holes = (c?.courses || []).reduce((s, x) => s + (x.holes || 0), 0);
  const open = c?.avenues ? Object.values(c.avenues).filter(Boolean).length : null;

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
            {AMENITIES.map(([avenue, href, label, scene, sub, facts]) => {
              /* Packages: open when the club sells them and has one live. */
              const off = (c?.avenues && c.avenues[avenue] === false) || (avenue === 'packages' && pkgs && !packages.length);
              if (avenue === 'packages') {
                if (packages.length === 1) sub = packages[0].name + (packages[0].description ? ' - ' + packages[0].description : '');
                if (fromCents !== null) facts = [...facts, 'From ' + money(fromCents)];
              }
              return (
                <Link key={href} href={href} className="amenity" style={off ? { opacity: .6 } : undefined}>
                  <div className="scene"><Scene kind={scene} height={120} /></div>
                  <div className="inner">
                    <b>{label}</b>
                    <span>{sub}</span>
                    <div className="facts">{facts.map((f) => <span key={f} className="tag">{f}</span>)}</div>
                    <div className="row"><span className="go">{off ? 'Not available online' : 'Book now →'}</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="wrap feature">
          <div className="feature-art"><Scene kind="golf" height={360} /></div>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>The course</div>
            <h2 className="section-title">Laid along the ridgeline</h2>
            <p className="lead" style={{ marginBottom: 0 }}>Bentgrass greens, elevated tees and a back nine that climbs into the clouds. Walkers welcome; carts for the steep holes.</p>
            <div className="stats">
              <div className="stat"><b>{holes || 18}</b><span>holes to play</span></div>
              <div className="stat"><b>{(c?.courses || []).length || 1}</b><span>{(c?.courses || []).length === 1 ? 'course' : 'courses'}</span></div>
              <div className="stat"><b>{open ?? 7}</b><span>ways to book online</span></div>
            </div>
            {c?.courses?.length ? <p className="note" style={{ color: 'var(--muted)', fontSize: 14 }}>{c.courses.map((x) => x.name + (x.holes ? ' · ' + x.holes + ' holes' : '')).join('   ·   ')}</p> : null}
            <Link href="/tee-times" className="btn">See tee times</Link>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>Coming up</div>
          <h2 className="section-title">Events at Blue Ridge</h2>
          <p className="lead">Enter online where the club takes guest entries.</p>
          <div className="evgrid">
            {upcoming.length ? upcoming.map((t) => <EventCard key={t.id} t={t} />) : <p className="empty">New events are posted here as soon as they&rsquo;re announced.</p>}
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>From our guests</div>
          <h2 className="section-title">Why they come back</h2>
          <div className="voices" style={{ marginTop: 24 }}>
            {VOICES.map(([q, who]) => <div className="voice" key={q}><p>&ldquo;{q}&rdquo;</p><span>{who}</span></div>)}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Stay and play</h2>
              <p>A cottage for the night, a tee time in the morning{c?.phone ? ' - or call us at ' + c.phone : ''}.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/rooms" className="btn light">Find a room</Link>
              <Link href="/tee-times" className="btn ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.6)' }}>Book golf</Link>
            </div>
          </div>
          <Result result={club} title="GET /club" /><Result result={events} title="GET /tournaments" />
        </div>
      </section>
    </Layout>
  );
}
