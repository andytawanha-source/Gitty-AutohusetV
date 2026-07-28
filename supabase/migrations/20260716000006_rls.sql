-- ============================================================
-- 0006: Row Level Security – tenant-isolation og rollebaseret adgang
--
-- Principper:
--  * anon        = offentlige besøgende (ingen login). Kan kun læse offentligt indhold
--                  og oprette bilforespørgsler. Leads oprettes KUN via Edge Function (service role).
--  * authenticated = personale. Selvregistrering skal være slået FRA i Supabase Auth
--                  (kun invitationer) – dokumenteret i README.
--  * Al adgang er bundet til organization_id via security definer-funktionerne
--    user_org_ids(), is_org_member(), is_org_admin(), has_role().
-- ============================================================

-- ---------- Organisationer og brugere ----------
alter table public.organizations enable row level security;
create policy org_select on public.organizations for select
  using (public.is_org_member(id));

alter table public.brands enable row level security;
create policy brands_public_select on public.brands for select using (true);
create policy brands_admin_update on public.brands for update
  using (public.is_org_admin(organization_id));

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.organization_members m1
      join public.organization_members m2 on m1.organization_id = m2.organization_id
      where m1.profile_id = auth.uid() and m2.profile_id = profiles.id
    )
  );
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid());

alter table public.organization_members enable row level security;
create policy org_members_select on public.organization_members for select
  using (public.is_org_member(organization_id));
create policy org_members_admin_write on public.organization_members for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.user_roles enable row level security;
create policy user_roles_select on public.user_roles for select
  using (public.is_org_member(organization_id));
create policy user_roles_admin_write on public.user_roles for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ---------- Biler ----------
alter table public.vehicles enable row level security;

-- Offentligt: kun publicerede/reserverede/solgte biler, aldrig kladder eller slettede
create policy vehicles_public_select on public.vehicles for select
  using (status in ('published', 'reserved', 'sold') and deleted_at is null);

-- Personale: alle egne organisationers biler
create policy vehicles_member_select on public.vehicles for select
  using (public.is_org_member(organization_id));

create policy vehicles_editor_insert on public.vehicles for insert
  with check (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor')
  );
create policy vehicles_editor_update on public.vehicles for update
  using (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor')
  );
create policy vehicles_admin_delete on public.vehicles for delete
  using (public.is_org_admin(organization_id));

-- Kolonnebeskyttelse: anonyme besøgende kan ALDRIG læse vin/internal_notes.
revoke select on public.vehicles from anon;
grant select (
  id, organization_id, make, model, variant, model_year, first_registration,
  mileage_km, price_dkk, monthly_price_dkk, fuel_type, transmission, body_type,
  color, doors, seats, power_hp, engine, battery_kwh, range_km, consumption,
  tax_period_dkk, registration_number, show_registration_number, description,
  equipment, badges, is_featured, seo_title, seo_description, slug, status,
  publish_at, sold_at, created_at, updated_at, deleted_at
) on public.vehicles to anon;

alter table public.vehicle_images enable row level security;
create policy vehicle_images_public_select on public.vehicle_images for select
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and v.status in ('published', 'reserved', 'sold')
        and v.deleted_at is null
    )
    or public.is_org_member(organization_id)
  );
create policy vehicle_images_editor_write on public.vehicle_images for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.vehicle_status_history enable row level security;
create policy vehicle_status_history_select on public.vehicle_status_history for select
  using (public.is_org_member(organization_id));

alter table public.vehicle_views enable row level security;
create policy vehicle_views_select on public.vehicle_views for select
  using (public.is_org_member(organization_id));
-- Skrivning sker udelukkende via increment_vehicle_view() (security definer)

alter table public.vehicle_inquiries enable row level security;
-- Offentlig formular må oprette forespørgsler (rate limiting + honeypot håndhæves i Edge Function/klient)
create policy vehicle_inquiries_public_insert on public.vehicle_inquiries for insert
  with check (status = 'new' and handled_by is null);
create policy vehicle_inquiries_member_select on public.vehicle_inquiries for select
  using (public.is_org_member(organization_id));
create policy vehicle_inquiries_member_update on public.vehicle_inquiries for update
  using (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'lead_agent')
  );

alter table public.favorites enable row level security;
-- Anonyme favoritter håndteres klient-side; tabellen er kun for indloggede
create policy favorites_own on public.favorites for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------- Leads: KUN personale. Oprettelse sker via Edge Function (service role). ----------
alter table public.leads enable row level security;
create policy leads_member_select on public.leads for select
  using (public.is_org_member(organization_id));
