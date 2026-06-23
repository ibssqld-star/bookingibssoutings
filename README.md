# IBSS Holiday Programs — Booking Site

A public website where parents browse holiday activities, tap days to see details,
pick everything they want, and book in one go. Each booking saves to a database,
texts you (Ninja) via ClickSend, and texts the parent a magic link so they can
reopen and change their booking later — no account needed. You manage everything
from a private admin dashboard.

---

## The files

```
index.html                          ← HUB: lists all terms/holiday programs
admin.html                          ← YOUR private dashboard (view/manage bookings)
programs/
  2026-winter/index.html            ← the Winter program (the booking page)
  HOW_TO_ADD_A_PROGRAM.md           ← guide for adding future programs
supabase/
  schema.sql                        ← run once: creates the bookings table
  admin_policies.sql                ← run once: lets you (admin) manage bookings
  functions/new-booking/index.ts    ← the function that saves bookings + sends SMS
README.md                           ← this file
```

You can deploy JUST the website (hub + program page) and it works as a beautiful
read-only flyer immediately. The booking/SMS features switch on once you do the
Supabase + ClickSend setup below.

---

## OPTION A — Just want the flyer online fast? (5 minutes, no backend)

1. Go to **app.netlify.com/drop**
2. Drag the whole `ibss-bookings` folder onto the page
3. You get a live link instantly (e.g. `your-site.netlify.app`)

The site looks perfect and people can browse it. The "Submit booking" button
won't save anything yet — that needs Option B. Good for sharing the program
while you set up the rest.

---

## OPTION B — Full booking system (the works)

You'll need: a free Supabase account, your ClickSend login, and about 30 minutes.

### Step 1 — Create the Supabase project
- Go to **supabase.com** → New project.
- Choose the **Southeast Asia (Singapore)** region (closest to Australia — Supabase has no Sydney region).
- When it's ready: Project Settings → API. Copy two things:
  - **Project URL** (like `https://abcd1234.supabase.co`)
  - **anon public** key (a long string)

### Step 2 — Create the bookings table
- In Supabase, open **SQL Editor → New query**.
- Paste the entire contents of `supabase/schema.sql` and click **Run**.
- Then do the same with `supabase/admin_policies.sql` (paste → Run).

### Step 3 — Create your admin login
- Supabase → **Authentication → Users → Add user**.
- Enter your email and a password, and confirm the user.
- These are the details you'll log into `admin.html` with.

### Step 4 — Deploy the booking function (handles saving + SMS)
Install the Supabase CLI if you don't have it (`npm i -g supabase`), then in a
terminal inside this folder:
```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy new-booking --no-verify-jwt
```
(Your project-ref is the bit before `.supabase.co` in your URL.)

### Step 5 — Add your secrets (ClickSend + your phone)
```bash
supabase secrets set \
  CLICKSEND_USERNAME="your-clicksend-username" \
  CLICKSEND_API_KEY="your-clicksend-api-key" \
  NOTIFY_PHONE="+61412345678" \
  FROM_SMS="IBSS" \
  SITE_URL="https://your-deployed-site-url"
```
- `NOTIFY_PHONE` = your mobile in +61 format. This is who gets texted on each booking.
- `FROM_SMS` = the sender name parents see (up to 11 letters), optional.
- `SITE_URL` = where you deploy the site (Step 7). Used to build the magic link.

> Your ClickSend key lives ONLY here as a secret — never in the website files.
> If it were in the page, anyone could read it and send texts on your account.

### Step 6 — Put your keys into the website
Open **two files** and paste in the same two values from Step 1:
- `programs/2026-winter/index.html`
- `admin.html`

In each, find the CONFIG block near the bottom and fill in:
```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
```

### Step 7 — Deploy the site
Drag the `ibss-bookings` folder to **app.netlify.com/drop** (or deploy with
Vercel, or host it on your IBSS site at e.g. `ibssqld.com.au/holidays`).

After deploying, make sure `SITE_URL` from Step 5 matches the final URL,
otherwise magic links point to the wrong place. Re-run the `secrets set` if it changed.

---

## How it all works

- **Browse:** parents open the hub, pick the Winter program.
- **Explore:** tap any day → popup with description, time and place.
- **Select:** add the days they want; a tray tracks the selection.
- **Book once:** one form (teen's name, parent name, mobile, email) covers all
  selected days. They can add optional pickup/drop-off times and notes per day.
- **You get a text** listing the teen and the days booked.
- **Parent gets a text** confirming, with a magic link to reopen/change later.
- **You manage** everything in `admin.html`: filter by program, search by name/
  email/phone, and Confirm or Cancel each booking.

## Security (why it's set up this way)
- The public website can only SUBMIT bookings (through the function). It cannot
  read, edit, or delete anything — so nobody can scrape families' details.
- The admin dashboard requires your Supabase login.
- The ClickSend key is a server-side secret, never in the public page.

## Good to know
- **SMS cost:** each booking sends up to 2 texts (you + parent), a few cents each
  on ClickSend. Fine for a holiday program.
- **Two venues still TBC:** Shop & Cook and Sushi Making say "(venue TBC)" — edit
  those lines in `programs/2026-winter/index.html` once the kitchens are booked.
- **Adding next term's program:** see `programs/HOW_TO_ADD_A_PROGRAM.md`.
- **Photos:** all ten activity photos are embedded directly in the page, so the
  site is fully self-contained and works offline / when printed.
