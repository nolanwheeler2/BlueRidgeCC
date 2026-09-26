// components/Notice.js
// What a golfer sees when something needs their attention - the API's own
// words (they're written for the golfer), not a raw error code. When the club
// books this for members only, the way forward is signing in.
import { useMember } from './Member';

const MEMBERS = new Set(['account_required', 'members_only']);

export default function Notice({ result, kind }) {
  const { member, signIn } = useMember();
  const err = result?.json?.error;
  if (!err) return null;
  if (MEMBERS.has(err.code) && !member) {
    return (
      <div className="notice info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span>{err.code === 'members_only' ? 'The club books this for members.' : 'Members book this online.'} Sign in with your Verde account to see times.</span>
        <button className="btn small" onClick={signIn}>Sign in</button>
      </div>
    );
  }
  return <div className={'notice ' + (kind || 'warn')}>{err.message}</div>;
}
