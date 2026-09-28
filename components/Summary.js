// components/Summary.js
// The booking summary beside every booking form: a picture of what you're
// booking, the details, the club's price line by line, the buttons to finish,
// and what happens next.
import { money } from '../lib/verdeClient';
import Scene from './Scene';

export default function Summary({ title = 'Your Booking', scene, rows = [], lines = [], total, children, fine, reassure = true }) {
  const shown = rows.filter(Boolean);
  const priced = lines.filter((l) => l && l[1]);
  return (
    <aside className="summary">
      {scene ? <div className="summary-art"><Scene kind={scene} height={110} /></div> : null}
      <div className="summary-body">
        <h3>{title}</h3>
        {shown.length ? (
          <dl>{shown.map(([k, v]) => [<dt key={k + 't'}>{k}</dt>, <dd key={k + 'd'}>{v}</dd>])}</dl>
        ) : <p className="empty">Choose a time to see the details here.</p>}
        {priced.length ? (
          <div className="lines">{priced.map(([k, c]) => <div key={k}><span>{k}</span><span>{money(c)}</span></div>)}</div>
        ) : null}
        {total != null ? <div className="total"><span>Total</span><span>{money(total)}</span></div> : null}
        {children ? <div className="actions">{children}</div> : null}
        {fine ? <p className="fine">{fine}</p> : null}
        {reassure ? (
          <ul className="reassure">
            <li>Confirmation emailed right away</li>
            <li>Card details are encrypted and never stored by the club</li>
            <li>Change or cancel from your confirmation</li>
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
