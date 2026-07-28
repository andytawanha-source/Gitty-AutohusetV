-- ============================================================
-- 0007: Storage-buckets og -politikker
--  * vehicle-images: offentlig læsning, kun personale skriver
--  * brand-assets:   offentlig læsning (logoer), kun admin skriver
--  * lead-images:    PRIVAT – kun personale læser (via signerede URL'er),
--                    upload sker via Edge Function (service role)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vehicle-images', 'vehicle-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif']),
  ('brand-assets', 'brand-assets', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('lead-images', 'lead-images', false, 10485760, array['image/jpeg','image/png','image/webp','image/avif','image/heic'])
on conflict (id) do nothing;

-- Objektstien SKAL starte med organization_id: "<org_id>/<...>/fil.jpg"
-- så politikkerne kan håndhæve tenant-isolation på filniveau.

create policy "vehicle images public read" on storage.objects for select
  using (bucket_id = 'vehicle-images');

create policy "vehicle images staff write" on storage.objects for insert
  with check (
    bucket_id = 'vehicle-images'
    and (
      public.is_org_admin(((storage.foldername(name))[1])::uuid)
      or public.has_role(((storage.foldername(name))[1])::uuid, 'editor')
    )
  );

create policy "vehicle images staff update" on storage.objects for update
  using (
    bucket_id = 'vehicle-images'
    and (
      public.is_org_admin(((storage.foldername(name))[1])::uuid)
      or public.has_role(((storage.foldername(name))[1])::uuid, 'editor')
    )
  );

create policy "vehicle images staff delete" on storage.objects for delete
  using (
    bucket_id = 'vehicle-images'
    and (
      public.is_org_admin(((storage.foldername(name))[1])::uuid)
      or public.has_role(((storage.foldername(name))[1])::uuid, 'editor')
    )
  );

create policy "brand assets public read" on storage.objects for select
  using (bucket_id = 'brand-assets');

create policy "brand assets admin write" on storage.objects for all
  using (
    bucket_id = 'brand-assets'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'brand-assets'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );

-- Leadbilleder: INGEN offentlig adgang. Kun medlemmer af den ejende organisation
-- kan læse (adminpanelet genererer signerede URL'er). Upload sker via Edge Function.
create policy "lead images staff read" on storage.objects for select
  using (
    bucket_id = 'lead-images'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "lead images staff delete" on storage.objects for delete
  using (
    bucket_id = 'lead-images'
    and public.is_org_admin(((storage.foldername(name))[1])::uuid)
  );
