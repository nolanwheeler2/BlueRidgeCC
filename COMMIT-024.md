# Commit 024: Booking pages open on today at the club

## Why
Tee times (and simulators, courts and dining) opened on **tomorrow at the club**. Just after midnight at the club, that skipped a whole bookable day: at 12:30 AM Monday Central time, the page opened on Tuesday while all of Monday was still ahead. For a visitor whose own evening is still Sunday, it looked plain wrong.

## Now (`components/Club.js`: `useOpenDay`)
- **Every booking page opens on today at the club,** still on the club's clock, never the visitor's.
- **If today has nothing left to book and nothing explains why** (no closure, no release line, no reserved window), for example late in the evening after the last tee time, the page **moves on to the next day** by itself, up to three days, and **says so** under the day's heading: "No more times today, so here's Tuesday." Dining says "No more tables today…".
- **Once a visitor picks a day themselves,** the page never moves on its own.
- **A day with a closure or reserved window isn't skipped.** Its notice and bands explain the day, so it stays.

## Pages
- `pages/tee-times.js`
- `pages/simulators.js`
- `pages/courts.js`
- `pages/dining.js`

## Checked
Built and rendered with the browser set to Mexico City's time zone, against a mock where today at the club has nothing left. The page asked for today (the 28th), found nothing, opened the 29th, and showed "No more times today, so here's Tuesday." The day strip still starts on today.

## Also
**`DESIGN-ENGINEERING.md`:** the default-day rule.

## Files
- `components/Club.js`
- `pages/tee-times.js`
- `pages/simulators.js`
- `pages/courts.js`
- `pages/dining.js`
- `DESIGN-ENGINEERING.md`
