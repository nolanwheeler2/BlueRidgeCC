// components/Layout.js
// ============================================
// The club's frame (redesigned in commit 008): the header, each page's
// photographic opener, the footer, and the developer console.
//
//   header   sits over the opening photograph in white, and turns solid once
//            the page scrolls. Golf, Stay and Events open small menus; on a
//            phone everything is in a full-screen menu.
//   opener   the home page passes `hero`; every other page gets its own
//            photograph (lib/photos PAGE_PHOTOS) with `title` and `intro` on it.
//   footer   the club's address and phone from Verde (GET /club, fetched
//            once per visit), the site map, and Developer view.
// ============================================

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useDevMode } from './DevMode';
import { useMember } from './Member';
import DevConsole from './DevConsole';
import Photo from './Photo';
import { PAGE_PHOTOS } from '../lib/photos';
import { useClub } from './Club';

const NAV = [
  { label: 'Golf', items: [['/tee-times', 'Tee Times', 'Eighteen holes on the ridge'], ['/simulators', 'Simulators', 'Indoor bays, all year']] },
  { label: 'Racquets', href: '/courts' },
  { label: 'Stay', items: [['/rooms', 'Cottages', 'Above the eighteenth green'], ['/packages', 'Stay and Play', 'A room, your rounds, dinner']] },
  { label: 'Dining', href: '/dining' },
  { label: 'Events', items: [['/tournaments', 'Tournaments', 'Scrambles, member-guest, leagues'], ['/private-events', 'Private Events', 'Weddings, outings, meetings']] },
];

function Logo({ variant = 'both' }) {
  if (variant === 'light') return <img src="/brand/logo-light.png" className="logo" alt="Blue Ridge Country Club" width="252" height="120" />;
  return (
    <>
      <img src="/brand/logo-light.png" className="logo logo-on-photo" alt="Blue Ridge Country Club" width="252" height="120" />
      <img src="/brand/logo.png" className="logo logo-on-paper" alt="" aria-hidden="true" width="252" height="120" />
    </>
  );
}

/* RESERVE (commit 020): the header's call to action. Everything the club
   books online, one tap away - not just tee times - in the logo's gold, with
   a calendar mark. Opens on click (and closes on a click away or Esc), so it
   works the same on a phone. */
const RESERVE = [
  ['/tee-times', 'Tee Time', 'M3 20h18M12 20V4l7 3-7 3'],
  ['/simulators', 'Simulator Bay', 'M3 5h18v11H3zM8 20h8M12 16v4'],
  ['/courts', 'Court', 'M4 4h16v16H4zM12 4v16M4 12h16'],
  ['/rooms', 'Cottage', 'M3 11l9-7 9 7v9H3zM9 20v-6h6v6'],
  ['/dining', 'Table', 'M5 3v8a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10'],
];

