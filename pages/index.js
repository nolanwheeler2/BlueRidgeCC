// pages/index.js
// ============================================
// The club's home page (redesigned in commit 008).
//
// Photography first, one idea per section, and very little chrome. Live from
// Verde: the club's place, phone and courses (GET /club - how many holes,
// which amenities book online), upcoming tournaments (GET /tournaments), and
// the lowest stay-and-play price (GET /packages). Everything else is the
// club's own copy, written like a club would write it.
// ============================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Photo from '../components/Photo';
import { useMember } from '../components/Member';
import { api, money } from '../lib/verdeClient';

const OFFERS = [
  { avenue: 'lodging', href: '/rooms', photo: 'amenities-lodging', title: 'The Cottages', text: 'Eight cottages above the eighteenth green, with porches that catch the last of the light.', size: 'wide' },
  { avenue: 'courts', href: '/courts', photo: 'amenities-courts', title: 'Racquets', text: 'Lit courts for pickleball and tennis, with paddles and balls at the desk.' },
  { avenue: 'simulators', href: '/simulators', photo: 'amenities-simulator', title: 'Simulators', text: 'Launch-monitor bays by the hour. Play the ridge in January.' },
  { avenue: 'packages', href: '/packages', photo: 'clubhouse-patio', title: 'Stay and Play', text: 'A cottage, your rounds and dinner on the terrace, booked in one go.', size: 'wide' },
];

