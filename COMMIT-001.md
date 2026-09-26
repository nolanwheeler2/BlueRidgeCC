# COMMIT-001 — Blue Ridge CC: a test website for every Verde API feature

**For the Blue Ridge CC repo, not the Verde repo.** A small Next.js site
that books through Verde's Booking API the way a club's own website or app
would. Every page is a working booking screen that also shows the exact
request and response underneath.

## Set up (once)

1. **In Verde,** for the test club: switch on **Booking on your own website**
   (Website → Booking on your own website; as Verde staff, "as a trial").
2. **Under "For developers: the Booking API,"** create a secret key that can
   **make and cancel bookings**.
3. **In Vercel,** set three environment variables (see `.env.example`), none
   of them `NEXT_PUBLIC_`:
   - `VERDE_API_KEY`: the secret key;
   - `VERDE_API_BASE`: `https://imverde.com/api/public/v1`;
   - `VERDE_WEBHOOK_SECRET`: from the next step.
4. **Under "For developers: webhooks,"** add
   `https://<this site>/api/webhooks/verde`, copy the signing secret into
   `VERDE_WEBHOOK_SECRET`, and redeploy.

## The pages

| Page | Exercises |
|---|---|
| `/` | `GET /club`, and which kinds of booking the club has on |
| `/tee-times` | `GET /tee-times`, `POST /tee-times/quote`, `POST /tee-times/bookings` (pay at the course), **card** via `/payments`; a release date shows **"Join the line"** |
| `/simulators` | availability, quote, booking, **card** |
| `/courts` | availability with peak times, quote **with paddles and balls**, booking, **card** |
| `/rooms` | availability for dates, quote, booking with requests, **card** |
| `/dining` | areas, availability (few left / full), reservation (`confirmed` or `waitlist`) |
| `/tournaments` | the list with fee and spots; **Enter** where guests can; otherwise a link to the club's sign-up page |
| `/private-events` | the club's rules, and an enquiry |
| `/manage` | look up a tee time; **cancel** a tee time, simulator, court or dining reservation |
| `/webhooks` | deliveries from Verde, newest first, verified or refused, refreshing every 5 seconds |

## How it's built: the right way, on purpose

- **The secret key never reaches a browser.** Pages call this site's own
  `/api/verde/…`, which adds the key on the server and forwards the request
  (`lib/verdeServer.js`). Verde refuses browser requests anyway.
- **Every POST that makes something sends its own `Idempotency-Key`,** so a
  double click or retry can't book twice; the response shows "replayed" when
  Verde returns the first answer.
- **Quote, then book with `expected_total_cents`,** so a changed price is
  refused rather than charged.
- **Card payments** (`components/CardPayment.js`): `POST /payments`, then
  Stripe's Payment Element with the returned publishable key, client secret
  and connected account, then `POST /payments/{id}/complete`. Card details go
  to Stripe only.
- **Webhooks** (`pages/api/webhooks/verde.js`) verify `Verde-Signature` from
  the **raw** body in constant time, refuse timestamps more than five minutes
  off, and ignore an event id already seen.

## Before you share the link

**Anyone who can open this site can use the club's key through it.** It's a
test site. Use a key for a test club, and turn the key off in Verde when
you're done.

## Files

| File | Role |
|---|---|
| `package.json` | Next 14, React 18, `@stripe/stripe-js` |
| `next.config.js`, `.gitignore`, `.env.example` | setup |
| `styles/globals.css` | the club's look (deliberately not Verde's) |
| `lib/verdeServer.js` | server-side calls with the key |
| `lib/verdeClient.js` | the pages' calls, idempotency keys, money and time formatting |
| `lib/webhookLog.js` | the last 50 deliveries, in memory |
| `components/Layout.js`, `Result.js`, `CardPayment.js` | shared pieces |
| `pages/api/verde/[...path].js` | the pass-through (GET/POST only; path segments checked) |
| `pages/api/webhooks/verde.js`, `recent.js` | the receiver, and the page's feed |
| `pages/*.js` | the ten pages above |

`package.json` can't hold a comment, so it's the one file without its path at
the top.

## Verified

- **`next build` passes:** 10 static pages, 3 API routes.
- **Run against a stand-in Verde:**
  - the pass-through added `Bearer vsk_live_…` and sent **no browser
    `Origin`**;
  - a POST carried its `Idempotency-Key`, and the same key again came back
    **replayed**;
  - a path with `../` was refused (`bad_path`), and `DELETE` was refused.
- **The webhook receiver:**

| Delivery | Result |
|---|---|
| a correctly signed delivery | `200` |
| the **same event id** again | `200 duplicate` |
| a **tampered body** | `401` |
| a **10-minute-old** timestamp | `401` |

  The feed showed all of them, verified or refused.
- **Every page** returned `200`.

## Not verified

- **Against the real API and Stripe:** that's what this site is for. Start
  with `/`: it should show the club's name and which kinds of booking are on.
