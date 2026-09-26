// components/Layout.js
import Head from 'next/head';
import Link from 'next/link';

const NAV = [
  ['/tee-times', 'Tee times'], ['/simulators', 'Simulators'], ['/courts', 'Courts'], ['/rooms', 'Rooms'],
  ['/dining', 'Dining'], ['/tournaments', 'Tournaments'], ['/private-events', 'Private events'],
  ['/manage', 'Manage a booking'], ['/webhooks', 'Webhooks'],
];

export default function Layout({ title, children }) {
  return (
    <>
      <Head><title>{title ? title + ' - Blue Ridge CC' : 'Blue Ridge CC'}</title></Head>
      <header className="site">
        <div className="wrap">
          <Link href="/" className="brand">Blue Ridge CC</Link>
          <nav>{NAV.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</nav>
        </div>
      </header>
      <main><div className="wrap">{children}</div></main>
    </>
  );
}
