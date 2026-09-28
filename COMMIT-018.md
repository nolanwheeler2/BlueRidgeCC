# Commit 018: The private events page

A venue page first, an enquiry second.

## `pages/private-events.js`
- **An opening statement:** a wedding on the eighteenth green, an outing with the whole course, a quiet dinner in the Library, and the events office planning it with you.
- **The Spaces:** The Eighteenth Green, The Ridge Room and The Library, each with **its own photograph** (no photo used twice), a line on what it's like, what it **suits** and how many it **holds**.
- **How It Comes Together,** four numbered steps: Tell Us the Basics, Hear Back From the Events Office, Review a Written Quote, Hold Your Date.
- **Plan Your Event:**
  - **The Occasion** as choices (Wedding, Corporate, Banquet, Celebration, Golf Outing, Meeting, Something Else);
  - **Guests**, with the club's minimum shown and a warning below it when the number is under;
  - **Preferred date** in MM/DD/YYYY, defaulting to six months out. **The earliest date offered is today at the club plus the club's notice period** (30 days at Blue Ridge), so nobody asks for a date the club can't do.
  - Name, email and phone (a signed-in member's are filled in), and **Tell us about it**.
  - **Send Enquiry.**
  - When the club isn't taking enquiries online, the page says so and points to the phone.
- **The Events Office** card beside the form: a line on how it works, **Call** (the club's phone from Verde), **Visit** (its location), and "Enquiries are answered within one business day."
- **After sending:** "Thank You. We'll Be in Touch", repeating the date and headcount.
- **Title Case** for headings and buttons; sentence case for field labels. No dashes as punctuation.

## Also
**`DESIGN-ENGINEERING.md`:** a private events section.

## Checked
Built and rendered against a mock of Verde's API (enquiries open, 20 guests minimum, 30 days' notice) at desktop and phone sizes.

## Files
- `pages/private-events.js`
- `styles/globals.css`
- `DESIGN-ENGINEERING.md`
