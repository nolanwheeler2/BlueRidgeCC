// components/Scene.js
// Small illustrated scenes - one per amenity - for card headers and the
// booking summary. Drawn in SVG like the hero, so there are no photos to
// license, and they share its palette.
const SKY = { dawn: ['#f6e3c3', '#e9c29a'], day: ['#dfe9f1', '#bcd0e1'], dusk: ['#e9c7a5', '#b98e8a'], night: ['#2b4a6f', '#1d3450'] };

function Frame({ sky = 'day', children, height = 120 }) {
  const [a, b] = SKY[sky];
  const id = 'g' + sky;
  return (
    <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" width="100%" height={height} aria-hidden="true" style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
      <rect width="320" height="120" fill={`url(#${id})`} />
      {children}
    </svg>
  );
}

const Hills = ({ c1 = '#8ea7c4', c2 = '#5f7fa6' }) => (
  <>
    <path d="M0 70 C60 52 110 64 170 50 C230 36 280 58 320 48 V120 H0Z" fill={c1} opacity=".75" />
    <path d="M0 88 C70 74 130 88 200 76 C250 68 290 80 320 74 V120 H0Z" fill={c2} opacity=".85" />
  </>
);

export default function Scene({ kind, height }) {
  if (kind === 'golf') return (
    <Frame sky="dawn" height={height}><Hills />
      <path d="M0 100 C80 92 160 96 320 90 V120 H0Z" fill="#6f8f72" />
      <ellipse cx="210" cy="98" rx="46" ry="7" fill="#88a98a" />
      <path d="M214 98 V62" stroke="#f7f3ea" strokeWidth="2" /><path d="M214 62 L236 68 L214 74Z" fill="#b5794a" />
      <circle cx="120" cy="104" r="3" fill="#fff" />
    </Frame>
  );
  if (kind === 'sim') return (
    <Frame sky="night" height={height}>
      <rect x="60" y="22" width="200" height="72" rx="4" fill="#0f1c2b" stroke="#8ea7c4" strokeWidth="2" />
      <path d="M62 80 C110 60 160 70 258 56 V92 H62Z" fill="#3f6b4f" /><path d="M62 70 C110 52 170 60 258 44 V60 C170 72 110 64 62 84Z" fill="#6f8f72" opacity=".7" />
      <path d="M90 84 Q170 20 230 50" stroke="#f3d9b1" strokeWidth="1.5" fill="none" strokeDasharray="3 4" />
      <rect x="0" y="100" width="320" height="20" fill="#16273c" /><circle cx="160" cy="104" r="3" fill="#fff" />
    </Frame>
  );
  if (kind === 'court') return (
    <Frame sky="day" height={height}><Hills c1="#a9bfd4" c2="#8ea7c4" />
      <path d="M30 118 L90 70 H230 L290 118Z" fill="#4f7a8f" /><path d="M30 118 L90 70 H230 L290 118" stroke="#f7f3ea" strokeWidth="2" fill="none" />
      <path d="M160 70 V118 M60 94 H260" stroke="#f7f3ea" strokeWidth="1.5" /><path d="M70 90 H250" stroke="#1d3450" strokeWidth="3" />
      <circle cx="200" cy="80" r="4" fill="#e6d25a" />
    </Frame>
  );
  if (kind === 'room') return (
    <Frame sky="dusk" height={height}><Hills c1="#8a8fa8" c2="#5f6f8f" />
      <path d="M110 96 V62 L160 36 L210 62 V96Z" fill="#efe6d6" /><path d="M100 64 L160 30 L220 64" stroke="#7a4b32" strokeWidth="6" fill="none" strokeLinejoin="round" />
      <rect x="148" y="72" width="24" height="24" fill="#7a4b32" /><rect x="122" y="66" width="16" height="14" fill="#f3d9b1" /><rect x="182" y="66" width="16" height="14" fill="#f3d9b1" />
      <path d="M0 96 H320 V120 H0Z" fill="#4f6b54" />
    </Frame>
  );
  if (kind === 'dining') return (
    <Frame sky="dusk" height={height}><Hills c1="#9a8f9e" c2="#6f6f8a" />
      <rect x="0" y="92" width="320" height="28" fill="#6a4a36" />
      <ellipse cx="160" cy="88" rx="80" ry="8" fill="#f7f3ea" /><path d="M96 88 V104 M224 88 V104" stroke="#f7f3ea" strokeWidth="3" />
      <path d="M140 72 h8 l-2 12 h-4z M172 72 h8 l-2 12 h-4z" fill="#f3d9b1" /><path d="M158 60 v24" stroke="#b5794a" strokeWidth="2" /><circle cx="158" cy="58" r="3" fill="#f3d9b1" />
    </Frame>
  );
  if (kind === 'events') return (
    <Frame sky="day" height={height}><Hills />
      <path d="M0 100 C80 92 160 96 320 90 V120 H0Z" fill="#6f8f72" />
      <path d="M40 40 L80 60 L120 40 L160 60 L200 40 L240 60 L280 40" stroke="#b5794a" strokeWidth="1.5" fill="none" />
      {[60, 100, 140, 180, 220, 260].map((x, i) => <path key={x} d={`M${x} ${i % 2 ? 51 : 49} l6 10 h-12z`} fill={i % 2 ? '#1d3450' : '#f3d9b1'} />)}
    </Frame>
  );
  return (
    <Frame sky="dusk" height={height}><Hills c1="#9a8f9e" c2="#6f6f8a" />
      <path d="M0 100 H320 V120 H0Z" fill="#4f6b54" />
      <path d="M130 100 V64 H190 V100" fill="#f7f3ea" /><path d="M122 66 L160 44 L198 66Z" fill="#efe6d6" />
      {[70, 110, 210, 250].map((x) => <circle key={x} cx={x} cy={58} r="4" fill="#f3d9b1" opacity=".9" />)}
    </Frame>
  );
}