create policy leads_agent_update on public.leads for update
  using (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'lead_agent')
  );
create policy leads_admin_delete on public.leads for delete
  using (public.is_org_admin(organization_id));

alter table public.lead_contacts enable row level security;
create policy lead_contacts_member_select on public.lead_contacts for select
  using (public.is_org_member(organization_id));

alter table public.lead_vehicle_snapshots enable row level security;
create policy lead_snapshots_member_select on public.lead_vehicle_snapshots for select
  using (public.is_org_member(organization_id));

alter table public.lead_condition_answers enable row level security;
create policy lead_condition_member_select on public.lead_condition_answers for select
  using (public.is_org_member(organization_id));

alter table public.lead_images enable row level security;
create policy lead_images_member_select on public.lead_images for select
  using (public.is_org_member(organization_id));

alter table public.lead_notes enable row level security;
create policy lead_notes_member_select on public.lead_notes for select
  using (public.is_org_member(organization_id));
create policy lead_notes_member_insert on public.lead_notes for insert
  with check (public.is_org_member(organization_id) and author_id = auth.uid());

alter table public.lead_assignments enable row level security;
create policy lead_assignments_member_select on public.lead_assignments for select
  using (public.is_org_member(organization_id));
create policy lead_assignments_agent_insert on public.lead_assignments for insert
  with check (
    public.is_org_admin(organization_id) or public.has_role(organization_id, 'lead_agent')
  );

alter table public.lead_status_history enable row level security;
create policy lead_status_history_member_select on public.lead_status_history for select
  using (public.is_org_member(organization_id));

alter table public.lead_consents enable row level security;
create policy lead_consents_member_select on public.lead_consents for select
  using (public.is_org_member(organization_id));

alter table public.lead_attribution enable row level security;
create policy lead_attribution_member_select on public.lead_attribution for select
  using (public.is_org_member(organization_id));

alter table public.lead_events enable row level security;
create policy lead_events_member_select on public.lead_events for select
  using (public.is_org_member(organization_id));

alter table public.retention_policies enable row level security;
create policy retention_admin_all on public.retention_policies for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ---------- Integrationer og logs ----------
alter table public.vehicle_lookup_logs enable row level security;
create policy lookup_logs_admin_select on public.vehicle_lookup_logs for select
  using (organization_id is not null and public.is_org_admin(organization_id));

alter table public.integration_settings enable row level security;
create policy integration_settings_member_select on public.integration_settings for select
  using (public.is_org_member(organization_id));
create policy integration_settings_admin_write on public.integration_settings for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.email_logs enable row level security;
create policy email_logs_admin_select on public.email_logs for select
  using (organization_id is not null and public.is_org_admin(organization_id));

alter table public.webhook_logs enable row level security;
create policy webhook_logs_admin_select on public.webhook_logs for select
  using (organization_id is not null and public.is_org_admin(organization_id));

alter table public.audit_log enable row level security;
create policy audit_log_admin_select on public.audit_log for select
  using (organization_id is not null and public.is_org_admin(organization_id));
create policy audit_log_member_insert on public.audit_log for insert
  with check (public.is_org_member(organization_id) and actor_id = auth.uid());

-- ---------- CMS og konfiguration ----------
alter table public.site_settings enable row level security;
create policy site_settings_public_select on public.site_settings for select using (true);
create policy site_settings_admin_write on public.site_settings for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.navigation_items enable row level security;
create policy navigation_public_select on public.navigation_items for select
  using (is_visible or public.is_org_member(organization_id));
create policy navigation_editor_write on public.navigation_items for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.content_sections enable row level security;
create policy content_public_select on public.content_sections for select
  using (is_visible or public.is_org_member(organization_id));
create policy content_editor_write on public.content_sections for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.legal_documents enable row level security;
create policy legal_public_select on public.legal_documents for select using (true);
create policy legal_admin_write on public.legal_documents for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

alter table public.faq_items enable row level security;
create policy faq_public_select on public.faq_items for select
  using (is_visible or public.is_org_member(organization_id));
create policy faq_editor_write on public.faq_items for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.testimonials enable row level security;
create policy testimonials_public_select on public.testimonials for select
  using (is_visible or public.is_org_member(organization_id));
create policy testimonials_editor_write on public.testimonials for all
  using (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'))
  with check (public.is_org_admin(organization_id) or public.has_role(organization_id, 'editor'));

alter table public.opening_hours enable row level security;
create policy opening_hours_public_select on public.opening_hours for select using (true);
create policy opening_hours_admin_write on public.opening_hours for all
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));
