// pages/packages.js
// Stay-and-play packages, from list to booked:
//   GET /packages -> GET /packages/{id}/availability -> POST /payments (type "package")
//   -> POST /payments/{id}/complete (the whole stay booked; a confirmation number back).
// Look up or cancel one on Manage a booking.
import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Result from '../components/Result';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import Scene from '../components/Scene';
import CardPayment from '../components/CardPayment';
import Details, { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, Segmented } from '../components/Picker';
import { api, money, todayPlus } from '../lib/verdeClient';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/* The next date on or after `from` that the package allows arriving. */
function nextArrival(p, from) {
  const days = p.arrival_days?.length ? p.arrival_days : [0, 1, 2, 3, 4, 5, 6];
  const start = p.season?.starts && p.season.starts > from ? p.season.starts : from;
  for (let i = 0; i < 14; i++) {
    const d = new Date(start + 'T12:00:00'); d.setDate(d.getDate() + i);
    if (days.includes(d.getDay())) return d.toISOString().slice(0, 10);
  }
  return start;
}

function includesOf(p) {
  const i = p.includes || {}; const out = [];
  if (i.nights) out.push(i.nights + (i.nights === 1 ? ' night' : ' nights') + ' in a cottage');
  if (i.rounds) out.push(i.rounds + (i.rounds === 1 ? ' round' : ' rounds') + ' of ' + (i.holes || 18) + (i.cart ? ', cart included' : ''));
  if (i.simulator_hours) out.push(i.simulator_hours + ' simulator ' + (i.simulator_hours === 1 ? 'hour' : 'hours'));
  if (i.food_and_beverage_credit) out.push(money(i.food_and_beverage_credit.cents) + (i.food_and_beverage_credit.per_guest ? ' per guest' : '') + ' for food and drink');
  if (i.pro_shop_credit) out.push(money(i.pro_shop_credit.cents) + (i.pro_shop_credit.per_guest ? ' per guest' : '') + ' in the pro shop');
  (i.other || []).forEach((x) => out.push(x));
  return out;
}

