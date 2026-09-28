# Commit 013: The Stay page (the cottages)

You choose dates here, not a time slot, so the page gets a hotel's layout rather than a tee sheet's.

## `pages/rooms.js`
- **A stay bar:** **Arrive**, the number of nights between the dates, **Leave**, and **Guests**. Moving your arrival past your departure keeps the length of your stay instead of breaking. On a phone, the dates sit side by side.
- **Your dates as the heading** ("Mon, Oct 5 to Wed, Oct 7"), with how many rooms are free for your party.
- **Each room as a proper listing:**
  - the name;
  - what it is and who it sleeps ("Cottage · Sleeps 4 · 2 Queen Beds");
  - the description and the amenities;
  - the nightly rate in whole dollars ("$289 a night") with **the total for your dates** ("$578 for 2 nights, before tax");
  - **Choose Room**.
- **Photos:** rooms show their own photos when the club has uploaded them. When no room has a photo, the listings are text-led instead of repeating one stock image, which is what made the old version look templated.
- **Choosing a room folds the list** into one line ("The Ridge Cottage · Mon, Oct 5 to Wed, Oct 7 · 2 nights · 2 guests") with **Change Room**. Then Your Details and "Anything we should know?".
- **Title Case:**
  - steps Choose a Room → Your Details → Confirmed;
  - "Your Stay Is Booked";
  - buttons "Book and Pay at Check-In", "Charge My Member Account", "Pay Now by Card".
- **The deposit line** no longer uses a dash as punctuation.
- **Everything Verde does is unchanged:** quote, book, card, member account and requests.

## Shared
- **`components/Summary.js`** takes `empty`, the line shown before anything is chosen. Stay says "Choose a room to see your stay here."; simulators and courts say "Choose a start…".
- **Segmented controls** are only as wide as their choices, everywhere.
- **`DESIGN-ENGINEERING.md`:** a Stay section.

## Checked
Built and rendered against a mock of Verde's API (a cottage, a suite and a room) at desktop and phone sizes, including choosing a room.

## Files
- `pages/rooms.js`
- `pages/simulators.js`
- `pages/courts.js`
- `components/Summary.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
