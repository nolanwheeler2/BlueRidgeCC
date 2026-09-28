// pages/private-events.js
// ============================================
// Private events (laid out for the page in commit 018).
//
// GET /private-events (whether the club takes enquiries, its minimum guests
// and notice, the occasions it hosts) -> POST /private-events/enquiries. An
// enquiry is a request; the club's events office replies with dates, spaces
// and a quote.
//
// A venue page before it's a form: the three spaces, each with its own
// photograph, what it suits and how many it holds; how an event comes
// together, in four steps; then the enquiry beside the events office's
// details. The preferred date respects the club's notice (the earliest date
// offered is today at the club plus the minimum notice - commit 015's clock).
// ============================================

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import Success from '../components/Success';
import Photo from '../components/Photo';
import DatePicker from '../components/DatePicker';
import { useMember } from '../components/Member';
import { useClub } from '../components/Club';
import { api, newKey } from '../lib/verdeClient';
import { addDays, clubToday, fmtDay } from '../lib/clubTime';

const LABEL = { wedding: 'Wedding', corporate: 'Corporate', banquet: 'Banquet', celebration: 'Celebration', golf_outing: 'Golf Outing', meeting: 'Meeting', other: 'Something Else' };
const SPACES = [
  { name: 'The Eighteenth Green', photo: 'events-wedding', text: 'Ceremonies at sunset with the ridge behind you, and cocktails on the lawn while the light goes.', suits: 'Ceremonies, cocktail hours', holds: 'Up to 200 guests' },
  { name: 'The Ridge Room', photo: 'events-banquet', text: 'The ballroom, with a dance floor and doors onto the terrace. Dinners, receptions and the long speeches.', suits: 'Receptions, banquets, dinners', holds: 'Up to 160 seated' },
  { name: 'The Library', photo: 'clubhouse-interior', text: 'Leather, a fireplace and a long table. Board meetings, rehearsal dinners and anything that should stay quiet.', suits: 'Meetings, small dinners', holds: 'Up to 24 seated' },
];
const STEPS = [
  ['Tell Us the Basics', 'The occasion, the headcount and a date. No commitment.'],
  ['Hear Back From the Events Office', 'Open dates, the right space and ideas, usually within a day.'],
  ['Review a Written Quote', 'Everything priced: the space, food and drink, and extras.'],
  ['Hold Your Date', 'A deposit confirms it. The events office takes it from there.'],
];

