// components/Photo.js
// A photograph from the club's library (lib/photos.js), cropped to fill its
// box. It fades in once it has loaded, over the paper color, so nothing pops
// or jumps; if it can't load, the box stays a quiet color rather than showing
// a broken image. `priority` is for the one photo at the top of a page.
import { useState } from 'react';
import { photoUrl } from '../lib/photos';

export default function Photo({ name, alt = '', focus = '50% 50%', priority = false, className = '', style }) {
  const [state, setState] = useState('loading');
  return (
    <span className={'photo ' + className + ' ' + state} style={style}>
      {state !== 'failed' ? (
        <img
          src={photoUrl(name)}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : undefined}
          decoding="async"
          style={{ objectPosition: focus }}
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          ref={(el) => { if (el && el.complete && el.naturalWidth && state === 'loading') setState('ready'); }}
        />
      ) : null}
    </span>
  );
}
