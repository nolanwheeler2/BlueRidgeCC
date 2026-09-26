// components/Result.js
// What Verde answered: the error in plain words when there is one, and the
// raw JSON underneath - this is a test site, so the exact response matters.
export default function Result({ result, title = 'Response' }) {
  if (!result) return null;
  const err = result.json && result.json.error;
  return (
    <div className="card">
      <div className="ui" style={{ fontSize: 14, marginBottom: 8 }}>
        <b>{title}</b> - HTTP {result.status}{result.replayed ? ' (replayed: same Idempotency-Key)' : ''}
        {err ? <div className="bad" style={{ marginTop: 6 }}>{err.code}: {err.message}</div> : null}
      </div>
      <pre>{JSON.stringify(result.json, null, 2)}</pre>
    </div>
  );
}
