// pages/tournaments.js
// ============================================
// Tournaments (laid out for the page in commit 017).
//
// GET /tournaments -> POST /tournaments/{id}/entries (a free event whose club
// lets guests sign up; a full one takes a waitlist entry) or, for an event
// with an entry fee, POST /payments { type: 'event_entry' } by card (Verde
// commit 398). An event guests can't enter links to the club's own page, or
// reads "Members Only".
//
// The club's calendar rather than a grid of cards: events grouped by month,
// each with its day, time and format, what it is, the entry fee, places left
// and how full it is, and when entries close. Entering opens right under the
// event - your details, then enter (free) or pay the entry fee by card - and
// the result shows in place. Every date and time is the club's (commit 015).
// ============================================

import { Fragment, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import Details, { person } from '../components/Details';
import CardPayment from '../components/CardPayment';
import { useMember } from '../components/Member';
import { useClub } from '../components/Club';
import { api, money, newKey } from '../lib/verdeClient';
import { fmtDay, fmtTime, ymdOfIso } from '../lib/clubTime';

const words = (v) => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const rate = (c) => (c % 100 === 0 ? '$' + (c / 100).toLocaleString('en-US') : money(c));

export default function Tournaments() {
  const { tz } = useClub();
  const { member } = useMember();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '' });
  const [entry, setEntry] = useState(null);
  const [entered, setEntered] = useState({});
  const [key, setKey] = useState(newKey());
  useEffect(() => { if (member) setWho((w) => ({ ...w, name: w.name || member.name || '', email: w.email || member.email || '', phone: w.phone || member.phone || '' })); }, [member]);
  useEffect(() => { api('/tournaments').then(setList); }, []);

  const events = list?.json?.tournaments || [];
  const ready = !!(member || (who.name && who.email));
  const p = person(who, member);

  const toggle = (id) => { setOpen(open === id ? null : id); setEntry(null); setKey(newKey()); };
  const enterFree = async (t) => {
    const r = await api('/tournaments/' + t.id + '/entries', { method: 'POST', key, body: p });
    setEntry(r);
    if (r.ok) setEntered((e) => ({ ...e, [t.id]: r.json.entry?.status || 'confirmed' }));
  };

  /* Grouped by the month they fall in at the club. */
  const months = [];
  for (const t of events) {
    const day = t.starts_at ? ymdOfIso(t.starts_at, tz) : null;
    const label = day ? fmtDay(day, { month: 'long', year: 'numeric' }) : 'Dates to Come';
    let m = months.find((x) => x.label === label);
    if (!m) { m = { label, items: [] }; months.push(m); }
    m.items.push({ t, day });
  }

  return (
    <Layout title="Tournaments" eyebrow="Events" intro="Scrambles, the member-guest and the season finale. Enter online where the club takes outside entries.">
      <div className="wrap events-page">
        {!list ? (
          <div className="bays" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="bay"><span className="tile ghost" style={{ height: 110 }} /></div>)}</div>
        ) : null}
        {list && !events.length && !list.json?.error ? <p className="empty" style={{ padding: '40px 0' }}>The season&rsquo;s tournaments are posted here as soon as they&rsquo;re set. Check back soon.</p> : null}
        <Notice result={list} />

        {months.map((m) => (
          <section key={m.label} className="ev-month">
            <h2>{m.label}</h2>
            <div className="ev-list">
              {m.items.map(({ t, day }) => {
                const done = entered[t.id];
                const full = t.spots_left === 0;
                const paid = t.entry_requires_payment;
                const pct = t.capacity ? Math.min(100, Math.round(((t.entrants || 0) / t.capacity) * 100)) : null;
                const closes = t.registration_closes_at ? fmtDay(ymdOfIso(t.registration_closes_at, tz), { month: 'long', day: 'numeric' }) : null;
                const isOpen = open === t.id;
                return (
                  <article key={t.id} className={'ev-row' + (isOpen ? ' open' : '')}>
                    <div className="ev-date">
                      <b>{day ? Number(day.slice(8)) : '\u2014'}</b>
                      <span>{day ? fmtDay(day, { weekday: 'short' }) : ''}</span>
                    </div>
                    <div className="ev-main">
                      <h3>{t.title}</h3>
                      <p className="ev-when">
                        {[day && t.starts_at ? fmtTime(t.starts_at, tz) : null, t.format ? words(t.format) : null, t.sport && t.sport !== 'golf' ? words(t.sport) : null].filter(Boolean).join(' · ')}
                      </p>
                      {t.description ? <p className="ev-text">{t.description}</p> : null}
                      <p className="ev-facts">
                        <span>{t.entry_fee_cents ? rate(t.entry_fee_cents) + ' entry' : 'No entry fee'}</span>
                        {t.spots_left != null ? <span className={full ? 'warn' : t.spots_left <= 5 ? 'low' : ''}>{full ? 'Full, waitlist open' : t.spots_left + (t.spots_left === 1 ? ' place left' : ' places left')}</span> : null}
                        {closes ? <span>Entries close {closes}</span> : null}
                      </p>
                      {pct != null ? <div className="spots" title={pct + '% full'} aria-hidden="true"><i style={{ width: pct + '%' }} /></div> : null}
                    </div>
                    <div className="ev-action">
                      {done ? <span className="ev-done">{done === 'waitlist' ? 'On the Waitlist' : 'You\u2019re In'}</span>
                        : t.guests_can_enter ? <button className={'btn' + (isOpen ? ' ghost' : '')} onClick={() => toggle(t.id)}>{isOpen ? 'Close' : full ? 'Join the Waitlist' : 'Enter'}</button>
                        : t.url ? <a className="btn ghost" href={t.url} target="_blank" rel="noreferrer">Enter at the Club</a>
                        : <span className="ev-note">Members Only</span>}
                    </div>

                    {isOpen && !done ? (
                      <div className="ev-enter">
                        <h4>{full ? 'Join the Waitlist' : 'Enter ' + t.title}</h4>
                        <p className="sub">{paid ? 'The entry fee is paid by card now. Your confirmation goes to this email.' : full ? 'You\u2019ll hear from the club if a place opens.' : 'Your confirmation goes to this email.'}</p>
                        <Details who={who} setWho={setWho} />
                        <div className="ev-pay">
                          {paid && !full ? (
                            ready ? <CardPayment label={'Pay ' + money(t.entry_fee_cents) + ' Entry by Card'} start={{ type: 'event_entry', event_id: t.id, ...p }}
                              onDone={() => setEntered((e) => ({ ...e, [t.id]: 'confirmed' }))} />
                              : <p className="fine">Add your name and email to enter.</p>
                          ) : (
                            <button className="btn" disabled={!ready} onClick={() => enterFree(t)}>{full ? 'Join the Waitlist' : 'Enter the Event'}</button>
                          )}
                        </div>
                        <Notice result={entry} kind="bad" />
                      </div>
                    ) : null}
                    {done ? (
                      <p className="ev-confirm">{done === 'waitlist' ? 'You\u2019re on the waitlist. The club will be in touch if a place opens.' : 'You\u2019re entered. Your confirmation is on its way.'}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
