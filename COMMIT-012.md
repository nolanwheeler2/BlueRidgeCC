# Commit 012: The courts page

The simulators pattern, for courts.

## `pages/courts.js`
- **A booking bar:**
  - **Sport** (All, Pickleball, Tennis), shown when the club's courts are more than one sport;
  - **How Long** (1 Hour, 90 Min, 2 Hours);
  - **Players**.
- **The next two weeks,** then the day ("21 starts open · Peak hours are marked").
- **Each court as a row:** its name, its sport and surface ("Pickleball · Hard Court"), and its open starts. **Peak starts** carry a small gold "Peak", since they cost a little more. The repeated court photo per row is gone, as on simulators.
- **Choosing a start folds the courts** into one line ("8:00 AM · Court One · 1 hour · 4 players · Peak") with **Change Time**.
- **Rentals come next, in their own panel:** paddles (None, 2, 4) and a can of balls, updating the price live. They used to sit in the way while you were still looking for a court.
- **Then Your Details,** and the summary card "Your Court Time", where a peak start shows as "(peak)".
- **Title Case:**
  - steps Choose a Court → Your Details → Confirmed;
  - "Your Court Is Booked";
  - buttons "Book and Pay at the Club", "Charge My Member Account", "Pay Now by Card".
- **Everything Verde does is unchanged:** quote with rentals, book, card and member account.

## Also
- In a row mixing peak and regular starts, every time sits centered in its tile.
- `DESIGN-ENGINEERING.md`: a courts section.

## Checked
Built and rendered against a mock of Verde's API (two pickleball courts and a clay tennis court, with peak hours), including choosing a start and seeing the rentals step.

## Files
- `pages/courts.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
