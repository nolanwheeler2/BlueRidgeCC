# Commit 020: A real Reserve button, and the cart in the booking bar

## Reserve (`components/Layout.js`)
The header's **Reserve** was a plain white button that only went to tee times. It's now the site's call to action:
- **the logo's gold,** with a **calendar mark** and a small caret, gold over the opening photo and on the solid header alike, with a deeper gold on hover;
- **a menu of everything the club books:** "What would you like to reserve?" then **Tee Time**, **Simulator Bay**, **Court**, **Cottage** and **Table**, each with its own line icon in gold, and an arrow that nudges on hover;
- it opens on click and closes on a click away, Esc or going to a page, so it works the same on a phone.

## The cart (`pages/tee-times.js`)
"Add a Cart" was a bordered toggle card beside the segmented Course control, a different shape and height, so it floated out of the bar. A cart is the same kind of choice as the course, so it's now the same control: **Getting around: Walking | Cart**. The advice moved into the bar's note line: "Walkers welcome all day. A cart is recommended for the climb on the back nine." Course, Players and Getting around now read as one row.

## Also
- **Field labels are sentence case**, as the site's rule says: "Getting around" on tee times, "How long" on simulators and courts.
- **A toggle card** (still used for court rentals) is sized to match a segmented control.
- **`DESIGN-ENGINEERING.md`:** a section on Reserve and the booking bar.

## Not in this commit
The **"Closed: Closed, until …"** notice is Verde's own wording, fixed in **Verde commit 502** (`commit-502.zip`, the web repo). The notice will read "Closed from 10:40 PM to 11:00 PM." once that's deployed. Blue Ridge shows whatever Verde sends.

## Checked
Built and rendered at desktop and phone sizes: the menu open over the photo, the solid header, and the tee times bar with two courses.

## Files
- `components/Layout.js`
- `pages/tee-times.js`
- `pages/simulators.js`
- `pages/courts.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
