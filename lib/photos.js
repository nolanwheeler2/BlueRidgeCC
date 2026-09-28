// lib/photos.js
// ============================================
// The club's photography (commit 008).
//
// Every photo on the site comes from Verde's licensed template library - the
// site-template-assets bucket on Verde's own storage - so there is nothing to
// license separately and nothing hosted anywhere that could disappear mid-demo.
// A real club would swap these for its own shoot; the keys stay the same.
// ============================================

const STORAGE = (process.env.NEXT_PUBLIC_PHOTO_BASE
  || 'https://apnuagczfgwdlthmxrsb.supabase.co/storage/v1/object/public/site-template-assets').replace(/\/+$/, '');

/** A library photo's address, by its key ("course-hero-dawn"). */
export function photoUrl(key) {
  return STORAGE + '/' + encodeURIComponent(key) + '.jpg';
}

/** Which photo leads each page, and where its subject sits in the frame. */
export const PAGE_PHOTOS = {
  '/tee-times': { key: 'course-hero-golden', focus: '50% 62%' },
  '/simulators': { key: 'amenities-simulator', focus: '50% 45%' },
  '/courts': { key: 'amenities-courts', focus: '50% 55%' },
  '/rooms': { key: 'amenities-lodging', focus: '50% 50%' },
  '/packages': { key: 'clubhouse-exterior', focus: '50% 55%' },
  '/dining': { key: 'dining-room', focus: '50% 50%' },
  '/tournaments': { key: 'events-outing', focus: '50% 55%' },
  '/private-events': { key: 'events-wedding', focus: '50% 45%' },
  '/manage': { key: 'clubhouse-interior', focus: '50% 50%' },
  '/webhooks': { key: 'course-hero-aerial', focus: '50% 50%' },
};

/** The photo for each amenity, wherever an amenity is pictured small. */
export const AMENITY_PHOTOS = {
  golf: 'course-green', sim: 'amenities-simulator', court: 'amenities-courts', room: 'amenities-lodging',
  stayplay: 'clubhouse-patio', dining: 'dining-plate', events: 'events-outing', venue: 'events-banquet',
};
