# Commit 011: The simulators page

Laid out for the page, on the pattern tee times set.

## `pages/simulators.js`
- **A booking bar:** **How Long** (30 Min, 1 Hour, 90 Min, 2 Hours), **Players**, and a line on what's included.
- **The next two weeks,** then the day with a count ("19 starts open for 1 hour").
- **Each bay as a row:** its name, what it is and who it fits ("Trackman iO · Up to 6 players"), and its open starts as tiles.
  - The rows no longer repeat the same bay photo on every one. The page's opening photo shows the bays; one photo copied three times reads as a template.
- **Honest states:** a bay too small for your party says so ("This bay takes up to 4 players."), and a full one says "Booked for the day."
- **Choosing a start folds the bays** into one line ("9:00 AM · Bay One · 1 hour · 2 players") with **Change Time**, so Your Details and the price sit right there.
- **Loading** shows placeholder rows. A **closure** shows under the day.
- **Title Case:**
  - steps Choose a Bay → Your Details → Confirmed;
  - "Your Bay Is Booked";
  - buttons "Book and Pay at the Club", "Charge My Member Account", "Pay Now by Card";
  - summary card "Your Bay Time".
- **Everything Verde does is unchanged:** quote, book, card and member account.

## Shared fixes (`styles/globals.css`)
- **Times never wrap.** On a phone, "10:00 AM" was breaking onto two lines inside its tile; the smaller tiles now set the time a size down so it fits.
- **Name, email and phone share one row** where there's room. Phone used to drop onto its own line.
- **The summary card's reassurances** line up when they wrap.
- **New row pattern for bays** (`.bays`, `.bay`, `.bay-head`, `.tiles.compact`), ready for courts, rooms and dining areas.

## Checked
Built and rendered against a mock of Verde's API (three bays, one fully booked) at desktop and phone sizes, including choosing a start.

## Files
- `pages/simulators.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
