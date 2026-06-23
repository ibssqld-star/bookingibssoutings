# Adding a new holiday program

The site is organised as a hub (`/index.html`) that links to one folder per
holiday program under `/programs/`.

## Folder naming
Use `YEAR-season`, e.g.:
- `programs/2026-winter/`   ← live now
- `programs/2026-spring/`   ← add next
- `programs/2026-summer/`
- `programs/2027-autumn/`

## To add a program (e.g. Spring 2026)
1. **Copy the winter folder** as a starting point:
   `cp -r programs/2026-winter programs/2026-spring`
2. **Edit `programs/2026-spring/index.html`:**
   - Change the dates, day titles, descriptions, times and locations in the
     day tiles.
   - Update the hero heading and intro text.
   - Swap the embedded photos for the new activities (send them to Claude, or
     replace the `data:image...` strings / use real image files).
3. **Bookings:** the booking form already writes a `program` you can set.
   Add a hidden program id so the admin page can filter by program (see below).
4. **Flip the hub card to live:** in `/index.html`, find the matching season
   card, change `class="card soon"` to `class="card live"`, swap the
   `pill-soon`/"Coming soon" to `pill-live`/"Open now", set the real dates and
   description, and point `href` to the new folder.

## Tip: tag bookings by program
In each program's `index.html`, in the submit payload, add a program field:
```js
body:JSON.stringify({ program:"2026-winter", child_name:kid, ... })
```
Add a matching `program text` column to the `bookings` table, then the admin
page can filter bookings per program. (Ask Claude to wire this up when you add
the second program.)
