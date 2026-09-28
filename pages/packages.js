// pages/packages.js
// ============================================
// Stay and Play - packages (laid out for the page in commit 014).
//
//   GET /packages -> GET /packages/{id}/availability -> POST /payments (type
//   "package") -> POST /payments/{id}/complete (the whole stay booked; a
//   confirmation number back). Look one up or cancel it on Your Bookings.
//
// The one page that sells before it books, so the packages come first and
// read like offers: the name, what it is, everything included, the terms, and
// the price. Choosing one folds the list; then the dates and the tee times go
// together - arrive and guests, the nights it covers, and each day of the stay
// with its times, counting the rounds chosen against the rounds included.
// ============================================

import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Notice from '../components/Notice';
import Summary from '../components/Summary';
import Success from '../components/Success';
import Photo from '../components/Photo';
import CardPayment from '../components/CardPayment';
import Details, { person } from '../components/Details';
import { useMember } from '../components/Member';
import { StepBar, Segmented } from '../components/Picker';
import { api, money } from '../lib/verdeClient';
import DatePicker from '../components/DatePicker';
import { useClub } from '../components/Club';
import { addDays, clubToday, fmtDateTime, fmtDay, weekdayOf } from '../lib/clubTime';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/* Calendar dates at the club (lib/clubTime, commit 015). */
const fmt = (d) => fmtDay(d, { weekday: 'short', month: 'short', day: 'numeric' });
const longFmt = (d) => fmtDay(d);
const rate = (c) => (c % 100 === 0 ? '$' + (c / 100).toLocaleString('en-US') : money(c));

/* The next date on or after `from` that the package allows arriving. */
function nextArrival(p, from) {
  const days = p.arrival_days?.length ? p.arrival_days : [0, 1, 2, 3, 4, 5, 6];
  const start = p.season?.starts && p.season.starts > from ? p.season.starts : from;
  for (let i = 0; i < 14; i++) {
    const d = addDays(start, i);
    if (days.includes(weekdayOf(d))) return d;
  }
  return start;
}

function includesOf(p) {
  const i = p.includes || {}; const out = [];
  if (i.nights) out.push(i.nights + (i.nights === 1 ? ' night' : ' nights') + ' in a cottage');
  if (i.rounds) out.push(i.rounds + (i.rounds === 1 ? ' round' : ' rounds') + ' of ' + (i.holes || 18) + (i.cart ? ', cart included' : ''));
  if (i.simulator_hours) out.push(i.simulator_hours + ' simulator ' + (i.simulator_hours === 1 ? 'hour' : 'hours'));
  if (i.food_and_beverage_credit) out.push(rate(i.food_and_beverage_credit.cents) + (i.food_and_beverage_credit.per_guest ? ' per guest' : '') + ' for food and drink');
  if (i.pro_shop_credit) out.push(rate(i.pro_shop_credit.cents) + (i.pro_shop_credit.per_guest ? ' per guest' : '') + ' in the pro shop');
  (i.other || []).forEach((x) => out.push(x));
  return out;
}

