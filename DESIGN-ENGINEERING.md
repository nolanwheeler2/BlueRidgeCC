# Blue Ridge CC: design and developer view, engineering reference

How the demo club site looks and why, and how Developer view works. Covers Blue Ridge commits 008 and 009.

**The brief:** a private club's own site from a good design studio. It must not read as a template or as AI-made. Booking runs through Verde's Booking API underneath, and none of Verde's own look shows.

---

## 1. The system (`styles/globals.css`)
| | |
|---|---|
| **Type** | **Newsreader** (display, optical sizes, light weights for big headlines) and **Hanken Grotesk** (text and controls), loaded in `pages/_document.js`. Avoid Cormorant, Playfair and Inter; they read as generated. |
| **Color** | Ink `#14202b`, paper `#f7f4ee` / `#efeae1`, lines `#ddd6c9` / `#cbc2b2`, **one** brass accent (`#94703a`) used sparingly. Moss, amber and clay are for status only. |
| **Shape** | 2px radius on controls, 4px on panels. Hairlines between items, not boxes around them. |
| **Photography** | Every photo is from Verde's licensed library (`lib/photos.js`). No illustrations anywhere. |
| **Copy** | **Title Case** for headings, buttons, links and menu items ("Reserve a Tee Time"). **Sentence case** for body text and field labels. American English. No spaced all-caps labels, no testimonial cards, no dashes used as punctuation in the UI. |

**Classes the booking pages share** (`panel`, `fields`, `pills`, `datestrip`, `seg`, `togglecard`, `resource`, `summary`, `notice`, `success`, `evgrid`, and the rest) are all styled here. A new page should reuse them before adding its own.

## 2. Photos (`lib/photos.js`, `components/Photo.js`)
- **Source:** `photoUrl(key)` is `<NEXT_PUBLIC_PHOTO_BASE or Verde's site-template-assets bucket>/<key>.jpg`.
- **Per page:** `PAGE_PHOTOS[pathname]` is each page's opener photo and focal point (`focus`, a CSS `object-position`). Adjust the focus when a crop is off.
- **Per amenity:** `AMENITY_PHOTOS[kind]` is the photo for an amenity wherever it's pictured small, used by `components/Scene.js`.
- **`<Photo name focus priority />`:** fills its box, fades in once loaded, and stays a quiet color if the image can't load (never a broken image). Use `priority` only for the one photo at the top of a page.
- **The library's keys** are listed in Verde's `lib/siteTemplatePhotos.ts`. Blue Ridge uses the ones in the bucket.

## 3. The frame (`components/Layout.js`)
- **Header:** white over the opening photo, solid after 24px of scroll. Nav groups (Golf, Stay, Events) open hover and focus menus. On a phone below 1100px, a full-screen menu.
- **Openers:** every inner page gets `PAGE_PHOTOS[pathname]` with `title`, `eyebrow` (shown as the crumb) and `intro`. The home page passes its own `hero`.
- **Footer:** the club's location and phone from `GET /club`, fetched once per visit and cached in the module.

## 4. Developer view
- **Turning it on:** the footer switch, `?dev=1`, or **Ctrl+Shift+D** / **Cmd+Shift+D** (`components/DevMode.js`, remembered in `localStorage` as `br_dev`).
- **Capturing calls:** **`lib/verdeClient.js` `api()`** dispatches a `verde:api` window event for every call: `{ id, at, method, path, status, ms, replayed, idempotencyKey, request, response }`.
- **`components/DevConsole.js`** listens **from page load** (so turning it on later still has history), keeps the last 200 calls, and shows:
  - **Requests:** a list, then details, highlighted JSON, Copy as cURL (against `NEXT_PUBLIC_VERDE_API_BASE` or Verde's API, with the key as `$VERDE_API_KEY`) and Copy Response.
  - **Webhooks:** polls `/api/webhooks/recent` every 4 seconds while open.
  - **Keys:** backtick toggles it, Esc closes it.
- **`components/Result.js`** is kept so pages still compile, but renders nothing; the console replaced inline JSON.
- **Gotcha:** console classes are prefixed `dc-`. An unprefixed class once collided with the site's `.split` layout rule.

## 5. Tee times (`pages/tee-times.js`, commit 009)
- **Booking bar:** course (when there's more than one), players (guests only; a member builds a group) and a cart.
- **The next two weeks,** then the day as a **tee sheet**: `TimeGroups` with `tiles` (in `components/Picker.js`) groups times into Morning, Afternoon and Evening. Each tile shows the time, the price and places left: "Open", "2 places left" or "Full". Times without room for the party are disabled.
- **Choosing a time folds the sheet** into one line with **Change Time**, so "Who's Playing" and the price sit right under it rather than below every tile.
- **Loading** shows placeholder tiles. A **closure**, a **release line** and **API errors** each show as a notice under the day.

## 6. Checking changes
With no Verde key, build and render against a mock API:
```bash
npm install && npx next build
node mock.js &            # answers /club, /tee-times, /tee-times/quote, /tournaments, /packages
VERDE_API_KEY=test VERDE_API_BASE=http://localhost:3200 npx next start -p 3100
```
Then screenshot at 1440 and 390 wide, including with the console open.
