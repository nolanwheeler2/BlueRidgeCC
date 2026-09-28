# Commit 014: The Stay and Play page (packages)

The one booking page that has to sell before it books, so it's laid out that way.

## `pages/packages.js`
- **The packages come first, read like offers:**
  - a small gold **"The Club's Favorite"** on a featured package;
  - the name and description;
  - **everything included** as a list (nights, rounds with the cart, simulator hours, food and drink or pro shop credit, anything else);
  - the terms in one quiet line: which days you can arrive, the deposit or paid in full, and the free cancellation window;
  - the **price for the guests it covers**, plus what each additional guest costs;
  - **Choose Package**.
- **Photos:** a package shows its own photo when the club has uploaded one. When none has, the offers are text-led, as on Stay.
- **Choosing a package folds the list** into one line ("Ridge Weekend · $649 for 2 guests · 2 nights · 2 rounds") with **Change Package**.
- **Dates and Tee Times:**
  - the stay bar with **Arrive**, the nights, and the **departure the package sets**, plus **Guests** within the package's range;
  - a clear warning if the arrival day isn't one the package allows;
  - **each day of your stay** with its tee times as tiles, and a counter, "1 of 2 chosen", that turns green when you've picked them all.
- **Your Details** follows in its own panel, with "Anything we should know?".
- **The summary card, "Your Package",** lists your tee times as you pick them, the total, and what's due today versus on arrival. The card button names the amount: "Pay $194.70 Deposit by Card".
- **Title Case:** steps Choose a Package → Dates and Tee Times → Confirmed, and "Your Stay Is Booked". No dashes used as punctuation.
- **Everything Verde does is unchanged:** availability, the tee time picking rules, and card payment with the confirmation number.

## Checked
Built and rendered against a mock of Verde's API (a featured weekend with a deposit and a paid-in-full midweek package), including choosing a package and a tee time, at desktop and phone sizes. That caught and fixed a double line under the step bar, the chosen line running long enough to push Change Package underneath, and the fixed departure sitting off the date field's line.

## Files
- `pages/packages.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
