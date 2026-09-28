# Commit 526: Members can pay for tee times on club websites; card bookings keep their code in the club app

## Club websites (Blue Ridge): "That booking is not valid"
**Every signed-in member paying for a tee time by card on a club's website was refused.** A member sends who's playing (the members and guests with them) rather than a player count. The Booking API's payments route (`POST /payments { type: 'tee_time' }`) converted the request with the plain tee time fields (`players`, `player_names`), which **dropped the group**, so the checkout received no valid player count.

**Fixed (`pages/api/public/v1/payments/index.ts`):** a member's tee time payment now goes to the **group checkout** (`tee_group`), the same one the club app uses. It takes exactly what a member sends (members, guests, cart and the expected total), prices the group at the club's member rates, applies limits and fair booking, and books it once paid. The response still says `tee_time`, and completing it works unchanged, so **Blue Ridge needs no change.** Guests (not signed in) are unaffected.

## The club app: a card booking confirms with its code (app batch)
Paying at the club or on account showed the booking's code on the confirmation. **Paying by card made the booking correctly but lost the code** on the way back, so the confirmation appeared without it.
- `ClubCardPay.swift`: the finishing step keeps the code Verde returns and hands it to the screen (`onCode`, declared before `onDone` so screens can pass it ahead of the trailing closure). It's cleared at the start of each payment, so a booking can never show a previous one's code. Other screens using the card sheet are unaffected.
- `ClubTeeTimeBooking.swift`: a card-paid tee time now confirms with its code, like the others.

## Docs
**`BOOKING-INTEGRATIONS-ENGINEERING.md`:** "A member's tee time paid by card is a group".

## Files
- **Web:** `pages/api/public/v1/payments/index.ts` (commit 519's version, plus this), `BOOKING-INTEGRATIONS-ENGINEERING.md`
- **App:** `ClubApp/ClubCardPay.swift`, `ClubApp/ClubTeeTimeBooking.swift`
