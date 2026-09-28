// components/GroupPlayers.js
// ============================================
// Who else is playing, for a signed-in member - as in the club's app:
// each other player is a GUEST (a name) or another MEMBER, found by name
// (GET /members/search) and invited - they accept and pay their own share.
// Used when booking a tee time and when changing one.
//   value: [{ kind: 'guest', name } | { kind: 'member', id, name, locked? }]
// A locked member has already accepted and stays with the round.
// ============================================

import { useEffect, useState } from 'react';
import { api } from '../lib/verdeClient';

export default function GroupPlayers({ value, onChange, max = 3 }) {
  const [openAt, setOpenAt] = useState(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(async () => {
      const r = await api('/members/search?q=' + encodeURIComponent(q.trim()));
      const taken = new Set(value.filter((p) => p.kind === 'member').map((p) => p.id));
      setFound((r.json?.members || []).filter((m) => !taken.has(m.id)));
    }, 250);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (i, p) => onChange(value.map((v, j) => (j === i ? p : v)));
  const remove = (i) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="group-players">
      <div className="gp-row"><span className="gp-name">You</span><span className="tag good">Booking</span></div>
      {value.map((p, i) => (
        <div key={i} className="gp-row">
          {p.kind === 'member' ? (
            <>
              <span className="gp-name">{p.name}</span>
              <span className="tag">{p.locked ? 'Confirmed' : 'Invited'}</span>
              {!p.locked ? <button className="link" onClick={() => remove(i)}>Remove</button> : null}
            </>
          ) : (
            <>
              <input className="gp-input" value={p.name} placeholder={'Guest ' + (i + 2) + ' (name)'} onChange={(e) => set(i, { kind: 'guest', name: e.target.value })} />
              <button className="link" onClick={() => { setOpenAt(openAt === i ? null : i); setQ(''); }}>{openAt === i ? 'Close' : 'Invite a Member'}</button>
              <button className="link" onClick={() => remove(i)}>Remove</button>
            </>
          )}
          {openAt === i ? (
            <div className="gp-search">
              <input autoFocus value={q} placeholder="Search members by name" onChange={(e) => setQ(e.target.value)} />
              {found.map((m) => (
                <button key={m.id} className="gp-found" onClick={() => { set(i, { kind: 'member', id: m.id, name: m.name }); setOpenAt(null); setQ(''); }}>
                  {m.name} <span>Invite</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
      {value.length < max ? <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => onChange([...value, { kind: 'guest', name: '' }])}>Add a Player</button> : null}
    </div>
  );
}

/* The API's fields for a group. */
export const groupFields = (value) => ({
  guests: value.filter((p) => p.kind === 'guest').map((p) => p.name || ''),
  members: value.filter((p) => p.kind === 'member' && !p.locked).map((p) => p.id),
});
