# Commit 016: The dining page

A restaurant's reservation flow, on the pattern the other booking pages set.

## `pages/dining.js`
- **A booking bar:**
  - **Where** (The Grill, The Terrace), when the club has more than one dining room;
  - **Guests**, offered only up to the room's largest party;
  - a line with the room's hours and party limit ("The Grill, open 7:00 AM to 9:00 PM. Parties up to 8; larger groups, call the club.").
- **The next two weeks,** then the day with how many times are free for your party.
- **The day's times grouped by Breakfast, Lunch and Dinner** rather than Morning, Afternoon and Evening, so 11:30 is lunch, not "morning". "Few left" and "Full" are marked. The dining room photo no longer repeats beside each room.
- **Choosing a time folds the times** into one line ("6:00 PM · The Grill · 2 guests") with **Change Time**.
- **Your Details:**
  - name, email and phone (a signed-in member books as themselves);
  - **The Occasion** as choices (Birthday, Anniversary, Business, Date Night, Celebration);
  - Requests (window table, high chair, allergies).
- **A room where the club confirms its own tables** says so from the start. The button reads **Request the Table**, and the success page says **Request Received**. Otherwise it's **Reserve the Table** and **Your Table Is Booked**.
- **The summary card, "Your Table",** shows the occasion once chosen, and "No payment needed to reserve".
- **Title Case:** steps Choose a Table → Your Details → Reserved. No dashes used as punctuation.
- **On the club's clock (commit 015):** the day strip starts from today at the club, and times are the club's wall clock, never converted.
- **Everything Verde does is unchanged:** availability, reserve, confirmed or waitlist.

## Shared
- **`components/Picker.js`:** `TimeGroups` takes `compact` (the smaller start tiles) and `meals` (Breakfast, Lunch, Dinner).
- **`DESIGN-ENGINEERING.md`:** a dining section.

## Checked
Built and rendered against a mock of Verde's API (a grill that confirms instantly and a terrace that confirms its own tables, with limited and full times), with the browser set to Mexico City's time zone and Spanish (Mexico), at desktop and phone sizes, including choosing a time.

## Files
- `pages/dining.js`
- `components/Picker.js`
- `DESIGN-ENGINEERING.md`
