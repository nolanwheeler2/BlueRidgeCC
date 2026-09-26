// components/Member.js
// The signed-in member, for every page: who they are and their member charge
// accounts (from /api/auth/me), plus sign-in and sign-out.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const Ctx = createContext({ member: null, accounts: [], ready: false, signIn: () => {}, signOut: async () => {} });

export function MemberProvider({ children }) {
  const [state, setState] = useState({ member: null, accounts: [], ready: false });
  const load = useCallback(async () => {
    const r = await fetch('/api/auth/me').then((x) => x.json()).catch(() => null);
    setState({ member: r?.member || null, accounts: r?.charge_accounts || [], ready: true });
  }, []);
  useEffect(() => { void load(); }, [load]);
  const signIn = () => { window.location.href = '/api/auth/start?return=' + encodeURIComponent(window.location.pathname); };
  const signOut = async () => { await fetch('/api/auth/signout', { method: 'POST' }); await load(); };
  return <Ctx.Provider value={{ ...state, signIn, signOut, reload: load }}>{children}</Ctx.Provider>;
}

export const useMember = () => useContext(Ctx);
