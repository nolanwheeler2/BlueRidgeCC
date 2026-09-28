// components/Picker.js
// The booking pages' building blocks: a step bar, a strip of the next days,
// segmented choices, and times grouped into morning, afternoon and evening.
import { todayPlus } from '../lib/verdeClient';

export function StepBar({ steps, at }) {
  return (
    <ol className="stepbar">
      {steps.map((s, i) => <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}><span>{i + 1}</span>{s}</li>)}
    </ol>
  );
}

export function DateStrip({ value, onChange, days = 14, start = 0 }) {
  const list = Array.from({ length: days }, (_, i) => todayPlus(start + i));
  const inList = list.includes(value);
  return (
    <div className="datestrip">
      {list.map((d) => {
        const x = new Date(d + 'T12:00:00');
        return (
          <button key={d} className={'day' + (d === value ? ' on' : '')} onClick={() => onChange(d)}>
            <small>{x.toLocaleDateString('en-US', { weekday: 'short' })}</small>
            <b>{x.getDate()}</b>
            <small>{x.toLocaleDateString('en-US', { month: 'short' })}</small>
          </button>
        );
      })}
      <label className={'day more' + (!inList ? ' on' : '')}>
        <small>Other</small><b>+</b>
        <input type="date" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label="Choose another date" />
      </label>
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

/** slots: [{ key, iso, label, sub, meta, disabled }] - grouped by the club's
 *  local hour. `tiles` lays each time out as a tee sheet tile (commit 009):
 *  the time large, the price, and the places left. */
export function TimeGroups({ slots, value, onPick, tz, tiles = false }) {
  const groups = {};
  for (const s of slots) {
    const h = Number(new Date(s.iso).toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: tz || undefined }));
    (groups[PART(h)] = groups[PART(h)] || []).push(s);
  }
  return (
    <div className="timegroups">
      {['Morning', 'Afternoon', 'Evening'].filter((g) => groups[g]).map((g) => (
        <div key={g} className="tg">
          <div className="tg-h">{g}<span>{groups[g].length} {groups[g].length === 1 ? 'time' : 'times'}</span></div>
          <div className={tiles ? 'tiles' : 'pills'}>
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
