// components/Scene.js
// The picture beside a booking, an event or an amenity. It used to draw an
// illustration; it now shows the club's photograph for that amenity (commit
// 008). Same props, so every page that uses it is unchanged.
import Photo from './Photo';
import { AMENITY_PHOTOS } from '../lib/photos';

export default function Scene({ kind, height = 120 }) {
  return (
    <Photo name={AMENITY_PHOTOS[kind] || 'course-fairway'} className="scene-photo" style={{ height, display: 'block' }} />
  );
}