export default function PrivateEvents() {
  const { club, tz, ready } = useClub();
  const { member } = useMember();
  const [info, setInfo] = useState(null);
  const [f, setF] = useState({ name: '', email: '', phone: '', occasion: 'wedding', guests: 100, preferred_date: '', message: '' });
  const [sent, setSent] = useState(null);
  const [key] = useState(newKey());
  useEffect(() => { api('/private-events').then(setInfo); }, []);
  useEffect(() => { if (member) setF((x) => ({ ...x, name: x.name || member.name || '', email: x.email || member.email || '', phone: x.phone || member.phone || '' })); }, [member]);

  const e = info?.json?.enquiries;
  const today = clubToday(tz);
  /* The earliest date offered: today at the club plus the club's notice. */
  const earliest = addDays(today, e?.min_notice_days || 0);
  /* Six months out by default, once the club's zone is known (commit 015). */
  useEffect(() => { if (ready) setF((x) => (x.preferred_date ? x : { ...x, preferred_date: addDays(clubToday(tz), 180) })); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (f.preferred_date && f.preferred_date < earliest) setF((x) => ({ ...x, preferred_date: earliest })); }, [earliest]); // eslint-disable-line react-hooks/exhaustive-deps

  const occasions = e?.occasions || Object.keys(LABEL);
  const tooFew = e?.min_guests && Number(f.guests) < e.min_guests;
  const closed = e && e.enabled === false;
  const ready2 = !!f.name && (!!f.email || !!f.phone) && !tooFew && !closed;
  const send = async () => setSent(await api('/private-events/enquiries', { method: 'POST', key, body: { ...f, guests: Number(f.guests) } }));
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  const phone = club?.phone;

  return (
    <Layout title="Private Events" eyebrow="Weddings, Outings and Meetings" intro="Tell us what you have in mind. The events office replies with dates, spaces and a quote.">
      <section className="block">
        <div className="wrap">
          <p className="statement">
            A wedding on the <em>eighteenth green</em>, a company outing with the whole course to yourselves, or a quiet dinner in the Library.
            The events office plans it with you, from the first call to the last dance.
          </p>
        </div>
      </section>

      <section className="block alt tight">
        <div className="wrap">
          <h2 className="section-title">The Spaces</h2>
          <div className="spaces">
            {SPACES.map((s) => (
              <article key={s.name} className="space">
                <Photo name={s.photo} alt={s.name} />
                <h3>{s.name}</h3>
                <p>{s.text}</p>
                <dl>
                  <dt>Suits</dt><dd>{s.suits}</dd>
                  <dt>Holds</dt><dd>{s.holds}</dd>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="block tight">
        <div className="wrap">
          <h2 className="section-title">How It Comes Together</h2>
          <ol className="steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}><span className="step-n">{String(i + 1).padStart(2, '0')}</span><b>{t}</b><p>{d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="block alt" id="enquire">
        <div className="wrap booking" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div>
            {sent?.ok ? (
              <Success title="Thank You. We&rsquo;ll Be in Touch">
                The events office has your enquiry for {fmtDay(f.preferred_date)}, {f.guests} guests, and will reply with open dates, spaces and a quote.
              </Success>
            ) : (
              <div className="panel">
                <h2>Plan Your Event</h2>
                <p className="sub">
                  {closed ? 'The club isn\u2019t taking enquiries online right now. Please call the events office.'
                    : [e?.min_guests ? 'For ' + e.min_guests + ' guests or more' : null, e?.min_notice_days ? 'with at least ' + e.min_notice_days + ' days\u2019 notice' : null].filter(Boolean).join(', ') + (e?.min_guests || e?.min_notice_days ? '.' : 'Tell us about your day.')}
                </p>

                <div className="group">
                  <h3>The Occasion</h3>
                  <div className="pills">
                    {occasions.map((o) => (
                      <button key={o} className={'pill' + (f.occasion === o ? ' on' : '')} aria-pressed={f.occasion === o} onClick={() => setF({ ...f, occasion: o })}>{LABEL[o] || o}</button>
                    ))}
                  </div>
                </div>

                <div className="fields" style={{ marginTop: 22 }}>
                  <label className="field">Guests<input type="number" inputMode="numeric" min={e?.min_guests || 1} value={f.guests} onChange={set('guests')} style={{ width: 130 }} /></label>
                  <DatePicker label="Preferred date" id="preferred" value={f.preferred_date} min={earliest} onChange={(d) => setF((x) => ({ ...x, preferred_date: d }))} />
                </div>
                {tooFew ? <div className="notice warn">The club hosts private events for {e.min_guests} guests or more.</div> : null}

                <div className="fields" style={{ marginTop: 22 }}>
                  <label className="field grow">Name<input value={f.name} onChange={set('name')} autoComplete="name" /></label>
                  <label className="field grow">Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
                  <label className="field grow">Phone<input value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
                  <label className="field" style={{ flex: '1 1 100%' }}>Tell us about it<textarea rows={5} value={f.message} onChange={set('message')} placeholder="A ceremony on the eighteenth green, dinner for 120, a band until eleven" /></label>
                </div>
                <Notice result={sent} kind="bad" />
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={send} disabled={!ready2}>Send Enquiry</button>
                  {!ready2 && !closed && !tooFew ? <span className="fine" style={{ margin: 0 }}>Add your name and an email or phone number.</span> : null}
                </div>
              </div>
            )}
          </div>
          <aside className="summary office">
            <div className="summary-art"><Photo name="events-celebration" alt="" style={{ height: 150 }} /></div>
            <div className="summary-body">
              <h3>The Events Office</h3>
              <p className="office-text">One planner from the first call to the last dance. Tours of the spaces by appointment, most days.</p>
              {phone ? <p className="office-line"><span>Call</span><a href={'tel:' + phone.replace(/[^\d+]/g, '')}>{phone}</a></p> : null}
              <p className="office-line"><span>Visit</span>{club?.location || 'On the ridge, western North Carolina'}</p>
              <p className="fine">Enquiries are answered within one business day.</p>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
