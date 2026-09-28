# Blue Ridge CC: design and developer view, engineering reference

How the demo club site looks and why, and how Developer view works. Covers Blue Ridge commits 008 and 009.

**The brief:** a private club's own site from a good design studio. It must not read as a template or as AI-made. Booking runs through Verde's Booking API underneath, and none of Verde's own look shows.

---

## 1. The system (`styles/globals.css`)
| | |
|---|---|
| **Type** | **Newsreader** (display, optical sizes, light weights for big headlines) and **Hanken Grotesk** (text and controls), loaded in `pages/_document.js`. Avoid Cormorant, Playfair and Inter; they read as generated. |
| **Color** | Taken from the logo (commit 010): its navy as ink (`#0b2540`) and its gold as the **one** accent (`#997531`), used sparingly. Paper `#f7f4ee` / `#efeae1`, lines `#ddd6c9` / `#cbc2b2`. Moss, amber and clay are for status only. |
| **Logo** | `public/brand/logo.png` (navy and gold, for light backgrounds) and `logo-light.png` (light, gold kept, for over photos and the dark footer), both cut from the club's artwork with its own transparency. The header shows the light one over the opening photo and crossfades to the original once it turns solid. Favicon and touch icon: the peak and flag (`public/favicon.ico`, `apple-touch-icon.png`, `brand/icon-512.png`). |
| **No processor names** | Nothing public-facing names the card processor. The card field is the processor's secure form, but the site's own words never say "Stripe". |
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

## 6. Simulators (`pages/simulators.js`, commit 011)
- **Booking bar:** How Long (30 minutes to 2 hours), Players, and a line on what's included.
- **The next two weeks,** then the day: **each bay as a row** (`.bays` / `.bay`) with its name, its simulator and capacity, and its open starts as compact tiles (`.tiles.compact`). The rows reuse no photo; the opener already shows the bays, and repeating one photo per row reads as a template.
- **A bay too small for the party** says so instead of offering starts. A fully booked bay says "Booked for the day."
- **Choosing a start folds the bays** into one line with Change Time, as on tee times.
- **The row pattern** (`.bays`, `.bay`, `.bay-head`) is meant for courts, rooms and dining areas too.

## 7. Courts (`pages/courts.js`, commit 012)
- **The bay-row pattern.** The booking bar adds **Sport** (All plus each sport the club's courts have) when there's more than one, filtered in the page from `GET /courts`.
- **Each court's row** shows its sport and surface. **Peak starts** carry a gold "Peak" (`.tile.peak`), because they're priced higher.
- **Rentals** (paddles, balls) come **after** a start is chosen, in their own panel with your details, and re-quote live. They're an add-on to a court you've found, not a filter for finding one.

## 8. Stay (`pages/rooms.js`, commit 013)
- **A hotel's layout.** The **stay bar** (`.stay-bar`) is Arrive → the nights → Leave → Guests. Moving the arrival past the departure keeps the stay's length. On a phone the dates sit side by side.
- **Each room is a listing** (`.listings` / `.listing`): name, facts ("Cottage · Sleeps 4 · 2 Queen Beds"), description, amenities (Wi-Fi spelled right), and the nightly rate in whole dollars with the total for the dates, before tax.
- **Photos:** rooms show **their own photos** (`image_url`) when the club has uploaded them, with the library's lodging photo for any without, in a `.pictured` grid. When no room has one, the listings are text-led rather than repeating one stock photo.
- **Choosing a room folds the list** (Change Room). "Anything we should know?" goes with your details.
- **`Summary`** takes `empty`, the line shown before anything is chosen, so each page says the right thing ("Choose a room…", "Choose a start…").

## 9. Stay and Play (`pages/packages.js`, commit 014)
- **The one page that sells before it books.** Packages come first as **offers** (`.offers` / `.offer-card`): a gold "The Club's Favorite" on a featured package, the name, the description, everything included as a dashed list, the terms in one line (arrival days, deposit or paid in full, free cancellation window), and the price for the guests it covers, plus the price per additional guest. Photos follow the rooms rule: the package's own `image_url` when any has one.
- **Choosing a package folds the list** (Change Package). Then **Dates and Tee Times:** the stay bar with Arrive, the nights and the departure the package sets, and Guests within the package's range. A warning shows if the arrival day isn't one the package allows.
- **Each day of the stay** lists its tee times as compact tiles, with a counter ("1 of 2 chosen", green when complete). Picking works as before: one a day while there are enough days, and choosing past the count replaces the latest choice.
- **Your Details** is its own panel. The card button names the amount ("Pay $194.70 Deposit by Card").

## 10. Checking changes
With no Verde key, build and render against a mock API:
```bash
npm install && npx next build
node mock.js &            # answers /club, /tee-times, /tee-times/quote, /tournaments, /packages
VERDE_API_KEY=test VERDE_API_BASE=http://localhost:3200 npx next start -p 3100
```
Then screenshot at 1440 and 390 wide, including with the console open.
