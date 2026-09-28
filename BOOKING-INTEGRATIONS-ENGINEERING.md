# Booking integrations — engineering reference

How a club takes Verde bookings anywhere other than its Verde site: the
**embed** on its own website, the **Booking API** for its developers, **card
payments** through both, **webhooks** back to its systems, and the **switch**
that turns it all on. Built in commits 347–366.

Everything here was read out of the code or verified against the database, not
remembered. Where this document and the code disagree, the code is right and
this is out of date — fix it here in the same commit.

**Naming:** `BOOKING-INTEGRATIONS-*` rather than a module key, because it spans
every booking module. The entitlement is one module, `booking_embed` ("Booking
Embed & API", `lib/modules.ts`).

---

## 1. The shape of it

```
                     ┌──────────────── club's website ────────────────┐
  golfer's browser → │  <script src=".../embed.js" data-key="vk_live_…"> │
                     │        └─ iframe → /embed/<avenue>?key=…          │
                     └──────────────────────┬──────────────────────────┘
                                            │ checks key, domain, module
                                            ▼
                         club's own Verde booking pages (?embed=1)
                           same code, same secure functions, same Stripe

  club's server ──── Bearer vsk_live_… ────► /api/public/v1/*  (Booking API)
                                                │ same secure functions
                                                ▼
                                       Postgres (SECURITY DEFINER functions)
                                                │ triggers on booking tables
                                                ▼
                               webhook_deliveries ── cron ──► club's https URL
```

**The rule that holds it together: one path per decision.** The embed shows the
club's real booking pages. The API calls the same database functions those
pages call. Card payments from the pages and from the API run through one
library. Webhooks come from triggers, so every writer is covered. Nothing is
re-implemented for an integration, so an integration cannot drift from the
product.

---

## 2. The switch — `booking_embed`

| | |
|---|---|
| Entitlement | `course_modules` row, `module_key = 'booking_embed'`, `is_enabled` and `billing_status in ('active','trial')` |
| Checked by | `/embed/<avenue>`, `lib/publicApi.withPublicApi`, `/api/admin/embed-keys` (reports it) |
| Switched by | `/api/admin/booking-embed-access` (commit 366) |
| Club may switch on | with `venue.manage_modules`, **only if** its plan includes it: `course_subscriptions` active/trialing and `verde_plan_modules.is_included` for its plan |
| Verde staff may switch on | `platform.configure_venue`, any club, as `trial` or `active` |
| Switch off | the club, any time; the Stripe webhook's `enforceModuleGates` when the plan drops it |

**It is deliberately not on Settings → Modules.** That page writes
`course_modules` with no plan check, so any module listed there is free. Every
avenue *also* needs its own module (tee sheet → `tee_times`, simulators →
`simulators`, …): `booking_embed` is the channel, not the product.

---

## 3. The embed

| File | Role |
|---|---|
| `public/embed.js` | The two-line loader. Makes the iframe, grows it to the height the page posts. |
| `pages/embed/[avenue].tsx` | Entry. Validates the publishable key, the embedding site's origin against the key's `allowed_origins`, and both modules. Sets a **partitioned** (CHIPS) cookie holding a signed token, then redirects to the real page with `?embed=1` (and `&vs=` for the look). Otherwise renders a notice. |
| `lib/embedToken.ts` | HMAC-SHA256 tokens (`EMBED_TOKEN_SECRET`), 12-hour life, publishable keys `vk_live_…`, the avenue list. |
| `middleware.ts` | Every page gets `Content-Security-Policy: frame-ancestors` = Verde's own origins plus the origin in a valid embed token. **This is the clickjacking defence for the whole product**, not just the embed. |
| `components/public/PublicSiteLayout.tsx` | Embed mode: no header/footer, height posted to the parent. Remembered in `sessionStorage.vd_embed` for the frame's session. |
| `lib/embedStyle.ts` + `lib/themes.buildTheme` | The per-website look (commit 365): color, corners, font, background. Stored on `embed_keys.style`, checked on save *and* on read, passed as `?vs=`, applied **only when `vd_embed` is set**. |
| `pages/admin/site-builder/embed.tsx` | The club's page: status and switch, websites, avenue, look, code; the developer sections. |

**Why a partitioned cookie:** third-party cookies are blocked in an iframe. A
partitioned cookie exists only inside *that* frame on *that* website, so it
works where a normal one would not, and it cannot be used to frame Verde from
anywhere else.

**Avenues:** `tee-times`, `simulators`, `courts`, `lodging`, `tournaments`,
`private-events` (`EMBED_AVENUES`).

**Notices** (`/embed/<avenue>` when it will not proceed): `avenue` (not one
of the six), `key` (missing, unknown or turned off), `domain` (shows the origin
it saw — this is how a club fixes Wix, which runs custom code on its own
domain), `unpaid` (`booking_embed` off), `module` (the avenue's own module off),
`setup` (no token secret, or no club slug).

---

## 4. The Booking API

| | |
|---|---|
| Base | `https://www.imverde.com/api/public/v1`: the `www` host, exactly. Vercel redirects `imverde.com` to it, and clients drop `Authorization` on a cross-host redirect, so a key sent to the bare domain arrives as `401 unauthenticated` (found with the Blue Ridge test site) |
| Frame | `lib/publicApi.withPublicApi`: refuses browsers (an `Origin` header), checks the **secret key** (`vsk_live_` + 40 chars, only its SHA-256 stored in `api_keys`), the scope (`read` / `book`), `booking_embed` and the endpoint's own module, the rate limit, and turns thrown `apiFail`s into `{ error: { code, message } }` |
| Rate limit | counted in Postgres (`api_rate_hit`, per key, per minute) so it holds across server instances: **120** reads, **20** book/cancel |
| Idempotency | `withIdempotency`: every booking-making `POST` needs `Idempotency-Key`; the first response is stored in `api_idempotency` and replayed with `Idempotent-Replayed: true`. Same key, different body → `409` |
| The club | always the **key's** club. A `course_id` in a body names a club *course* (tee times) or is ignored — never another club |
| Reference | `pages/developers/booking-api.tsx` → `/developers/booking-api` |

**Deposits (400).** Where the club takes one - `booking_deposit_quote` for
tee times, `lodging_settings.require_deposit`/`deposit_percent` for rooms -
the card flow charges only the deposit and carries the whole price in the
payment's metadata (`deposit`, `total`, `due`). Completion checks the card paid
exactly `due`, books at `total`, and records `deposit_paid` with what was paid:
`amount_paid_cents` on `bookings` (the counter collects the rest through
`pos_booking_balance`), `deposit_cents`/`deposit_paid_at`/`balance_cents` on
rooms (collected at check-in).

### Endpoints and what decides them

| Endpoint | Decided by |
|---|---|
| `GET /club` | `courses`, `club_courses` (`holes_count`, not `holes`: 384), modules |
| `GET /tee-times`, `POST /tee-times/quote` | `lib/apiTeeTimes` (the booking page's own slot builder, totals, `booking_deposit_quote`) |
| `POST /tee-times/bookings` | `create_guest_booking` (base checked there, fees and tax from the quote: 387); a member: `create_member_tee_booking` |
| `GET /bookings/{id}`, `POST /bookings/{id}/cancel` | `booking_by_access_code`, `cancel_booking_by_access_code` |
| `GET /simulators`, `…/quote`, `…/bookings`, `…/reservations/{id}/cancel` | `lib/apiSimulators`, `simulator_quote`, `create_guest_simulator_booking`, `cancel_bay_reservation` |
| `GET /courts`, `…/quote`, `…/bookings`, `…/reservations/{id}/cancel` | `lib/apiCourts`, `court_quote`, `create_guest_court_booking`, `cancel_court_reservation` |
| `GET /lodging`, `…/quote`, `…/bookings`, `…/reservations/{id}/cancel` | `lib/apiLodging`, `lodging_quote`, `create_guest_lodging_booking`, `cancel_lodging_reservation_for` (395: the club's cutoff days and late-fee percent; guests' or, with `Verde-Member`, the member's own) |
| `GET /dining`, `/dining/availability`, `POST /dining/reservations`, `…/{id}/cancel` | `lib/apiDining`, `dining_day_occupancy`, `create_dining_reservation`, `cancel_dining_reservation` |
| `GET /tournaments`, `POST /tournaments/{id}/entries` | `v_club_tournaments`, `register_guest_for_event` |
| `GET /private-events`, `POST /private-events/enquiries` | `lib/privateEventEnquiry` (shared with the website form) |
| `POST /payments`, `POST /payments/{id}/complete` | `lib/reservationPayments` (§5) |
| `GET /packages`, `…/{id}/availability`, `…/bookings/{id}`, `…/bookings/{id}/cancel` | `lib/packageAvailability`, `package_quote`; `/payments` `type: package` → `create_package_booking`; `cancel_package_booking_for` (408) |
| `GET /members/client`, `POST /members/token`, `GET /members/me`, `POST /members/sign-out` | `lib/apiMembers` (§4a) |

**With `Verde-Member`,** the tee time, simulator, court and room endpoints act
for the member: the members-only checks in `lib/apiTeeTimes`, `apiSimulators`,
`apiCourts`, `apiLodging` take `{ member: true }`, and bookings go through
`create_member_*` (`lib/apiMemberBooking`, `lib/memberBookings`), paid at the
venue, `"payment": "member_account"`, or by card.

**Cancellation fees are reported, never waived.** Without `Verde-Member` the
cancel endpoints touch only guest bookings; with it, only that member's own,
cancelled with `_by` = the member (397), so the club's owner rules apply as
in the app.

**`payment_required`** is what a booking endpoint returns when the club takes
money up front. The integration then uses `/payments`.

---

## 4a. Members: Sign in with Verde (385, 386, 387, 389)

The authorization-code pattern, so a member's password never reaches the
club's site:

1. The club registers **return addresses** on the key (`api_keys.return_urls`,
   **Member sign-in** on the embed page): exact matches, https or http on
   localhost, no fragments. No list, no sign-in.
2. The site sends the member to `/connect?client_id=<key id>&redirect_uri=…&state=…`
   (`pages/connect.tsx`, `/api/connect/info`, `/api/connect/approve`). The
   client id is the key's id; `GET /members/client` returns it with the
   registered addresses (389), so there's nothing to copy.
3. On **Allow**, `api_member_codes` gets a hashed one-time code: five
   minutes, bound to the key and the return address.
4. The site's server swaps it: `POST /members/token` → a `vmt_` token in
   `api_member_tokens` (hashed, 30 days, bound to the key, revocable). The code
   is spent by the first attempt, right or wrong.
5. `Verde-Member: vmt_…` makes `ctx.memberId` in `withPublicApi`. A token from
   another key is `member_token_invalid`.

**`/login?next=` only follows paths on this site** (385). It had been an open
redirect, and `/connect` sends members through it.

The member booking functions (all server-only, member from the session or the
token, never a body): `create_member_simulator_booking`,
`create_member_court_booking`, `create_member_lodging_booking` (375),
`create_member_tee_booking` (387). Shared: `member_club_check` (private club →
must follow it), `member_payment_status`, `member_account_charge` (their own
active account, within its limit; the running balance is the existing
triggers'). A refused charge rolls the whole booking back.

---

## 5. Card payments — `lib/reservationPayments.ts`

One flow for the club's own pages (guests) and the API. **Pay, then book**, so
an abandoned card screen leaves nothing behind.

1. **`startReservationPayment(kind, params)`** — the kind validates params into
   metadata-safe strings; the **database quotes** the price
   (`simulator_quote`, `court_quote`, `lodging_quote`, `lib/apiTeeTimes`); a
   Stripe intent is made for exactly that through `lib/venueIntent.ts` (the
   body of `/api/payments/create-intent`: Connect account, direct or destination
   charge, platform fee, pending `payment_transactions` row). **Everything
   needed to book rides on the intent's metadata** — the payment says what was
   paid for, not the browser.
2. The browser confirms the card with Stripe. Card data never touches Verde.
3. **`completeReservationPayment(pi)`** — re-reads the intent from Stripe **on
   the account it lives on**, requires `succeeded`, then books through the
   kind's secure function **from the metadata, with the amount paid as the
   expected price**, and marks the row paid. If the function refuses (the slot
   went meanwhile, the price moved) it **refunds in full on the right account**
   and says so.

| Kind | Quote | Book | Paid columns |
|---|---|---|---|
| `simulator` | `simulator_quote` | `create_guest_simulator_booking` | `payment_status 'paid'`, `payment_method 'cc_online'`, `payment_intent_id`, `booking_source` |
| `court` | `court_quote` (rentals included) | `create_guest_court_booking` | same, no source column |
| `lodging` | `lodging_quote` | `create_guest_lodging_booking` | same, plus `balance_cents 0` |
| `tee_time` | `lib/apiTeeTimes.quoteTeeTime` | `create_guest_booking`, then the quote's fees and tax written (387) | `stripe_payment_intent_id`, `payment_status 'succeeded'`, `status 'confirmed'`, `source` |
| `event_entry` | `event_entry_quote` (the member fee for a member of the club; every entry check) | `register_paid_entry` (never waitlisted; full or duplicate → refunded) | `stripe_payment_intent_id`, `source` |
| `shop_order` | `place_shop_order` dry run; the basket kept in `shop_checkouts` (metadata can't hold it) | `place_shop_order` from the kept basket | `payment_status 'paid'`, `payment_method 'cc_online'`, `payment_intent_id`; returns the order number as `label` |

**One caller books.** The page's `/api/payments/reservation-complete` (or the
API's `/payments/{id}/complete`) and the Stripe webhook can arrive together. If
both booked, the second would find the slot taken — by the first — and refund a
booking that exists. The lock is a **metadata stamp** (`reservation_claim`) on
the payment's `payment_transactions` row, set with `WHERE … IS NULL` so Postgres
lets exactly one caller through; the other polls for the reservation by its
intent and returns it. A stamp rather than a status value so no check
constraint on `status` can refuse it.

**Where a direct charge lives:** on the club's connected account. The page and
the API pass the club as a *hint* of where to look; the intent's own metadata
decides everything after. The API also requires the intent's club to be the
key's club (`courseMustBe`) before anything is touched.

**Deliberately refused:** tee time **deposits** and room **deposits** (a
part-payment needs `payment_status` values these tables are not known to
allow), tee times where `allow_online_payment` is off.

**Signed-in members are on this path** (375, 387). The caller takes the member
from their session (`reservation-intent`) or token (`/payments` with
`Verde-Member`) and puts `profile_id` on the payment; completion books with
the member function instead of the guest one (`bookAsMember`,
`bookTeeAsMember`) at the price paid, and awards their points once
(`loyalty_award`, reference `<kind>:<id>`). The booking pages never write a
reservation, charge or points from the browser.

---

## 6. Webhooks

| | |
|---|---|
| Tables | `webhook_endpoints` (url, secret, events, failure streak, disabled), `webhook_deliveries` (payload, status, attempts, next attempt) — RLS on, no policies: server only |
| Events come from | `webhook_booking_trigger()` on `bookings`, `simulator_bay_reservations`, `court_reservations`, `lodging_reservations`, `dining_reservations`, `event_attendees`, `private_events` |
| Sending | `/api/cron/webhooks` every minute (`vercel.json`), `lib/webhookSender.sendDueWebhooks` |
| Admin | `/api/admin/webhooks`, the **For developers: webhooks** section |

**Triggers, not application code,** so every writer is covered — the tee sheet,
the POS, the member app, the API, and code not yet written. A trigger **only
queues**; a club with no endpoint returns before the error-catching block; any
error inside it is caught and logged as a warning. **A webhook can never slow
down or fail a booking.** Rows are read through `to_jsonb(NEW)`, so a column a
table lacks is absent rather than an error.

**Events:** `<kind>.created` on insert; `.canceled` on the change to
canceled; `.paid` on the change to `paid`/`succeeded`; `tournament_entry.withdrawn`;
`private_event.updated` on a status change; `ping` from the test button.

**Sending:** `webhook_claim` takes a batch `FOR UPDATE SKIP LOCKED` (and
re-takes anything stuck `sending` for ten minutes). Signed
`Verde-Signature: t=<unix>,v1=<hex HMAC-SHA256 of "t.body">`. 2xx within 10
seconds is delivered; otherwise retried after 1, 5, 30 min, 2, 6, 12 h —
eight tries — then `failed`. **Fifty failures in a row switch the endpoint
off** with the reason. Redirects are not followed.

**Addresses** must be https on the public internet: no IP literals,
`localhost`, `.local`, `.internal`, or dotless names (`webhookUrlProblem`).

---

## 6a. Tee time releases (commits 370–373)

A club opening a season at once puts it through a line: `tee_releases`,
`tee_release_entries`, `tee_release_status`, `tee_release_assign`,
`tee_release_figures`, and the `tee_release_gate` trigger (`BEFORE INSERT` on
`bookings`). Admin: `/admin/tee-sheet/releases`. Waiting room: `/release/<id>`.

- **Lottery or first come** per release; late joiners go to the back either way.
  One place per **account** (a lottery taking email addresses could be stuffed).
- **Admission is arithmetic:** place *p*'s turn is
  `release_at + floor((p−1)/admit_per_minute)` minutes, for `window_minutes`.
  No job moves the line.
- **The gate is on `bookings`,** so every path obeys it; staff with
  `tee_times.create_booking` are exempt. Guests (`booked_by` null) are always
  refused on a governed date, **which includes every API booking**.
- **The API** checks first (`lib/apiTeeTimes.activeReleaseFor`):
  `GET /tee-times` returns `reason: release_in_progress` with the release and
  its `url`; quote, booking and `/payments` answer `409 release_in_progress`
  (the payment path passes the code through rather than wrapping it).
- **The embed** opens the waiting room in a new tab: sign-in and a long wait
  belong in a full tab, not a frame on someone else's page.
- **Scale:** the waiting room is a static page; each poll is a couple of
  indexed reads, jittered, waking at the golfer's own turn; the line's count is
  refreshed at most every five seconds under a try-lock. Measured on one CPU:
  2,586 joins/s, and 4,088 status reads/s at the release moment including
  handing out 10,000 places.
- **Traps found in testing:** a never-assigned plpgsql record read signed out;
  a per-join counter that made the release row a single lock (200 joins/s);
  `platform_nav_config.permission_keys` is `text[]`, though it displays like JSON.

---

## 7. The database functions this depends on

All `SECURITY DEFINER`, `search_path = public`.

| Function | Migration | Called by |
|---|---|---|
| `create_guest_booking` | existing | API, payments |
| `create_guest_simulator_booking` | existing, **fixed in 352** (bay status `'active'`) | simulator page (guests), API, payments |
| `create_guest_court_booking` | existing | court page (guests), API, payments |
| `create_guest_lodging_booking` | existing | lodging page (guests), API, payments |
| `create_dining_reservation`, `cancel_dining_reservation`, `dining_day_occupancy` | 354, **replaced in 355** | dining page, API |
| `register_guest_for_event` | 358 | event page (guests), API |
| `api_rate_hit` | 349 | API frame |
| `webhook_enqueue`, `webhook_booking_trigger`, `webhook_claim` | 364 | triggers, cron |
| `tee_release_*`, `tee_release_figures` | 370–372 | releases (§6a) |
| `create_member_simulator_booking`, `_court_`, `_lodging_`, `member_account_charge`, `member_payment_status`, `member_club_check` | 375 | `/api/bookings/member`, API with `Verde-Member`, payments |
| `loyalty_award` | 379 | every points award (server, register staff); RLS on both loyalty tables |
| `simulator_occupancy`, `court_occupancy`, `lodging_occupancy` | 380 | the public pages' availability (bay/court/room and times only) |
| `place_shop_order` (+ `shop_checkouts`) | 381 | `/api/shop/order`, shop card payments |
| `create_member_tee_booking` | 387 | API with `Verde-Member`, payments |
| `event_entry_quote`, `register_paid_entry` | 398 | the event page, `/payments` `event_entry` |
| `package_quote`, `create_package_booking`, `package_book_tee_slot` | 402, 404 | the package page (`kind: package`) |
| `package_booking_record_payment`, `package_cancellation_quote`, `cancel_package_booking` (as `auth.uid()`) | 406 | Package bookings |
| `find_package_stays`, `spend_package_credit` (+ `package_credit_uses`) | 410 | VerdePOS, through `/api/pos/package-credit` |
| `lodging_cancellation_quote`, `cancel_lodging_reservation` (as `auth.uid()`), `cancel_lodging_reservation_for` (server) | 395 | the room screen, the API |

**Grants matter.** Functions that act on an id alone
(`cancel_dining_reservation`, `register_guest_for_event`, `webhook_claim`,
`api_rate_hit`) are revoked from `public`, `anon` and `authenticated` and
granted to `service_role` only.

---

## 8. Traps

### `courses.club_id` does not exist
Several pages select it; the select fails silently and they fall back to the
course id. `dining_reservations.club_id` **is** the course id. 354 copied
`coalesce(courses.club_id, courses.id)` into SQL and 355 had to replace it.

### `pos_tables.service_area_id` does not exist
Tables belong to an area through `pos_floor_plans.service_area_id`. The dining
page counted with the missing column and treated every area as six tables for
as long as it existed.

### A plpgsql body is not checked when it is created
Both traps above passed `CREATE FUNCTION` and would only have failed on the
first call. Test functions against the real columns, not a stand-in schema that
has the column you assumed.

### `v_club_tournaments` vs `club_events`
The listing reads the view (golf, social, court brackets); guest entry only
works on `club_events` rows (`register_guest_for_event` returns "Event not
found" for a bracket).

### Stripe metadata is capped
500 characters a value, 50 keys. Player names and special requests are trimmed
(480) before they ride on an intent.

### `club_courses.holes` does not exist
It's `holes_count`. `GET /club` asked for `holes`, the whole read failed, the
error went unread, and every club answered `"courses": []` (384). Same shape
as the two above: a wrong column, an unread error, a plausible empty answer.
Check `error` on reads that feed an answer.

### The guest tee time function doesn't know about tax
`create_guest_booking` totals green fee + cart. The API's quote adds service
fees and tax. Sending the quote's total as the expected price refused every
API tee time at a club with tax (387). The base is checked in the database;
fees and tax come from the server's quote and are written to the booking.

### `imverde.com` redirects, and a redirect drops `Authorization`
The documented base is `https://www.imverde.com/api/public/v1`. A client
following the redirect from the bare domain arrives without the key (383).

### Sentry options in v8
`@sentry/nextjs` 8 reads the upload plugin's `errorHandler` only under
`unstable_sentryWebpackPluginOptions`. At the top level it's silently dropped,
and a Sentry outage fails the deploy (388).

### A function that takes "who is asking" as a parameter
`cancel_booking`, `cancel_court_reservation` and `cancel_bay_reservation`
decide from `_by`, an id the caller passes, and were executable by any
signed-in user, so anyone could cancel anyone's booking by passing their id
(396). They're server-only now. Browsers use `cancel_my_booking`,
`cancel_my_court_reservation` and `cancel_my_bay_reservation`, which pass
`auth.uid()`. New functions take the caller from `auth.uid()`, never a
parameter.

### A value the table doesn't allow refuses the whole statement
`bookings.source`, `payment_method` and `payment_status`, and the same on
`lodging_reservations`, have allowed-value CHECKs. `'booking_api'`,
`'package'` and (on rooms) `'deposit_paid'` weren't in them, so every insert or
update carrying one failed: member tee times through the API, the guest tee
time's fees-and-tax update, the card-paid update, room deposits. 403 widened
the lists. **Before writing a new value to any of these columns, check the
table's CHECKs** (`pg_constraint`, `contype = 'c'`), and read the error on
every write.

### A payment id from the browser is not a payment
`/api/events/<id>/register` took `payment_intent_id` from the browser and
recorded the entry as paid in full without asking Stripe, and with no id at
all entered a paid event free (398). It now retrieves the intent and requires
`succeeded`, at least the fee, this event's and this person's metadata, and an
unused id; and it refunds if the event filled meanwhile. New flows use
pay-then-book (`lib/reservationPayments`), where the server made the intent.

### Browser-written tables
Several tables were writable by the browser because pages wrote them: room
bookings (375/377), loyalty (379), and the shop's orders, items, settings and
variants, which had `USING (true)` for everyone (381/382). The pattern
since: a server-only function does the write, then the rule closes.

### Hooks above guards
`audit-structure` fails a hook called after an early return. The embed page's
look state had to move above the permission guards.

---

## 9. Open items

- **No-show fees** for rooms aren't charged automatically.

---

## 10. What to check by hand

1. Switch `booking_embed` on for a test club as a trial; add a website; paste
   the code on a page on that domain; walk a booking through.
2. Change the page's domain → the `domain` notice shows the origin.
3. Book a simulator by card signed out (4242 4242 4242 4242); the row is `paid`.
4. Create an API key; `GET /club`; a tee time quote; a booking with an
   `Idempotency-Key`, twice → replayed.
5. Member sign-in: add a return address to a key; from the Blue Ridge test
   site, **Sign in** → Allow → back signed in; book a members-only simulator on
   account; **Sign out**, and the token no longer works.
5. Add a webhook pointed at webhook.site; **Send a test**; make a booking →
   `tee_time.created` arrives with a signature that verifies.

---

## Packages follow the club's account rule (Verde commit 508)
- **The setting:** "Require an account to book" on the Packages page (Online booking), stored as `require_account_to_book` in the Packages module's `course_modules.settings`. It's **off by default**, so guests book packages at public clubs as before. A private club always requires an account. Saving reads the settings fresh and writes back only this key; it never creates or enables the module.
- **The rule:** `bookingRules()` now includes `packages` (online with the Packages module, `account_required` from the setting). The club app's config carries it like every other area.
- **Enforced** by `guestRefusal(db, club, 'packages')`: card checkout for a package (`KIND_AREA.package`) from anyone not signed in is refused with "This club asks you to sign in to book." That covers the Booking API (`POST /payments { type: 'package' }`), the club app and Verde's own site.
- **Said up front:** `GET /packages` returns `booking: { account_required, message }`, so a website can show "Sign In to Book" instead of failing at payment (Blue Ridge commit 026).

## A member's tee time paid by card is a group (Verde commit 526)
`POST /payments { type: 'tee_time' }` from a **signed-in member** (`ctx.memberId`) goes to the **group checkout** (`tee_group`, the club app's), not the plain tee time checkout. A member sends who's playing (`members`, `guests`, with `cart` and `expected_total_cents`), not a player count, and the plain checkout's fields dropped the group, so every member's card payment was refused ("That booking is not valid"). The group checkout prices the host's group at the club's member rates, applies the limits and fair booking, and books it once paid (`book_tee_group`). The response still says `type: 'tee_time'`, and `POST /payments/{id}/complete` finishes it from the payment's own kind. Guests (no member session) use the plain tee time checkout, as before.
