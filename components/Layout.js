// components/Layout.js
// The club's header and footer. `hero` is the home page's full-bleed opener;
// inner pages pass `title` and `intro` for a smaller banner.
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useDevMode } from './DevMode';
import Mountains from './Mountains';

const NAV = [
  ['/tee-times', 'Tee Times'], ['/simulators', 'Simulators'], ['/courts', 'Courts'], ['/rooms', 'Stay'],
  ['/dining', 'Dining'], ['/tournaments', 'Events'], ['/private-events', 'Private Events'],
];

function Logo() {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#1d3450" />
      <path d="M6 27l8-9 5 5 6-8 9 12z" fill="#8ea7c4" />
      <path d="M6 27l7-6 5 4 6-6 10 8v2H6z" fill="#f3d9b1" opacity=".9" />
    </svg>
  );
}

export default function Layout({ title, intro, eyebrow, hero, children }) {
  const { dev, setDev } = useDevMode();
  const { pathname } = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Head>
        <title>{title ? title + ' · Blue Ridge Country Club' : 'Blue Ridge Country Club'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Golf, dining and stays in the Blue Ridge." />
      </Head>
      {dev ? (
        <div className="devbar"><div className="wrap"><span>Developer view · every step shows its Verde API request</span><Link href="/webhooks" style={{ color: '#f3d9b1' }}>Webhooks</Link></div></div>
      ) : null}
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="brand"><Logo /><span><b>Blue Ridge</b><small>Country Club</small></span></Link>
          <button className="menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu">Menu</button>
          <nav className={'nav' + (open ? ' open' : '')}>
            {NAV.map(([h, l]) => <Link key={h} href={h} className={pathname === h ? 'on' : ''} onClick={() => setOpen(false)}>{l}</Link>)}
          </nav>
          <Link href="/tee-times" className="btn small" style={{ whiteSpace: 'nowrap' }}>Book a tee time</Link>
        </div>
      </header>
      {hero || (title ? (
        <div className="page-hero">
          <Mountains className="ridge" />
          <div className="wrap" style={{ position: 'relative' }}>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h1>{title}</h1>
            {intro ? <p>{intro}</p> : null}
          </div>
        </div>
      ) : null)}
      <main>{children}</main>
      <footer className="site">
        <div className="wrap">
          <div className="cols">
            <div>
              <b>Blue Ridge Country Club</b>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#b9c7d6', maxWidth: 360 }}>Eighteen holes along the ridgeline, a clubhouse built for long lunches, and rooms for the night after.</p>
            </div>
            <div>
              <a href="/tee-times">Tee times</a><a href="/simulators">Simulators</a><a href="/courts">Courts</a><a href="/rooms">Stay</a>
            </div>
            <div>
              <a href="/dining">Dining</a><a href="/tournaments">Events</a><a href="/private-events">Private events</a><a href="/manage">Manage a booking</a>
            </div>
          </div>
          <div className="base">
            <span>Bookings powered by Verde</span>
            <button className={'devswitch' + (dev ? ' on' : '')} onClick={() => setDev(!dev)}>{dev ? 'Developer view: on' : 'Developer view'}</button>
          </div>
        </div>
      </footer>
    </>
  );
}