function Icon({ d, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function ReserveMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const { pathname } = useRouter();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="reserve-wrap" ref={box}>
      <button className={'reserve' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">
        <Icon d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" size={17} />
        <span>Reserve</span>
        <svg className="caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 L5 6.5 L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      {open ? (
        <div className="reserve-menu" role="menu">
          <p>What would you like to reserve?</p>
          {RESERVE.map(([href, label, d]) => (
            <Link key={href} href={href} role="menuitem" className={pathname === href ? 'on' : ''}>
              <span className="ri"><Icon d={d} /></span>{label}
              <svg className="go" width="14" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M0 5 H14 M10 1 L14 5 L10 9" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Layout({ title, intro, eyebrow, hero, children }) {
  const { dev, setDev } = useDevMode();
  const { pathname } = useRouter();
  const { member, ready, signIn, signOut } = useMember();
  const { club } = useClub();
  const [menuOpen, setMenuOpen] = useState(false);
  const [acct, setAcct] = useState(false);
  const [solid, setSolid] = useState(false);
  const [signinNote, setSigninNote] = useState(null);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('signin');
    if (v) setSigninNote({ canceled: 'Sign-in was canceled.', cancelled: 'Sign-in was canceled.', expired: 'That sign-in took too long. Please try again.', failed: 'Sign-in didn’t go through. Please try again.' }[v] || null);
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setMenuOpen(false); setAcct(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; }, [menuOpen]);

  const photo = PAGE_PHOTOS[pathname];
  const inSection = (group) => group.href === pathname || (group.items || []).some(([h]) => h === pathname);
  const year = new Date().getFullYear();

  return (
    <>
      <Head>
        <title>{title ? title + ' | Blue Ridge Country Club' : 'Blue Ridge Country Club'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Golf, dining and cottages on the ridge. Book tee times, simulators, courts, rooms and tables online." />
        <meta name="theme-color" content="#0b2540" />
      </Head>

      <header className={'site-head' + (solid || menuOpen ? ' solid' : '')}>
        <div className="wrap head-row">
          <Link href="/" className="brand" aria-label="Blue Ridge Country Club, home">
            <Logo />
          </Link>

          <nav className="primary" aria-label="Main">
            {NAV.map((g) => g.items ? (
              <div key={g.label} className={'nav-group' + (inSection(g) ? ' here' : '')}>
                <button className="nav-top" aria-haspopup="true">{g.label}<svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 L5 6.5 L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg></button>
                <div className="nav-menu">
                  {g.items.map(([h, l, s]) => (
                    <Link key={h} href={h} className={pathname === h ? 'on' : ''}><b>{l}</b><span>{s}</span></Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={g.label} href={g.href} className={'nav-top' + (inSection(g) ? ' here' : '')}>{g.label}</Link>
            ))}
          </nav>

          <div className="head-end">
            {ready ? (member ? (
              <div className="acct">
                <button className="acct-btn" onClick={() => setAcct((m) => !m)} aria-expanded={acct}>
                  <span className="avatar sm">{(member.name || member.email || '?').slice(0, 1).toUpperCase()}</span>
                  <span className="acct-name">{(member.name || member.email || '').split(' ')[0]}</span>
                </button>
                {acct ? (
                  <div className="acct-menu">
                    <b>{member.name || 'Signed in'}</b><span>{member.email}</span>
                    <Link href="/manage">Your Bookings</Link>
                    <button onClick={async () => { setAcct(false); await signOut(); }}>Sign Out</button>
                  </div>
                ) : null}
              </div>
            ) : <button className="text-btn signin" onClick={signIn}>Member Sign In</button>) : null}
            <ReserveMenu />
            <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="Menu">
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={'mobile-menu' + (menuOpen ? ' open' : '')} aria-hidden={!menuOpen}>
        <div className="wrap">
          {NAV.map((g) => (
            <div key={g.label} className="mm-group">
              <h3>{g.label}</h3>
              {(g.items || [[g.href, g.label === 'Racquets' ? 'Courts' : g.label, '']]).map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
            </div>
          ))}
          <div className="mm-group">
            <h3>Your Visit</h3>
            <Link href="/manage">Your Bookings</Link>
            {!member ? <button className="text-btn" onClick={signIn}>Member Sign In</button> : null}
          </div>
        </div>
      </div>

      {hero || (title ? (
        <section className="opener">
          {photo ? <Photo name={photo.key} focus={photo.focus} priority className="opener-photo" /> : null}
          <div className="opener-shade" />
          <div className="wrap opener-copy">
            {eyebrow ? <p className="crumb">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {intro ? <p className="opener-intro">{intro}</p> : null}
          </div>
        </section>
      ) : null)}

      {signinNote ? <div className="wrap"><div className="notice warn" style={{ marginTop: 20 }}>{signinNote}</div></div> : null}

      <main>{children}</main>

      <footer className="site-foot">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-club">
              <Link href="/" className="brand" aria-label="Blue Ridge Country Club, home"><Logo variant="light" /></Link>
              <p>{club?.location || 'On the ridge, western North Carolina'}</p>
              {club?.phone ? <p><a href={'tel:' + club.phone.replace(/[^\d+]/g, '')}>{club.phone}</a></p> : null}
            </div>
            <div className="foot-cols">
              <div><h4>Play</h4><Link href="/tee-times">Tee Times</Link><Link href="/simulators">Simulators</Link><Link href="/courts">Courts</Link></div>
              <div><h4>Stay</h4><Link href="/rooms">Cottages</Link><Link href="/packages">Stay and Play</Link><Link href="/dining">Dining</Link></div>
              <div><h4>The Club</h4><Link href="/tournaments">Tournaments</Link><Link href="/private-events">Private Events</Link><Link href="/manage">Your Bookings</Link></div>
            </div>
          </div>
          <div className="foot-base">
            <span>&copy; {year} Blue Ridge Country Club</span>
            <span className="foot-verde">Reservations by Verde</span>
            <button className={'dev-toggle' + (dev ? ' on' : '')} onClick={() => setDev(!dev)} title="Ctrl+Shift+D">
              {dev ? 'Developer View On' : 'Developer View'}
            </button>
          </div>
        </div>
      </footer>

      <DevConsole />
    </>
  );
}
