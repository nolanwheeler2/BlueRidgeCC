// components/Club.js
// ============================================
// The club, for every page (commit 015): its details from Verde (GET /club,
// fetched once per visit) and, above all, its TIME ZONE - everything on this
// site is on the club's clock (lib/clubTime).
//
//   const { club, tz, ready } = useClub();
//   const [date, setDate] = useClubDate(1);   // tomorrow at the club
//
// `tz` is Verde's until the club has loaded (America/New_York), and
// useClubDate waits for the real zone before it picks a default day, so a
// visitor abroad at 11 PM never starts on the wrong date.
// ============================================

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../lib/verdeClient';
import { DEFAULT_TZ, addDays, clubToday } from '../lib/clubTime';

const Ctx = createContext({ club: null, tz: DEFAULT_TZ, ready: false });

/* REMEMBERED FOR THE VISIT (commit 029). The club's details rarely change,
   so they're kept for the browser tab: a refresh or the next page draws from
   memory at once, then Verde is asked again quietly and anything new replaces
   it. Every page reads the club from here - none fetches it again. */
const CLUB_MEMORY = 'verde.club.v1';
function remembered() {
  try { const j = JSON.parse(sessionStorage.getItem(CLUB_MEMORY) || 'null'); return j && j.club ? j.club : null; } catch { return null; }
}

export function ClubProvider({ children }) {
  const [state, setState] = useState({ club: null, tz: DEFAULT_TZ, ready: false });
  useEffect(() => {
    let live = true;
    const kept = remembered();
    if (kept) setState({ club: kept, tz: kept.timezone || DEFAULT_TZ, ready: true });
    api('/club').then((r) => {
      if (!live) return;
      const club = r?.json?.club || null;
      if (!club && kept) return;
      try { if (club) sessionStorage.setItem(CLUB_MEMORY, JSON.stringify({ club })); } catch { /* private mode */ }
      setState({ club, tz: club?.timezone || DEFAULT_TZ, ready: true });
    });
    return () => { live = false; };
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useClub = () => useContext(Ctx);

/** A calendar date that starts `offset` days from today at the club - set once
 *  the club's zone is known, and null until then. */
export function useClubDate(offset = 0) {
  const { tz, ready } = useClub();
  const [date, setDate] = useState(null);
  useEffect(() => { if (ready && date === null) setDate(addDays(clubToday(tz), offset)); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return [date, setDate];
}

/* THE DAY A BOOKING PAGE OPENS ON (commit 024): today at the club - not
   tomorrow, which skipped a day that was still ahead (at 12:30 AM Monday the
   whole of Monday is bookable). If today has nothing left to book (late in the
   evening, after the last time), the page moves on to the next day by itself,
   up to three days, and says so - but only until the visitor picks a day
   themselves; after that it never moves on its own.

     const [date, pickDate, skipIfEmpty, skippedFrom] = useOpenDay();
     useEffect(() => { if (answer) skipIfEmpty(nothingToBook); }, [answer]);
*/
export function useOpenDay() {
  const [date, setDate] = useClubDate(0);
  const picked = useRef(false);
  const hops = useRef(0);
  const [skippedFrom, setSkippedFrom] = useState(null);
  const pick = (d) => { picked.current = true; setSkippedFrom(null); setDate(d); };
  const skipIfEmpty = (empty) => {
    if (picked.current || !empty || !date || hops.current >= 3) return;
    hops.current += 1;
    setSkippedFrom((f) => f || date);
    setDate(addDays(date, 1));
  };
  return [date, pick, skipIfEmpty, skippedFrom];
}
