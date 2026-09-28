# Commit 022: Reserved windows drawn inside the tee sheet

Needs **Verde commit 504** (`commit-504.zip`, the web repo), which adds `blocked` to `GET /tee-times`.

## Why
A tee sheet block (a league, a tournament, a members-only morning, a closure) took times off the page and left a **gap with no reason**. On Treetop's Test course, the recurring Monday block made the day stop at 7:50 AM with no explanation.

## `components/Picker.js`, `pages/tee-times.js`
- **Each reserved window is a band inside the tee sheet, right where its gap is:** "7:00 AM to 8:00 AM · Members only", then the 8:00 AM tile; "11:00 AM to 1:00 PM · Reserved for the Monday Men's League" after 10:50 AM; "4:00 PM to 11:00 PM · Closed" after the last afternoon time.
- **Labels come from Verde** in golfer's words: the league's or event's real name when the block is linked, never the staff's own name for the block.
- **Styles:** reserved windows are quiet, members-only carries the logo's gold, a closure the clay red.
- **A part of the day that's entirely reserved** still shows, with its band and "No times", instead of vanishing.
- **An all-day closure** stays in the red notice alone, not repeated as a band.
- **"No tee times on…"** only shows when there's truly nothing: no times and no reserved windows.

## Also
**`DESIGN-ENGINEERING.md`:** a section on reserved windows.

## Checked
Built and rendered against a mock of Verde's API with a members-only hour, a league at midday and a late closure. Each band sits exactly in its gap.

## Files
- `components/Picker.js`
- `pages/tee-times.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
