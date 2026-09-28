# Commit 021: One kind of choice control, everywhere

"Balls" on the courts page had the same problem as the tee times cart: a bordered toggle card beside a segmented control, a different shape and height, so the row didn't line up.

## Fixed at the root
- **Court rentals** (`pages/courts.js`): **Balls: None | A Fresh Can**, the same control as **Paddles: None | 2 | 4**, side by side at the same height. The price still updates the moment you choose.
- **Changing a tee time** (`components/ChangeTeeTime.js`, on Your Bookings): the group's carts were the last toggle card. Now **Getting around: Walking | Carts for the group**, matching the tee times page.
- **The toggle card is removed** (`Toggle` in `components/Picker.js`, `.togglecard` in `styles/globals.css`). Every choice on the site, yes-or-no included, is now a segmented control, so a row of choices can't mix shapes again.

## Also
**`DESIGN-ENGINEERING.md`:** the booking-bar rule updated. Every choice is a segmented control, and the toggle card is gone.

## Checked
Built, and the courts page rendered with a court chosen: Paddles and Balls line up as one row. A search of the site finds no toggle card left.

## Files
- `pages/courts.js`
- `components/ChangeTeeTime.js`
- `components/Picker.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
