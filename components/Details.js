// components/Details.js
// "Who's booking": a signed-in member is shown as themselves (the booking is
// made in their name, on their Verde account); a guest fills in their details
// - or signs in.
import { useMember } from './Member';

export default function Details({ who, setWho, phone = true, extra = null }) {
  const { member, signIn } = useMember();
  if (member) {
    return (
      <div className="member-card">
        <div className="avatar">{(member.name || member.email || '?').slice(0, 1).toUpperCase()}</div>
        <div>
          <b>Booking as {member.name || member.email}</b>
          <span>{member.email}{member.belongs_to_club ? ' · Member' : ''}</span>
        </div>
        {extra}
      </div>
    );
  }
  return (
    <>
      <div className="fields">
        <label className="field grow">Name<input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} autoComplete="name" /></label>
        <label className="field grow">Email<input type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} autoComplete="email" /></label>
        {phone ? <label className="field grow">Phone<input value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} autoComplete="tel" /></label> : null}
      </div>
      {extra}
      <p className="fine" style={{ marginTop: 12 }}>Have a Verde account? <button className="linkish" onClick={signIn}>Sign in</button> to book as yourself.</p>
    </>
  );
}

/** Name and email for a request: the member's own when signed in. */
export function person(who, member) {
  return member ? { name: who.name || member.name || '', email: who.email || member.email || '', phone: who.phone || member.phone || '' } : who;
}
