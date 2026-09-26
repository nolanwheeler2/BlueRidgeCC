// components/Success.js
import { Check } from './Icons';
export default function Success({ title, code, children }) {
  return (
    <div className="panel success">
      <div className="mark"><Check /></div>
      <h2>{title}</h2>
      {code ? <div className="code">{code}</div> : null}
      <div style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
