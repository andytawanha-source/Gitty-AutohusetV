-- ============================================================
-- 0011: Offentlig læseadgang til rental_details
--
-- rental_details fik i 0009-migrationen kun en "member select"-policy (kun
-- organisationens eget personale kan læse). Det betyder, at prisfelterne
-- (price_per_day_dkk mv.) aldrig blev vist for anonyme besøgende på
-- "Biludlejning"-siden – samme mønster som vehicles_public_select for vehicles.
-- ============================================================

create policy rental_details_public_select on public.rental_details for select
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = rental_details.vehicle_id
        and v.status in ('published', 'reserved')
        and v.deleted_at is null
    )
  );
