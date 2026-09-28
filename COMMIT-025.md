# Commit 025: The webhooks page, working again

## Why
`/webhooks` (for developers; not linked from the public site) was **blank** from commit 008 on. It drew deliveries with the old inline JSON boxes (`.devbox`), which commit 008 hid site-wide when the developer console replaced them.

## Rebuilt (`pages/webhooks.js`)
- **Set Up,** as three numbered steps:
  1. **Add This Address in Verde,** with the webhook address and a **Copy** button;
  2. **Save the Signing Secret** (`VERDE_WEBHOOK_SECRET`);
  3. **Send a Test.**
- **Deliveries** in the developer console's style, the same feed as its Webhooks tab and refreshed every 5 seconds:
  - a count ("3 events · 2 verified");
  - each delivery's type, **when it arrived in the club's time**, and **Signature verified** or **Signature refused**;
  - click one to open its event as highlighted JSON, with the newest open to start.
- `components/DevConsole.js` now shares its JSON highlighter (`Json`) with this page.

## Also
- **`DESIGN-ENGINEERING.md`:** a section on the webhooks page.
- Nothing on the site uses `.devbox` any more.

## Checked
Built and rendered with three sample deliveries (two verified, one refused), with the browser set to Mexico City's time zone. Times show in the club's time.

## Files
- `pages/webhooks.js`
- `components/DevConsole.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
