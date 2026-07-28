-- ============================================================
-- 0001: Extensions, enums og hjælpefunktioner
-- ============================================================

create extension if not exists "pgcrypto";

-- Enums
create type public.app_role as enum ('superadmin', 'dealer_admin', 'editor', 'lead_agent');

create type public.vehicle_status as enum ('draft', 'scheduled', 'published', 'reserved', 'sold', 'archived');

create type public.fuel_type as enum ('benzin', 'diesel', 'el', 'hybrid', 'plugin_hybrid', 'andet');

create type public.transmission_type as enum ('manuel', 'automatisk');

create type public.lead_status as enum (
  'new', 'in_progress', 'contact_attempted', 'contacted', 'awaiting_info',
  'assessed', 'offer_sent', 'accepted', 'rejected', 'won', 'lost', 'archived'
);

create type public.inquiry_type as enum ('contact', 'test_drive', 'finance', 'trade_in');

create type public.consent_type as enum ('processing', 'marketing');

create type public.email_status as enum ('queued', 'sent', 'failed');

-- Automatisk updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