function termsOf(p) {
  const days = p.arrival_days || [];
  return [
    days.length === 7 || !days.length ? 'Arrive any day' : 'Arrive ' + (days.length === 1 ? DAYS[days[0]] : days.map((d) => SHORT[d]).join(', ')),
    p.payment?.mode === 'deposit' ? p.payment.deposit_percent + '% deposit to book' : 'Paid in full to book',
    p.cancellation ? 'Free to cancel until ' + p.cancellation.free_until_days_before + ' days out' : null,
  ].filter(Boolean);
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
  const { member, signIn } = useMember();
  const { tz } = useClub();
  const today = clubToday(tz);

  useEffect(() => { api('/packages').then(setList); }, []);
  const packages = list?.json?.packages || [];
  /* The club asks guests to sign in to book a package (Verde commit 508):
     said up front, not discovered at payment. A signed-in member books. */
  const signInFirst = !member && !!list?.json?.booking?.account_required;
  const pictured = packages.some((x) => x.image_url);

  const choose = (p) => {
    setPkg(p); setDone(null); setPicked([]);
    setGuests(p.price.min_guests);
    setArrival(nextArrival(p, addDays(today, 3)));
  };
  const unchoose = () => { setPkg(null); setAvail(null); setPicked([]); };

  useEffect(() => {
    if (!pkg || !arrival) return;
    setAvail(null); setPicked([]);
    api('/packages/' + pkg.id + '/availability?arrival=' + arrival + '&guests=' + guests).then(setAvail);
  }, [pkg, arrival, guests]);

  const a = avail?.ok ? avail.json : null;
  const rounds = a?.rounds || 0;
  const dayOf = (start) => a?.days.find((d) => d.tee_times.some((t) => t.start === start))?.date;
  /* One round a day while there are at least as many days as rounds;
     choosing past the count replaces the latest choice. */
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
          <StepBar steps={['Choose a Package', 'Dates and Tee Times', 'Confirmed']} at={done ? 2 : pkg ? 1 : 0} />
          {done ? (
            <Success title="Your Stay Is Booked">
              {pkg.name}, arriving {longFmt(arrival)}. {money(done.paid_cents ?? done.total_cents)} paid{done.payment === 'deposit_paid' ? ', the rest on arrival' : ''}.
              Your confirmation number is <b>{done.confirmation}</b>. Keep it to look up or cancel your stay.
            </Success>
          ) : (
            <>
              <div className="panel">
                {pkg ? (
                  <div className="chosen" style={{ marginTop: 0 }}>
                    <div>
                      <b>{pkg.name}</b>
                      <span>{[rate(pkg.price.base_cents) + ' for ' + pkg.price.covers_guests + (pkg.price.covers_guests === 1 ? ' guest' : ' guests'),
                        pkg.includes?.nights ? pkg.includes.nights + (pkg.includes.nights === 1 ? ' night' : ' nights') : null,
                        pkg.includes?.rounds ? pkg.includes.rounds + (pkg.includes.rounds === 1 ? ' round' : ' rounds') : null].filter(Boolean).join(' · ')}</span>
                    </div>
                    <button className="btn ghost small" onClick={unchoose}>Change Package</button>
                  </div>
                ) : null}
                {!pkg && signInFirst ? (
                  <div className="notice info">{list.json.booking.message || 'This club asks you to sign in to book.'} <button className="linkish" onClick={signIn}>Sign In</button></div>
                ) : null}
                {pkg ? null : !list ? (
                  <div className="bays" aria-hidden="true" style={{ marginTop: 0 }}>{[0, 1].map((i) => <div key={i} className="bay"><span className="tile ghost" style={{ height: 160 }} /></div>)}</div>
                ) : (
                  <div className="offers">
                    {packages.map((x) => (
                      <article key={x.id} className={'offer-card' + (pictured ? ' pictured' : '')}>
                        {pictured ? (
                          <div className="listing-photo">{x.image_url ? <img src={x.image_url} alt={x.name} loading="lazy" /> : <Photo name="clubhouse-patio" alt="" />}</div>
                        ) : null}
                        <div className="offer-main">
                          {x.featured ? <p className="offer-flag">The Club&rsquo;s Favorite</p> : null}
                          <h3>{x.name}</h3>
                          {x.description ? <p className="listing-text">{x.description}</p> : null}
                          <ul className="checks">{includesOf(x).map((t) => <li key={t}>{t}</li>)}</ul>
                          <p className="listing-amenities">{termsOf(x).join(' · ')}</p>
                        </div>
                        <div className="listing-price">
                          <b>{rate(x.price.base_cents)}</b>
                          <span>for {x.price.covers_guests} {x.price.covers_guests === 1 ? 'guest' : 'guests'}</span>
                          {x.price.per_extra_guest_cents ? <small>{rate(x.price.per_extra_guest_cents)} for each additional guest</small> : null}
                          {signInFirst
                            ? <button className="btn" onClick={signIn}>Sign In to Book</button>
                            : <button className="btn" onClick={() => choose(x)}>Choose Package</button>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {list?.ok && !packages.length ? <p className="empty">No packages are on offer right now. The cottages and tee times can still be booked on their own.</p> : null}
                <Notice result={list} />
              </div>

              {pkg ? (
                <div className="panel">
                  <h2>Dates and Tee Times</h2>
                  <div className="stay-bar" style={{ marginTop: 18 }}>
                    <DatePicker label="Arrive" id="arrive" value={arrival} min={today} onChange={setArrival}
                      allow={pkg.arrival_days?.length && pkg.arrival_days.length < 7 ? pkg.arrival_days : undefined} />
                    {a?.quote.nights ? <div className="stay-nights">{a.quote.nights} {a.quote.nights === 1 ? 'night' : 'nights'}</div> : null}
                    {a?.quote.nights ? (
                      <div className="stay-date"><span>Leave</span><div className="stay-fixed">{fmt(a.quote.departure)}</div></div>
                    ) : null}
                    {guestOptions.length > 1 ? <Segmented label="Guests" value={guests} onChange={setGuests} options={guestOptions} /> : null}
                  </div>
                  {pkg.arrival_days?.length && pkg.arrival_days.length < 7 && arrival && !pkg.arrival_days.includes(weekdayOf(arrival))
                    ? <div className="notice warn">This package arrives on {pkg.arrival_days.map((d) => DAYS[d]).join(' or ')}. Choose one of those days.</div> : null}
                  {avail && !a ? <Notice result={avail} /> : null}
                  {a && a.rooms_free === 0 ? <div className="notice warn">No cottages are free for those dates. Try another arrival day.</div> : null}

                  {a && a.bookable && rounds ? (
                    <>
                      <div className="tee-day">
                        <h2 style={{ fontSize: 24 }}>Your Tee Times</h2>
                        <span className={picked.length === rounds ? 'count done' : 'count'}>{picked.length} of {rounds} chosen</span>
                      </div>
                      <p className="sub" style={{ margin: '0 0 6px' }}>Choose {rounds === 1 ? 'one tee time' : rounds + ' tee times'} for your party{rounds <= (a.days.length || 1) && rounds > 1 ? ', one a day' : ''}.</p>
                      <div className="bays">
                        {a.days.map((d) => (
                          <div key={d.date} className="bay">
                            <div className="bay-head"><h3 style={{ fontSize: 22 }}>{longFmt(d.date)}</h3></div>
                            {d.tee_times.length ? (
                              <div className="tiles compact">
                                {d.tee_times.map((t) => (
                                  <button key={t.start} className={'tile' + (picked.includes(t.start) ? ' on' : '')} aria-pressed={picked.includes(t.start)} onClick={() => togglePick(t.start, d.date)}>
                                    <span className="tile-time">{t.time}</span>
                                  </button>
                                ))}
                              </div>
                            ) : <p className="empty">{d.reason === 'release' ? 'Tee times this day are released through a waiting line.' : 'No tee times with room for your party this day.'}</p>}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}

              {a && a.bookable ? (
                <div className="panel">
                  <h2>Your Details</h2>
                  <p className="sub">Your confirmation and number go to this email.</p>
                  <Details who={who} setWho={setWho} />
                  <div className="fields" style={{ marginTop: 18 }}>
                    <label className="field" style={{ flex: '1 1 100%' }}>Anything we should know?<textarea rows={3} value={who.requests} onChange={(e) => setWho({ ...who, requests: e.target.value })} placeholder="A late arrival, something you're celebrating" /></label>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
        <Summary title="Your Package" scene="stayplay" empty="Choose a package to see your stay here."
          rows={pkg ? [['Package', pkg.name], ['Arrive', arrival ? fmt(arrival) : '\u2014'], ...(a?.quote.nights ? [['Leave', fmt(a.quote.departure)]] : []), ['Guests', guests], ...picked.map((s, i) => ['Tee time ' + (i + 1), fmtDateTime(s, a?.timezone || tz, { weekday: 'short', hour: 'numeric', minute: '2-digit' })])] : []}
          lines={a ? [[pkg.name + ', ' + guests + (guests === 1 ? ' guest' : ' guests'), a.quote.total_cents]] : []}
          total={a?.quote.total_cents}
          fine={a ? (a.quote.deposit ? money(a.quote.due_now_cents) + ' today, ' + money(a.quote.total_cents - a.quote.due_now_cents) + ' on arrival.' : 'Paid in full today.') + ' Free to cancel until ' + pkg.cancellation.free_until_days_before + ' days before you arrive' + (pkg.cancellation.late_fee_percent ? '; after that, ' + pkg.cancellation.late_fee_percent + '% is kept.' : '.') : null}>
          {a && !done ? (
            ready
              ? <CardPayment label={a.quote.deposit ? 'Pay ' + money(a.quote.due_now_cents) + ' Deposit by Card' : 'Pay ' + money(a.quote.total_cents) + ' by Card'}
                  start={{ type: 'package', package_id: pkg.id, arrival, guests, tee_times: picked, course_id: a.course_id, ...p, requests: who.requests }}
                  onDone={(j) => setDone(j.booking)} />
              : <p className="fine">{picked.length < rounds ? 'Choose your tee ' + (rounds === 1 ? 'time' : 'times') + ' to continue.' : 'Add your name and email to book.'}</p>
          ) : null}
        </Summary>
      </div>
    </Layout>
  );
}
