# Commit 009: Title Case everywhere, and the tee times page

## Title Case (the whole site)
Headings, buttons, links and menu items are now in **Title Case**: "Reserve a Tee Time", "Stay the Night", "All Tournaments", "Member Sign In", "Your Bookings", "Stay and Play", "Private Events", "Developer View". Body text and field labels stay in sentence case.

This covers the header and its menus, the mobile menu, the footer, the home page (hero, section titles, links), the developer console, and the shared pieces every booking page uses:
- the summary card, "Your Booking";
- the sign-in prompts, "Sign In";
- card payment, "Pay by Card", "One Moment…", "Processing…";
- the group players, "Invite a Member", "Add a Player".

## American English
Checked across every page and component. The only British spelling was internal: the sign-in status code `signin=cancelled`, now `signin=canceled`. The old spelling is still understood, so a link already in flight works. "Cancellation" is also the American spelling, and `already_cancelled` is Verde's API field name.

## Tee times (`pages/tee-times.js`)
- **A booking bar:** course (when there's more than one), players, and "Add a Cart", in one row above the days.
- **The day as a tee sheet:** a heading for the date, then Morning, Afternoon and Evening. Each time is a **tile** with the time large, the price, and the places left ("Open", "2 places left", "Full"). Times without room for your party are grayed out, with the price struck through.
- **Choosing a time folds the sheet** into a single line, "7:30 AM, 2 players", with **Change Time**. "Who's Playing" and the summary's price breakdown are then right there, instead of below every tile.
- **Loading** shows placeholder tiles. A **closure**, a tee time **release line** and **errors** show as notices under the day.
- **Steps:** Choose a Time → Who's Playing → Confirmed.
- **The summary card** is titled "Your Tee Time". Its buttons: "Book and Pay at the Course", "Charge My Member Account", "Pay Now by Card".
- **Everything Verde does is unchanged:** quote, book, card, member groups and invites.

## Checked
Built, and rendered against a mock of Verde's API with a full day of times, at desktop and phone sizes, including picking a time. That caught and fixed:
- "0 places left", now "Full";
- the step bar wrapping on phones;
- the day's time count showing twice.

## Also
**`DESIGN-ENGINEERING.md`** (new): the design system, photos, the frame, Developer view, the tee sheet, and how to check changes against a mock API.

## Files
- `pages/tee-times.js`
- `pages/index.js`
- `pages/api/auth/callback.js`
- `components/Layout.js`
- `components/DevConsole.js`
- `components/Picker.js`
- `components/Summary.js`
- `components/Details.js`
- `components/Notice.js`
- `components/CardPayment.js`
- `components/GroupPlayers.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md` (new)
