// components/Result.js
// The exact request's answer - HTTP status, error, raw JSON. Shown only in
// Developer view (components/DevMode), so a demo reads as a club's website.
import { useDevMode } from './DevMode';

export default function Result({ result, title = 'Response' }) {
  const { dev } = useDevMode();
  if (!dev || !result) return null;
  const err = result.json && result.json.error;
  return (
    <details className="devbox" open>
      <summary>
        <span className="devtag">API</span> {title} <span className="devstatus">HTTP {result.status}{result.replayed ? ' · replayed' : ''}</span>
      </summary>
      {err ? <div className="deverr">{err.code}: {err.message}</div> : null}
      <pre>{JSON.stringify(result.json, null, 2)}</pre>
    </details>
  );
}
