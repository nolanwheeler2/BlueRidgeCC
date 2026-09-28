// pages/dining.js
// ============================================
// Dining (laid out for the page in commit 016).
//
// GET /dining -> GET /dining/availability -> POST /dining/reservations. A
// reservation comes back "confirmed", or "waitlist" when the club confirms
// its own tables. A closed evening comes back with `closure`.
//
// A restaurant's booking flow: where (each dining room with its hours), how
// many, the next two weeks, then the day's times grouped by the part of the
// day. Choosing a time folds the times into one line; your details follow,
// with the occasion and any requests. Dining's times are the club's own wall
// clock ("18:30") and are never converted (lib/clubTime, commit 015).
// ============================================

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import Details from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, DateStrip, Segmented, TimeGroups } from '../components/Picker';
import { api, newKey } from '../lib/verdeClient';
import { useClub, useOpenDay } from '../components/Club';
import { clubToday, fmtDay } from '../lib/clubTime';

const ampm = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };
const OCCASIONS = ['Birthday', 'Anniversary', 'Business', 'Date Night', 'Celebration'];
const PARTY = [1, 2, 3, 4, 5, 6, 8, 10, 12];

export default function Dining() {
  const [areas, setAreas] = useState(null);
  const [area, setArea] = useState('');
  /* Today at the club, or the next day with something left to book (commit 024). */
  const [date, setDate, skipIfEmpty, skippedFrom] = useOpenDay();
  const [party, setParty] = useState(2);
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState(null);
  const [who, setWho] = useState({ name: '', email: '', phone: '', occasion: '', requests: '' });
  const [made, setMade] = useState(null);
  const [key, setKey] = useState(newKey());
  const { member } = useMember();
  /* A signed-in member books as themselves (commit 007). */
  useEffect(() => { if (member) setWho((w) => ({ ...w, name: w.name || member.name || '', email: w.email || member.email || '', phone: w.phone || member.phone || '' })); }, [member]);

  useEffect(() => { api('/dining').then((r) => { setAreas(r); if (r.json?.areas?.[0]) setArea(r.json.areas[0].id); }); }, []);
  useEffect(() => {
    if (!area || !date) return;
    setTime(null); setMade(null); setKey(newKey()); setSlots(null);
    api('/dining/availability?area_id=' + area + '&date=' + date + '&party_size=' + party).then(setSlots);
  }, [area, date, party]);
  const reserve = async () => setMade(await api('/dining/reservations', { method: 'POST', key, body: { area_id: area, date, time, party_size: party, ...who } }));

  const all = areas?.json?.areas || [];
  const a = all.find((x) => x.id === area);
  const res = made?.json?.reservation;
  const confirmsItself = a && a.auto_confirm === false;
  const partyOptions = PARTY.filter((n) => !a?.max_party_size || n <= a.max_party_size).map((n) => [n, String(n)]);
  /* Dining's times are the club's own wall clock ("18:30"): grouped by that hour, never converted. */
  const times = (slots?.json?.slots || []).map((s) => ({
    key: s.time, hour: Number(s.time.split(':')[0]), label: ampm(s.time),
    meta: s.status === 'limited' ? 'Few left' : s.status === 'full' ? 'Full' : null, disabled: s.status === 'full',
  }));
  const loading = !!area && (!date || !slots);
  const { tz: clubTz } = useClub();
  /* No tables left today and no closure to explain it: open the next day (commit 024). */
  useEffect(() => {
    if (slots?.ok) skipIfEmpty(!(slots.json?.slots || []).some((x) => x.status !== 'full') && !slots.json?.closure);
  }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps
  const ready = !!who.name && !!who.email;

  return (
    <Layout title="Dining" eyebrow="The Grill and Terrace" intro="From breakfast before your round to supper on the terrace at last light.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a Table', 'Your Details', 'Reserved']} at={res ? 2 : time ? 1 : 0} />
          {res ? (
            <Success title={res.status === 'waitlist' ? 'Request Received' : 'Your Table Is Booked'}>
              {a?.name}, {fmtDay(date)} at {ampm(time)}, for {party}. {res.status === 'waitlist' ? 'The club confirms these tables itself, and you\u2019ll hear back shortly.' : 'Your confirmation is on its way. See you then.'}
            </Success>
          ) : (
            <>
              <div className="panel">
                <div className="tee-bar">
                  {all.length > 1 ? <Segmented label="Where" value={area} onChange={(v) => { setArea(v); setTime(null); }} options={all.map((x) => [x.id, x.name])} /> : null}
                  <Segmented label="Guests" value={party} onChange={setParty} options={partyOptions.length ? partyOptions : [[2, '2']]} />
                  {a ? (
                    <p className="bar-note">
                      {a.name}{a.open_time && a.close_time ? ', open ' + ampm(a.open_time) + ' to ' + ampm(a.close_time) : ''}.
                      {a.max_party_size ? ' Parties up to ' + a.max_party_size + '; larger groups, call the club.' : ''}
                    </p>
                  ) : null}
                </div>
                {areas && !all.length ? <p className="empty">Online reservations aren&rsquo;t open right now. Please call the club.</p> : null}
                <DateStrip value={date} onChange={setDate} />

                <div className="tee-day">
                  <h2>{date ? fmtDay(date) : '\u00a0'}</h2>
                  <span>{loading ? 'Checking the tables\u2026' : skippedFrom ? 'No more tables ' + (skippedFrom === clubToday(clubTz) ? 'today' : 'on ' + fmtDay(skippedFrom, { weekday: 'long' })) + ', so here\u2019s ' + fmtDay(date, { weekday: 'long' }) + '.' : times.length && !time ? times.filter((t) => !t.disabled).length + ' times for ' + party + (party === 1 ? ' guest' : ' guests') : ''}</span>
                </div>

                {slots?.json?.closure?.message ? <div className="notice bad">{slots.json.closure.message}</div> : null}

                {time ? (
                  <div className="chosen">
                    <div>
                      <b>{ampm(time)}</b>
                      <span>{a?.name} · {party} {party === 1 ? 'guest' : 'guests'}</span>
                    </div>
                    <button className="btn ghost small" onClick={() => setTime(null)}>Change Time</button>
                  </div>
                ) : loading ? (
                  <div className="tiles compact loading" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span key={i} className="tile ghost" style={{ height: 50 }} />)}</div>
                ) : times.length ? (
                  <TimeGroups tiles compact meals slots={times} value={time} onPick={(s) => setTime(s.key)} />
                ) : null}
                {slots && !times.length && !slots.json?.error && !slots.json?.closure ? <p className="empty">No tables that day. Try another.</p> : null}
                <Notice result={slots} />
              </div>

              {time ? (
                <div className="panel">
                  <h2>Your Details</h2>
                  <p className="sub">{confirmsItself ? 'The club confirms these tables itself. Your request and its answer go to this email.' : 'Your confirmation goes to this email.'}</p>
                  <Details who={who} setWho={setWho} />
                  <div className="group" style={{ marginTop: 22 }}>
                    <h3>The Occasion</h3>
                    <div className="pills">
                      {OCCASIONS.map((o) => (
                        <button key={o} className={'pill' + (who.occasion === o ? ' on' : '')} aria-pressed={who.occasion === o}
                          onClick={() => setWho({ ...who, occasion: who.occasion === o ? '' : o })}>{o}</button>
                      ))}
                    </div>
                  </div>
                  <div className="fields" style={{ marginTop: 18 }}>
                    <label className="field" style={{ flex: '1 1 100%' }}>Requests<textarea rows={3} value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="A table by the window, a high chair, an allergy the kitchen should know about" /></label>
                  </div>
                  <Notice result={made} kind="bad" />
                </div>
              ) : null}
            </>
          )}
        </div>
        <Summary title="Your Table" scene="dining" empty="Choose a time to see your table here."
          rows={time ? [['Where', a?.name], ['Date', fmtDay(date, { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', ampm(time)], ['Guests', party], who.occasion ? ['Occasion', who.occasion] : null] : []}
          fine={time ? (confirmsItself ? 'The club confirms this table and will be in touch.' : 'No payment needed to reserve.') : null}
          reassure={false}>
          {time && !res ? (
            <>
              <button className="btn" disabled={!ready} onClick={reserve}>{confirmsItself ? 'Request the Table' : 'Reserve the Table'}</button>
              {!ready ? <p className="fine">Add your name and email to reserve.</p> : null}
            </>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
