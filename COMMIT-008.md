# Commit 008: Blue Ridge, redesigned (the foundation and the home page)

The demo site now looks like a private club's site from a good design studio, not a template. This commit is the foundation, which restyles every booking page at once, plus a new home page. Each booking page then gets its own layout pass, one per commit.

## What changed, and why
| Before | Now |
|---|---|
| Cartoon SVG scenes and drawn mountains | **Real photography** from Verde's licensed library (`site-template-assets` on Verde's storage), art-directed per page. Nothing hosted elsewhere that could break mid-demo. |
| Cormorant and Inter, the defaults every generated site uses | **Newsreader** (an editorial serif with optical sizes) for headlines, **Hanken Grotesk** for text and controls |
| Spaced, all-caps labels over every heading | Real editorial hierarchy: big light headlines, a sentence-case crumb |
| Rounded cards, pills, icons and "Book now →" everywhere | Hairlines instead of boxes, square-ish controls, one brass accent used sparingly, and photography doing the work |
| Testimonial cards and stat cards | Fewer, better sections in the club's own voice |
| JSON boxes printed into the pages in Developer view | A **developer console** drawer |

## The foundation (all pages)
- **`styles/globals.css`** is rewritten. Every class the booking pages use is restyled in the new system, so tee times, simulators, courts, stay, packages, dining, events, private events and "your bookings" all look right now.
- **`components/Layout.js`:**
  - **Header:** white over the opening photograph, solid once you scroll. Golf, Stay and Events open small menus with a line of description each. On a phone, a full-screen menu.
  - **Every page opens on its own photograph** (`lib/photos.js` → `PAGE_PHOTOS`), with the title set large on it.
  - **Footer:** the club's address and phone live from Verde (`GET /club`, fetched once per visit), the site map, "Reservations by Verde", and the Developer view switch.
- **`components/Photo.js`** (new): a library photo that fills its box, fades in once loaded, and stays a quiet color if it can't load (never a broken image). **`components/Scene.js`** now shows the amenity's photograph instead of drawing it, with the same props, so every page using it is unchanged.
- **`lib/photos.js`** (new): library keys, each page's photo and focal point, and each amenity's photo. `NEXT_PUBLIC_PHOTO_BASE` can point at another library.

## Developer view
- **Turning it on:** the footer switch, `?dev=1`, or **Ctrl+Shift+D** (Cmd+Shift+D on a Mac), which is handy mid-pitch.
- **`components/DevConsole.js`** (new): a drawer (**`** backtick opens and closes it, **Esc** closes).
  - **Requests:** every call the site makes to Verde, **captured from page load**, so turning it on mid-demo still shows what the page already did. Each shows method, path, status and time. Open one for what was sent, what came back (highlighted JSON), the idempotency key and whether Verde replayed it, then **Copy as curl** (against Verde's API, with the key left out) or **Copy response**.
  - **Webhooks:** deliveries to `/api/webhooks/verde`, live, with whether the signature verified.
  - A small **API launcher** sits in the corner with the call count and the last status.
- **`lib/verdeClient.js`** reports every call to the console (method, path, status, time, request, response, idempotency key). The pages didn't change.
- **`components/Result.js`** renders nothing now; the console shows it all.

## The home page (`pages/index.js`)
1. **Hero:** full-screen dawn fairway, "Golf where the mountains *turn blue.*", a line of copy, and Reserve a tee time / Stay the night.
2. **The club in one paragraph**, then the facts: holes and courses **live from Verde**, first tee time, ways to book online.
3. **The course:** an aerial photo with an inset flagstick, and the story of the two nines.
4. **Beyond the eighteenth:** cottages, racquets, simulators and stay and play as a photographic grid, with even row heights. The lowest package price is **live**, and an amenity the club doesn't take online reads "By phone".
5. **Dining band:** full-bleed dining room photo, "Supper at last light".
6. **On the calendar:** upcoming tournaments **live from Verde**, as an editorial list (date, title, day and time, entry fee, places left).
7. **Weddings and outings:** a tall photo and the events office pitch.
8. **Visit:** finding us (location live), the pro shop (phone live), and members (sign in or your bookings).

## Checked
Built with `next build`, then rendered in a real browser at desktop and phone sizes, with the console open. That pass caught and fixed:
- the hero's two buttons stacking at desktop;
- uneven photo heights in the amenity grid;
- a class-name clash that squeezed the console's request list into a narrow column;
- a double line under the booking step bar;
- the Reserve button's size on small phones.

## Files
- `styles/globals.css`
- `pages/_document.js`
- `pages/index.js`
- `components/Layout.js`
- `components/DevMode.js`
- `components/DevConsole.js` (new)
- `components/Photo.js` (new)
- `components/Scene.js`
- `components/Result.js`
- `lib/photos.js` (new)
- `lib/verdeClient.js`

## Next
One booking page per commit, starting with **tee times**, each getting a layout designed for it (the booking bar, the time grid, the summary) on top of this foundation.
