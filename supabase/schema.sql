-- ============================================================
-- IBSS Holiday Bookings — database schema
-- Run this in Supabase: SQL Editor → New query → paste → Run
-- ============================================================

-- 1) Bookings table
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  program      text not null default '2026-winter',  -- which holiday program
  child_name   text not null,                          -- the teen's name
  parent_name  text not null,
  phone        text not null,
  email        text not null,
  days         text[] not null,          -- e.g. {'thu1','tue2'}
  day_titles   text[] not null,          -- human-readable, e.g. {'Movie World','Sea World'}
  day_details  jsonb,                    -- per-day: pickup time, dropoff time, note
  pickup_time  text,                     -- preferred pickup (overall), optional
  dropoff_time text,                     -- preferred drop-off (overall), optional
  token        uuid not null default gen_random_uuid(),  -- magic-link token
  status       text not null default 'pending'           -- pending | confirmed | cancelled
);

-- Index for filtering bookings by program in the admin view
create index if not exists bookings_program_idx on public.bookings (program);

-- Helpful index for looking up by token
create index if not exists bookings_token_idx on public.bookings (token);

-- 2) Row Level Security
alter table public.bookings enable row level security;

-- IMPORTANT: with RLS enabled and NO select/update/delete policy for the
-- anon role, the public site cannot read or change anyone's bookings.
-- All writes go through the Edge Function using the service role (which
-- bypasses RLS), so we do NOT grant the anon key direct insert either.
-- This is the most locked-down setup: the public key can do nothing on
-- this table directly. Everything is mediated by the Edge Function.

-- (No anon policies are created on purpose.)

-- 3) Magic-link lookup: returns ONLY the booking matching the token.
-- SECURITY DEFINER lets it read past RLS, but it is scoped to a single
-- token, so a visitor can only ever retrieve their own booking.
create or replace function public.get_my_booking(token uuid)
returns table (
  child_name text,
  parent_name text,
  phone text,
  email text,
  days text[],
  day_details jsonb,
  pickup_time text,
  dropoff_time text
)
language sql
security definer
set search_path = public
as $$
  select b.child_name, b.parent_name, b.phone, b.email, b.days,
         b.day_details, b.pickup_time, b.dropoff_time
  from public.bookings b
  where b.token = get_my_booking.token
  limit 1;
$$;

-- Allow the public (anon) role to call ONLY this function
grant execute on function public.get_my_booking(uuid) to anon;

-- ============================================================
-- Done. The Edge Function (new-booking) handles inserts + SMS.
-- ============================================================
