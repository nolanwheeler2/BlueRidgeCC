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

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/verdeClient';
import { DEFAULT_TZ, addDays, clubToday } from '../lib/clubTime';

const Ctx = createContext({ club: null, tz: DEFAULT_TZ, ready: false });

export function ClubProvider({ children }) {
  const [state, setState] = useState({ club: null, tz: DEFAULT_TZ, ready: false });
  useEffect(() => {
    let live = true;
    api('/club').then((r) => {
      if (!live) return;
      const club = r?.json?.club || null;
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
