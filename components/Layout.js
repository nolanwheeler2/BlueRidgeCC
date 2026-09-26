// components/Layout.js
// The club's header and footer. `hero` is the home page's full-bleed opener;
// inner pages pass `title` and `intro` for a smaller banner.
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDevMode } from './DevMode';
import Mountains from './Mountains';
import { useMember } from './Member';

const NAV = [
  ['/tee-times', 'Tee Times'], ['/simulators', 'Simulators'], ['/courts', 'Courts'], ['/rooms', 'Stay'], ['/packages', 'Packages'],
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
  const { member, ready, signIn, signOut } = useMember();
  const [menu, setMenu] = useState(false);
  /* ?signin=cancelled|expired|failed from /api/auth/callback - said once. */
  const [signinNote, setSigninNote] = useState(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('signin');
    if (v) setSigninNote({ cancelled: 'Sign-in was canceled.', expired: 'That sign-in took too long - please try again.', failed: 'Sign-in didn’t go through - please try again.' }[v] || null);
  }, []);
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
          {ready ? (member ? (
            <div className="acct">
              <button className="acct-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                <span className="avatar sm">{(member.name || member.email || '?').slice(0, 1).toUpperCase()}</span>
                <span className="acct-name">{(member.name || member.email || '').split(' ')[0]}</span>
              </button>
              {menu ? (
                <div className="acct-menu">
                  <b>{member.name || 'Signed in'}</b><span>{member.email}</span>
                  <Link href="/manage" onClick={() => setMenu(false)}>Manage a booking</Link>
                  <button onClick={async () => { setMenu(false); await signOut(); }}>Sign out</button>
                </div>
              ) : null}
            </div>
          ) : <button className="btn small ghost signin" onClick={signIn}>Sign in</button>) : null}
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
      {signinNote ? <div className="wrap"><div className="notice warn" style={{ marginTop: 16 }}>{signinNote}</div></div> : null}
      <main>{children}</main>
      <footer className="site">
        <div className="wrap">
          <div className="cols">
            <div>
              <b>Blue Ridge Country Club</b>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#b9c7d6', maxWidth: 360 }}>Eighteen holes along the ridgeline, a clubhouse built for long lunches, and rooms for the night after.</p>
            </div>
            <div>
              <a href="/tee-times">Tee times</a><a href="/simulators">Simulators</a><a href="/courts">Courts</a><a href="/rooms">Stay</a><a href="/packages">Stay and play</a>
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
