// components/Picker.js
// The booking pages' building blocks: a step bar, a strip of the next days,
// segmented choices, and times grouped into morning, afternoon and evening.
import { useClub } from './Club';
import DatePicker from './DatePicker';
import { addDays, clubToday, fmtDay } from '../lib/clubTime';

export function StepBar({ steps, at }) {
  return (
    <ol className="stepbar">
      {steps.map((s, i) => <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}><span>{i + 1}</span>{s}</li>)}
    </ol>
  );
}

/* The next days AT THE CLUB (commit 015), then "Other" for a calendar that
   always reads MM/DD/YYYY. */
export function DateStrip({ value, onChange, days = 14, start = 0 }) {
  const { tz } = useClub();
  const today = clubToday(tz);
  const list = Array.from({ length: days }, (_, i) => addDays(today, start + i));
  return (
    <div className="datestrip">
      {list.map((d) => (
        <button key={d} className={'day' + (d === value ? ' on' : '')} onClick={() => onChange(d)} aria-pressed={d === value}>
          <small>{fmtDay(d, { weekday: 'short' })}</small>
          <b>{Number(d.slice(8))}</b>
          <small>{fmtDay(d, { month: 'short' })}</small>
        </button>
      ))}
      <DatePicker variant="tile" value={value && !list.includes(value) ? value : null} onChange={onChange} min={today} />
    </div>
  );
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="seg-field">
      {label ? <span className="seg-label">{label}</span> : null}
      <div className="seg" role="group" aria-label={label}>
        {options.map(([v, l]) => <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, title, detail }) {
  return (
    <button className={'togglecard' + (checked ? ' on' : '')} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span className="box">{checked ? '✓' : ''}</span>
      <span><b>{title}</b>{detail ? <small>{detail}</small> : null}</span>
    </button>
  );
}

const PART = (h) => (h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening');
/* A dining room's parts of the day (commit 016): lunch starts at 11. */
const MEAL = (h) => (h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : 'Dinner');

/** slots: [{ key, iso, label, sub, meta, disabled, hour? }] - grouped by the
 *  hour AT THE CLUB (commit 015): `tz`, else the club's zone; never the
 *  visitor's. A slot that is already a club wall-clock time (dining's "18:30")
 *  passes `hour` and is grouped by it as-is. `tiles` lays each time out as a
 *  tee sheet tile (commit 009): the time large, the price, the places left;
 *  `compact` makes them the smaller start tiles (dining, commit 016). */
export function TimeGroups({ slots, value, onPick, tz, tiles = false, compact = false, meals = false }) {
  const { tz: clubTz } = useClub();
  const zone = tz || clubTz;
  const groups = {};
  for (const s of slots) {
    const h = s.hour != null ? s.hour
      : Number(new Date(s.iso).toLocaleTimeString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: zone }));
    const part = (meals ? MEAL : PART)(h);
    (groups[part] = groups[part] || []).push(s);
  }
  return (
    <div className="timegroups">
      {(meals ? ['Breakfast', 'Lunch', 'Dinner'] : ['Morning', 'Afternoon', 'Evening']).filter((g) => groups[g]).map((g) => (
        <div key={g} className="tg">
          <div className="tg-h">{g}<span>{groups[g].length} {groups[g].length === 1 ? 'time' : 'times'}</span></div>
          <div className={tiles ? 'tiles' + (compact ? ' compact' : '') : 'pills'}>
            {groups[g].map((s) => tiles ? (
              <button key={s.key} disabled={s.disabled} className={'tile' + (value === s.key ? ' on' : '')} onClick={() => onPick(s)} aria-pressed={value === s.key}>
                <span className="tile-time">{s.label}</span>
                {s.sub ? <span className="tile-price">{s.sub}</span> : null}
                {s.meta ? <span className="tile-meta">{s.meta}</span> : null}
              </button>
            ) : (
              <button key={s.key} disabled={s.disabled} className={'pill' + (value === s.key ? ' on' : '')} onClick={() => onPick(s)}>
                {s.label}{s.sub ? <small>{s.sub}</small> : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
