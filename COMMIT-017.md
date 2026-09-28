# Commit 017: The tournaments page, and entering paid events online

## `pages/tournaments.js`
**The club's tournament calendar** instead of a grid of cards.
- **Events grouped by month** ("October 2026").
- **Each event is a row:**
  - the day large, with its weekday;
  - the time, the format and sport ("5:30 PM · Scramble");
  - the description;
  - the entry fee, **places left** (amber when there are 5 or fewer, red when full) and **when entries close**;
  - a thin bar showing how full it is.
- **What each event offers,** straight from Verde:
  - **Enter**, or **Join the Waitlist** when it's full, where the club takes outside entries;
  - **Enter at the Club**, linking to the club's own event page, when it doesn't;
  - **Members Only** when there's no public sign-up at all.
- **Entering opens right under the event:** your details (a signed-in member enters as themselves), then:
  - **free events:** **Enter the Event** (or **Join the Waitlist**);
  - **paid events: Pay $250 Entry by Card.** This is new. The old page only entered free events and sent everyone else to the club's site. It uses Verde's card payment for event entries (`type: 'event_entry'`, Verde commit 398).
- **The result shows in place:** "You're In" or "On the Waitlist", with a line under the event.
- **Every date and time is the club's (commit 015):** an event at 5:30 PM shows 5:30 PM for a visitor in any time zone, and months are grouped by the club's calendar.
- **Title Case** throughout. No dashes as punctuation.

## Also
**`DESIGN-ENGINEERING.md`:** a tournaments section.

## Checked
Built and rendered against a mock of Verde's API with four events (a free scramble, a paid member-guest with 3 places left, a full members-only championship, and a finale entered on the club's page), with the browser set to Mexico City's time zone and Spanish (Mexico), at desktop and phone sizes, including opening a paid entry.

## Files
- `pages/tournaments.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
