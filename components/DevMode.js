// components/DevMode.js
// ============================================
// Developer view: the raw requests and responses under every booking step.
// Off by default so the site reads as a real club's site in a demo; switch it
// on from the footer (or with ?dev=1) when testing. Remembered per browser.
// ============================================

import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext({ dev: false, setDev: () => {} });

export function DevModeProvider({ children }) {
  const [dev, setDevState] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('dev');
      if (q === '1' || q === '0') localStorage.setItem('br_dev', q);
      setDevState(localStorage.getItem('br_dev') === '1');
    } catch { /* private mode */ }
  }, []);
  const setDev = (v) => { setDevState(v); try { localStorage.setItem('br_dev', v ? '1' : '0'); } catch { /* ignore */ } };
  return <Ctx.Provider value={{ dev, setDev }}>{children}</Ctx.Provider>;
}

export const useDevMode = () => useContext(Ctx);