export default function Packages() {
  const [list, setList] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [arrival, setArrival] = useState('');
  const [guests, setGuests] = useState(2);
  const [avail, setAvail] = useState(null);
  const [picked, setPicked] = useState([]);
  const [who, setWho] = useState({ name: '', email: '', phone: '', requests: '' });
  const [done, setDone] = useState(null);
  const { member } = useMember();

  useEffect(() => { api('/packages').then(setList); }, []);
  const packages = list?.json?.packages || [];

  const choose = (p) => {
    setPkg(p); setDone(null); setPicked([]);
    setGuests(p.price.min_guests);
    setArrival(nextArrival(p, todayPlus(3)));
  };

  useEffect(() => {
    if (!pkg || !arrival) return;
    setAvail(null); setPicked([]);
    api('/packages/' + pkg.id + '/availability?arrival=' + arrival + '&guests=' + guests).then(setAvail);
  }, [pkg, arrival, guests]);

  const a = avail?.ok ? avail.json : null;
  const rounds = a?.rounds || 0;
  const dayOf = (start) => a?.days.find((d) => d.tee_times.some((t) => t.start === start))?.date;
  const togglePick = (start, date) => setPicked((cur) => {
    if (cur.includes(start)) return cur.filter((x) => x !== start);
    let next = cur;
    if (rounds <= (a?.days.length || 1)) next = next.filter((x) => dayOf(x) !== date);
    if (next.length >= rounds) next = next.slice(0, rounds - 1);
    return [...next, start].sort();
  });

  const p = person(who, member);
  const ready = a && a.bookable && picked.length === rounds && (!!member || (who.name && who.email));
  const guestOptions = useMemo(() => pkg ? Array.from({ length: (pkg.price.max_guests || 4) - pkg.price.min_guests + 1 }, (_, i) => pkg.price.min_guests + i).map((n) => [n, String(n)]) : [], [pkg]);

  return (
    <Layout title="Stay and Play" eyebrow="Packages" intro="A night or two in the cottages, rounds on the course, dinner on us. One price, booked in one go.">
      <div className="wrap booking">
        <div>
          <StepBar steps={['Choose a package', 'Dates and tee times', 'Confirmed']} at={done ? 2 : pkg ? 1 : 0} />
          {done ? (
            <Success title="Your stay is booked">
              {pkg.name}, arriving {fmt(arrival)}. {money(done.paid_cents ?? done.total_cents)} paid
              {done.payment === 'deposit_paid' ? ', the rest on arrival' : ''}. Your confirmation number is <b>{done.confirmation}</b> - keep it to look up or cancel your stay.
            </Success>
          ) : (
            <>
              <div className="panel">
                <h2><span className="n">1</span>Choose a package</h2>
                <div className="resources">
                  {packages.map((x) => (
                    <div key={x.id} className={'resource' + (pkg?.id === x.id ? ' selected' : '')}>
                      <div className="art">{x.image_url ? <img src={x.image_url} alt="" /> : <Scene kind="room" height={190} />}</div>
                      <div className="body">
                        <h3>{x.name}{x.featured ? <span className="tag good" style={{ marginLeft: 8 }}>Featured</span> : null}</h3>
                        {x.description ? <p>{x.description}</p> : null}
                        <ul className="checks">{includesOf(x).map((t) => <li key={t}>{t}</li>)}</ul>
                        <div className="tags" style={{ marginTop: 8 }}>
                          <span className="tag">Arrive {x.arrival_days.length === 7 ? 'any day' : x.arrival_days.map((d) => DAYS[d]).join(', ')}</span>
                          <span className="tag">{x.payment.mode === 'deposit' ? x.payment.deposit_percent + '% deposit' : 'Paid in full'}</span>
                          <span className="tag">Free to cancel {x.cancellation.free_until_days_before} days out</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                          <span style={{ fontSize: 14, color: 'var(--muted)' }}><b style={{ fontSize: 20, color: 'var(--navy)' }}>{money(x.price.base_cents)}</b> for {x.price.covers_guests}{x.price.per_extra_guest_cents ? ', +' + money(x.price.per_extra_guest_cents) + ' a guest' : ''}</span>
                          <button className={'btn small' + (pkg?.id === x.id ? '' : ' ghost')} onClick={() => choose(x)}>{pkg?.id === x.id ? 'Selected' : 'Choose'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {list?.ok && !packages.length ? <p className="empty" style={{ marginTop: 16 }}>No packages on offer right now.</p> : null}
                <Notice result={list} />
              </div>

              {pkg ? (
                <div className="panel">
                  <h2><span className="n">2</span>Dates and tee times</h2>
                  <p className="sub">{a ? (a.quote.nights ? a.quote.nights + (a.quote.nights === 1 ? ' night' : ' nights') + ', leaving ' + fmt(a.quote.departure) + '. ' : '') + (rounds ? 'Choose ' + rounds + ' tee ' + (rounds === 1 ? 'time' : 'times') + ' (' + picked.length + ' of ' + rounds + ').' : '') : 'Choose when you arrive.'}</p>
                  <div className="fields">
                    <label className="field">Arrive<input type="date" value={arrival} min={todayPlus(0)} onChange={(e) => setArrival(e.target.value)} /></label>
                    <Segmented label="Guests" value={guests} onChange={setGuests} options={guestOptions} />
                  </div>
                  {a && a.rooms_free === 0 ? <div className="notice warn">No cottages are free for those dates. Try another arrival day.</div> : null}
                  {a && a.bookable && rounds ? a.days.map((d) => (
                    <div key={d.date} style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>{fmt(d.date)}</div>
                      {d.tee_times.length ? (
                        <div className="pills">
                          {d.tee_times.map((t) => <button key={t.start} className={'pill' + (picked.includes(t.start) ? ' on' : '')} aria-pressed={picked.includes(t.start)} onClick={() => togglePick(t.start, d.date)}>{t.time}</button>)}
                        </div>
                      ) : <p className="empty">{d.reason === 'release' ? 'Released through a waiting line.' : 'No tee times with room for your party.'}</p>}
                    </div>
                  )) : null}
                  <Notice result={avail} />
                  {a && a.bookable ? (
                    <div style={{ marginTop: 18 }}>
                      <Details who={who} setWho={setWho} />
                      <div className="fields" style={{ marginTop: 14 }}>
                        <label className="field" style={{ flex: '1 1 100%' }}>Anything we should know?<textarea rows={2} value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="Celebrating something, late arrival..." /></label>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
          <Result result={avail} title="GET /packages/{id}/availability" />
          <Result result={list} title="GET /packages" />
        </div>
        <Summary title="Your package" scene="room"
          rows={pkg ? [['Package', pkg.name], ['Arrive', arrival ? fmt(arrival) : '-'], ['Guests', guests], ...(a?.quote.nights ? [['Leave', fmt(a.quote.departure)]] : []), ...picked.map((s, i) => ['Tee time ' + (i + 1), new Date(s).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })])] : []}
          lines={a ? [[pkg.name + ', ' + guests + (guests === 1 ? ' guest' : ' guests'), a.quote.total_cents]] : []}
          total={a?.quote.total_cents}
          fine={a ? (a.quote.deposit ? money(a.quote.due_now_cents) + ' today, ' + money(a.quote.total_cents - a.quote.due_now_cents) + ' on arrival.' : 'Paid in full today.') + ' Free to cancel until ' + pkg.cancellation.free_until_days_before + ' days before you arrive' + (pkg.cancellation.late_fee_percent ? '; after that ' + pkg.cancellation.late_fee_percent + '% is kept.' : '.') : null}>
          {a && !done ? (
            ready
              ? <CardPayment label={(a.quote.deposit ? 'Pay ' + money(a.quote.due_now_cents) + ' deposit' : 'Pay ' + money(a.quote.total_cents)) + ' by card'}
                  start={{ type: 'package', package_id: pkg.id, arrival, guests, tee_times: picked, course_id: a.course_id, ...p, requests: who.requests }}
                  onDone={(j) => setDone(j.booking)} />
              : <p className="fine">{picked.length < rounds ? 'Choose your tee ' + (rounds === 1 ? 'time' : 'times') + ' to continue.' : 'Add your name and email to book.'}</p>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
