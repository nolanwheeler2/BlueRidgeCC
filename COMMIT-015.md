# Commit 015: Every date on the club's clock, and always MM/DD/YYYY

The date fields used the browser's own date input. That input shows dates in the visitor's format (dd/mm/yyyy for a visitor abroad) and counts "today" on the visitor's clock. The site also formatted several times in the visitor's zone. Fixed at the root: the site now has one club time zone and one set of date tools, and uses nothing else.

## The club's clock, everywhere
- **`components/Club.js`** (new): `ClubProvider` loads the club from Verde once per visit (`GET /club`, including its `timezone`). `useClub()` gives every page the club and its zone.
- **`useClubDate(offset)`:** a page's starting day is counted from **today at the club**, and only once the club's zone is known. A visitor in another time zone at 11 PM no longer starts on the wrong day.
- **`lib/clubTime.js`** (new): the site's only date math. Calendar days can't be shifted by any visitor's offset, and every time of day is shown in the club's zone.
- **Now on the club's clock:**
  - the two-week day strip on tee times, simulators, courts and dining;
  - tee sheet grouping (Morning, Afternoon, Evening);
  - dining's times, which are club wall-clock times and are never converted;
  - Stay's and Stay and Play's dates;
  - package tee times in the summary;
  - Your Bookings (every booking, invitation and hold);
  - changing a tee time;
  - event cards and the home page's calendar.

## MM/DD/YYYY, always
**`components/DatePicker.js`** (new) replaces every browser date field (Stay's Arrive and Leave, Stay and Play's Arrive, Private Events' preferred date, and the day strip's "Other").
- The field **always reads 10/05/2026**, whatever language or region the visitor's computer is set to. Typing digits fills in the slashes. A date that isn't real (02/31) or isn't allowed goes back to the last good one.
- **The calendar** is in English, Sunday first, marks **today at the club**, grays out past days, and for a package, only allows its arrival days.
- **"Other" on the day strip** opens the calendar floating above the page (the strip scrolls sideways and would cut it off), and then shows the date you chose like the other tiles.

## Checked
- **Built,** then rendered with the browser set to **Mexico City's time zone and Spanish (Mexico)**, the setting that makes a normal date field read day/month/year. Every field reads MM/DD/YYYY, and today is the club's today.
- **Date tools tested directly:** a visitor at 11:30 PM Oct 4 in Mexico City correctly gets Oct 5 at a New York club; 02/31/2026 is rejected; day counts across the daylight saving change are right.
- **A sweep** of the site for any date formatted on the visitor's clock finds none. The only matches are money formatting.

## Files
- **New:** `lib/clubTime.js`, `components/Club.js`, `components/DatePicker.js`
- `pages/_app.js`
- `lib/verdeClient.js`
- `components/Layout.js`
- `components/Picker.js`
- `components/ChangeTeeTime.js`
- `components/EventCard.js`
- `pages/index.js`
- `pages/tee-times.js`
- `pages/simulators.js`
- `pages/courts.js`
- `pages/dining.js`
- `pages/rooms.js`
- `pages/packages.js`
- `pages/private-events.js`
- `pages/manage.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
