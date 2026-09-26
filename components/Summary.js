// components/Summary.js
// The booking summary beside every booking form - what, when, the club's
// price, and the buttons to finish.
import { money } from '../lib/verdeClient';

export default function Summary({ title = 'Your booking', rows = [], total, children, fine }) {
  return (
    <aside className="summary">
      <h3>{title}</h3>
      {rows.length ? (
        <dl>{rows.filter(Boolean).map(([k, v]) => [<dt key={k + 't'}>{k}</dt>, <dd key={k + 'd'}>{v}</dd>])}</dl>
      ) : <p className="empty">Choose a time to see the details here.</p>}
      {total != null ? <div className="total"><span>Total</span><span>{money(total)}</span></div> : null}
      {children ? <div className="actions">{children}</div> : null}
      {fine ? <p className="fine">{fine}</p> : null}
    </aside>
  );
}
