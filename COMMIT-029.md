# Commit 029: Tee times load faster

With Verde commit 527 (the Booking API answering faster), the site now does less waiting of its own:
- **The club is fetched once per visit.** The tee times page and the home page each fetched `/club` a second time, and **the tee times couldn't load until that second request came back.** Both now read the club the site already has (`useClub()`).
- **The club is remembered for the visit** (`components/Club.js`): a refresh or a new page draws it from memory at once, then checks Verde quietly for anything new.
- **Each day's tee times are remembered briefly, and the next day is fetched ahead** (`lib/verdeClient.js`, `pages/tee-times.js`): moving to the next day is instant, and going back to a day you've seen shows it at once while it refreshes. After a booking the remembered lists are forgotten, so the time just booked never shows as open.

## Checked
Built, and loaded against the mock:
- `/club` is requested **once** (it was twice);
- the next day is fetched ahead;
- no errors from the site's own code. The only failures were the course photos, Google Fonts and Stripe's script, which the test sandbox can't reach.

## Docs
**`DESIGN-ENGINEERING.md`:** §19, loading fast.

## Files
- `components/Club.js`
- `lib/verdeClient.js`
- `pages/tee-times.js`
- `pages/index.js`
- `DESIGN-ENGINEERING.md`
