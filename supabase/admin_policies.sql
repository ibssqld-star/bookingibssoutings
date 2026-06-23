-- ============================================================
-- IBSS Holiday Bookings — ADMIN access policies
-- Run this AFTER schema.sql, in Supabase SQL Editor.
-- ============================================================

-- Authenticated users (you, logged in) can read every booking.
create policy "admin can read bookings"
  on public.bookings
  for select
  to authenticated
  using (true);

-- Authenticated users can update status (confirm / cancel) and details.
create policy "admin can update bookings"
  on public.bookings
  for update
  to authenticated
  using (true)
  with check (true);

-- Authenticated users can delete a booking if needed.
create policy "admin can delete bookings"
  on public.bookings
  for delete
  to authenticated
  using (true);

-- NOTE: the anon (public) role still has NO policies, so the public
-- flyer cannot read, update, or delete anything. Only a logged-in
-- admin can. Create your admin login in Supabase:
--   Authentication → Users → Add user → enter your email + a password.
-- Use those credentials to sign in on admin.html.
-- ============================================================
