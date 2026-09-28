// components/DevMode.js
// ============================================
// Developer view: the engineering under the club's site.
// Off by default, so the site reads as a real club's in a demo. Turn it on
// from the footer, with ?dev=1, or with Ctrl+Shift+D (Cmd+Shift+D on a Mac)
// - handy mid-pitch. Remembered per browser. When it's on, the console
// (components/DevConsole) shows every Verde API call and webhook.
// ============================================

import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext({ dev: false, setDev: () => {} });

export function DevModeProvider({ children }) {
  const [dev, setDevState] = useState(false);
  const setDev = (v) => { setDevState(v); try { localStorage.setItem('br_dev', v ? '1' : '0'); } catch { /* private mode */ } };
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('dev');
      if (q === '1' || q === '0') localStorage.setItem('br_dev', q);
      setDevState(localStorage.getItem('br_dev') === '1');
    } catch { /* private mode */ }
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setDevState((v) => { const n = !v; try { localStorage.setItem('br_dev', n ? '1' : '0'); } catch { /* ignore */ } return n; });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <Ctx.Provider value={{ dev, setDev }}>{children}</Ctx.Provider>;
}

export const useDevMode = () => useContext(Ctx);
