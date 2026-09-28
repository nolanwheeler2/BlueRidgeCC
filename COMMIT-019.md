# Commit 019: The Your Bookings page (the last page)

## `pages/manage.js`
**Signed in: Your Bookings.**
- **Invitations** come first:
  - who invited you (a gold "From Tom Whitaker");
  - the time and course, your share, and **when the club stops holding your place**;
  - **Accept and Charge My Account** / **Accept and Pay $89.00 by Card** / **Accept and Pay at the Club**, as the club allows, or **Decline**.
- **Coming Up** is an itinerary. Each booking has:
  - the day large;
  - what it is (Tee Time, Dining, Stay…);
  - the time and place ("7:30 AM · The Ridge");
  - its status, party, price or your share, and **the booking code**;
  - who's playing.
- **Change Time or Players** (tee times you host) opens right under the booking.
- **Cancelling asks first, in place:** "Cancel this tee time? Any late fee is shown before anything is charged. **Yes, Cancel** / **Keep It**". The old page used the browser's pop-up box. The result (any late fee, any refund) shows under that booking.
- **Show the Last 90 Days** adds an **Earlier** section.

**Not signed in: Find Your Booking.**
- Choose what you booked, paste the reference from your confirmation email, then **Look It Up** or **Cancel Booking** (with the same in-place check).
- The booking found shows with its code, or for a package its confirmation number, payment, tee times and remaining credits.
- "Members: **Sign In** to see everything you've booked, without a reference."
- A signed-in member sees this lookup below their itinerary as **Booked Without Signing In?**.

**Help:** Changing Plans, Cancellation Fees and Need a Hand sit in a quiet strip at the foot of the page instead of boxes at the top.

## Fixed
Commit 015 moved this page's times to the club's clock but missed loading the club's zone in the lookup section, so **looking up a booking as a guest would have crashed the page**. It's loaded now, and a guest lookup was tested.

## Also
**`DESIGN-ENGINEERING.md`:** a Your Bookings section.

## Checked
Built and rendered against a mock of Verde's API, with the browser set to Mexico City's time zone and Spanish (Mexico):
- **signed in,** with an invitation, a hosted tee time with an invited player, a dinner and a stay, including the in-place cancel check;
- **as a guest,** looking up a tee time by reference.

## Files
- `pages/manage.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
