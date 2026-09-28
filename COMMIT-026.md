# Commit 026: Stay and Play asks for a sign-in up front, and info notices fixed

Needs **Verde commit 508**.

## Stay and Play (`pages/packages.js`)
When the club requires an account to book a package (Verde's `GET /packages` → `booking.account_required`), a visitor who isn't signed in sees:
- a note at the top, "This club asks you to sign in to book.", with **Sign In**;
- **Sign In to Book** on every package, in place of Choose Package.

A signed-in member books as usual. Before, a guest could pick a package, dates and tee times and only be refused at payment.

## Every info notice, fixed (`styles/globals.css`)
The info-grid's item style (`.info`) also matched every **`.notice.info`** on the site, stripping its padding and its left rule. It had been that way since the redesign (commit 008). It's now scoped to the grid (`.info-grid .info`), so info notices (release lines, sign-in prompts, cancellation results) are drawn properly again.

## Checked
Built and rendered against a mock requiring an account. The notice's padding and rule measured back to 14px 16px and a 2px left rule.

## Files
- `pages/packages.js`
- `styles/globals.css`