function Arrow() {
  return <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M0 5 H14 M10 1 L14 5 L10 9" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

export default function Home() {
  const { member, signIn } = useMember();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState(null);
  const [pkgs, setPkgs] = useState(null);
  useEffect(() => { api('/club').then(setClub); api('/tournaments').then(setEvents); api('/packages').then(setPkgs); }, []);

  const c = club?.json?.club;
  const packages = pkgs?.json?.packages || [];
  const fromCents = packages.length ? Math.min(...packages.map((p) => p.price?.base_cents ?? Infinity)) : null;
  const upcoming = (events?.json?.tournaments || []).slice(0, 4);
  const holes = (c?.courses || []).reduce((s, x) => s + (x.holes || 0), 0) || 18;
  const courses = (c?.courses || []).length || 1;
  const online = c?.avenues ? Object.values(c.avenues).filter(Boolean).length : 7;

  const hero = (
    <section className="hero">
      <Photo name="course-hero-dawn" focus="50% 60%" priority alt="The first fairway at dawn" />
      <div className="hero-shade" />
      <div className="wrap hero-copy">
        <h1>Golf Where the<br />Mountains <em>Turn Blue.</em></h1>
        <div className="hero-side">
          <p>Eighteen holes on the ridgeline, a clubhouse for the long lunch, and a cottage for the night after.</p>
          <div className="actions">
            <Link href="/tee-times" className="btn light">Reserve a Tee Time</Link>
            <Link href="/rooms" className="btn on-photo">Stay the Night</Link>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <Layout hero={hero}>
      <section className="block">
        <div className="wrap">
          <p className="statement">
            Blue Ridge has played along the same ridge since 1927. Bentgrass greens, elevated tees, and a back nine that
            climbs into the clouds. The <em>clubhouse</em> keeps a table for the long lunch, and the <em>cottages</em> above
            eighteen keep a light on for the night after.
          </p>
          <div className="facts">
            <div><b>{holes}</b><span>holes on the ridge</span></div>
            <div><b>{courses === 1 ? 'One' : courses}</b><span>{courses === 1 ? 'course, walkable' : 'courses'}</span></div>
            <div><b>1927</b><span>first tee time</span></div>
            <div><b>{online}</b><span>ways to book, right here</span></div>
          </div>
        </div>
      </section>

      <section className="block alt">
        <div className="wrap feature">
          <div className="feature-media">
            <Photo name="course-hero-aerial" alt="The back nine from above" />
            <Photo name="course-flag" className="inset" alt="" />
          </div>
          <div className="feature-copy">
            <h2 className="section-title">Laid Along the Ridgeline</h2>
            <p>The front nine plays through hardwoods and back toward the clubhouse. The back nine turns uphill, and from the fourteenth tee you can see into three states on a clear morning.</p>
            <p>Walkers are welcome all day. Carts are waiting for the climb.</p>
            {c?.courses?.length ? <p className="caption">{c.courses.map((x) => x.name + (x.holes ? ', ' + x.holes + ' holes' : '')).join(' · ')}</p> : null}
            <div style={{ marginTop: 28 }}><Link href="/tee-times" className="link-arrow">See Tee Times <Arrow /></Link></div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <h2 className="section-title">Beyond the Eighteenth</h2>
          <p className="lead">Everything the club offers books online here, at the club&rsquo;s own prices.</p>
          <div className="offer-grid">
            {OFFERS.map((o) => {
              const off = c?.avenues && c.avenues[o.avenue] === false;
              const text = o.avenue === 'packages' && fromCents != null && Number.isFinite(fromCents) ? o.text + ' From ' + money(fromCents) + '.' : o.text;
              return (
                <Link key={o.href} href={o.href} className={'offer' + (o.size ? ' ' + o.size : '') + (off ? ' off' : '')}>
                  <Photo name={o.photo} alt="" />
                  <div className="offer-body">
                    <div>
                      <h3>{o.title}</h3>
                      <p>{text}</p>
                    </div>
                    <span className="go">{off ? 'By Phone' : <Arrow />}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="band">
        <Photo name="dining-room" focus="50% 50%" alt="The Grill, set for dinner" />
        <div className="band-shade" />
        <div className="wrap">
          <h2>Supper at Last Light</h2>
          <p>The Grill does breakfast before your round and a proper dinner after it. On warm nights, the terrace is the best table in the county.</p>
          <Link href="/dining" className="btn light">Reserve a Table</Link>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24, flexWrap: 'wrap', marginBottom: 36 }}>
            <h2 className="section-title" style={{ margin: 0 }}>On the Calendar</h2>
            <Link href="/tournaments" className="link-arrow">All Tournaments <Arrow /></Link>
          </div>
          {upcoming.length ? (
            <div className="calendar">
              {upcoming.map((t) => {
                const d = t.starts_at ? new Date(t.starts_at) : null;
                return (
                  <Link key={t.id} href="/tournaments" className="cal-row">
                    <div className="cal-date">
                      <b>{d ? d.getDate() : ''}</b>
                      <span>{d ? d.toLocaleDateString('en-US', { month: 'long' }) : 'To be announced'}</span>
                    </div>
                    <div className="cal-what">
                      <h3>{t.title}</h3>
                      <span>
                        {d ? d.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                        {t.entry_fee_cents ? ' · ' + money(t.entry_fee_cents) + ' entry' : ' · No entry fee'}
                        {t.spots_left != null ? ' · ' + (t.spots_left ? t.spots_left + ' places left' : 'Waitlist open') : ''}
                      </span>
                    </div>
                    <span className="link-arrow">Enter <Arrow /></span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="calendar"><div className="cal-row" style={{ gridTemplateColumns: '1fr' }}><span className="empty">The season&rsquo;s tournaments are posted here as soon as they&rsquo;re set.</span></div></div>
          )}
        </div>
      </section>

      <section className="block alt">
        <div className="wrap feature flip">
          <div className="feature-media">
            <Photo name="events-wedding" className="tall" alt="A ceremony on the lawn above eighteen" />
          </div>
          <div className="feature-copy">
            <h2 className="section-title">Weddings, Outings and Long Dinners</h2>
            <p>The lawn above eighteen seats two hundred for a ceremony, and the ballroom opens onto the terrace for the reception. Outings get the whole course and a shotgun start.</p>
            <p>Tell us the date and the headcount, and the events office will come back with a plan and a price.</p>
            <div style={{ marginTop: 28 }}><Link href="/private-events" className="link-arrow">Plan an Event <Arrow /></Link></div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap visit">
          <div>
            <h3>Finding Us</h3>
            <p>{c?.location || 'On the ridge, western North Carolina'}.<br />Twenty minutes from town, the last ten of them uphill.</p>
          </div>
          <div>
            <h3>The Pro Shop</h3>
            <p>Open from first light to dusk.{c?.phone ? <><br /><a href={'tel:' + c.phone.replace(/[^\d+]/g, '')}>{c.phone}</a></> : null}</p>
          </div>
          <div>
            <h3>Members</h3>
            <p>
              {member ? <>Welcome back, {(member.name || '').split(' ')[0] || 'member'}. <Link href="/manage">Your Bookings</Link></> : <>Sign in to book at member rates and see your bookings. <button className="linkish" onClick={signIn}>Member Sign In</button></>}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
