// components/Mountains.js
// Layered ridgelines - the Blue Ridge at dusk - drawn in SVG, so the hero
// needs no photo to license or load.
export default function Mountains({ className }) {
  return (
    <svg className={className} viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3d9b1" /><stop offset=".55" stopColor="#e9b98f" /><stop offset="1" stopColor="#c98f7a" /></linearGradient>
      </defs>
      <rect width="1440" height="420" fill="url(#sky)" />
      <circle cx="1080" cy="170" r="54" fill="#fbe9c9" opacity=".9" />
      <path d="M0 250 C120 205 220 225 320 200 C430 172 520 215 640 190 C760 165 860 205 980 185 C1110 163 1240 200 1440 175 V420 H0Z" fill="#8ea7c4" />
      <path d="M0 290 C140 250 260 275 390 245 C510 218 620 268 760 240 C900 212 1010 262 1150 236 C1270 214 1360 240 1440 228 V420 H0Z" fill="#5f7fa6" />
      <path d="M0 335 C160 300 300 330 450 302 C600 275 720 322 880 298 C1040 274 1180 318 1320 298 C1380 290 1420 294 1440 292 V420 H0Z" fill="#3b5a80" />
      <path d="M0 375 C200 350 360 372 540 356 C720 340 880 370 1080 354 C1240 342 1360 360 1440 352 V420 H0Z" fill="#23405e" />
    </svg>
  );
}
