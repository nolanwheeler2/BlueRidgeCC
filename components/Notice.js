// components/Notice.js
// What a golfer sees when something needs their attention - the API's own
// words (they're written for the golfer), not a raw error code.
export default function Notice({ result, kind }) {
  const err = result?.json?.error;
  if (!err) return null;
  return <div className={'notice ' + (kind || 'warn')}>{err.message}</div>;
}
