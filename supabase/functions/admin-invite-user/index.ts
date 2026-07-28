// Edge Function: admin-invite-user
// Inviterer en ny bruger til en organisation: opretter (eller genbruger) en
// Supabase Auth-bruger via auth.admin.inviteUserByEmail, tilføjer dem til
// organization_members og tildeler de valgte roller i user_roles.
//
// I modsætning til submit-lead/plate-lookup (som er offentligt tilgængelige
// fra hjemmesidens formularer) SKAL denne funktion kaldes af en allerede
// logget ind bruger, og den kaldende bruger skal selv være org-admin
// (superadmin/dealer_admin) for organisationen, de forsøger at invitere til.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const ROLES = ["superadmin", "dealer_admin", "editor", "lead_agent", "sales_agent", "rental_agent"] as const;

const payloadSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  roles: z.array(z.enum(ROLES)).min(1),
});

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(await req.json());
  } catch {
    return jsonResponse({ error: "Ugyldige data" }, 400);
  }

  // 1) Verificér den kaldende bruger via deres eget access token
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  );
  const { data: callerData, error: callerError } = await userClient.auth.getUser();
  if (callerError || !callerData.user) {
    return jsonResponse({ error: "Ikke logget ind" }, 401);
  }

  const admin = adminClient();

  // 2) Bekræft at den kaldende bruger er org-admin for den angivne organisation
  const { data: callerRoles, error: callerRolesError } = await admin
    .from("user_roles")
    .select("role")
    .eq("organization_id", payload.organizationId)
    .eq("profile_id", callerData.user.id);
  if (callerRolesError) {
    console.error("Kunne ikke slå kaldende brugers roller op:", callerRolesError);
    return jsonResponse({ error: "Noget gik galt" }, 500);
  }
  const isCallerAdmin = (callerRoles ?? []).some((r) => r.role === "superadmin" || r.role === "dealer_admin");
  if (!isCallerAdmin) {
    return jsonResponse({ error: "Du har ikke rettigheder til at invitere brugere til denne organisation" }, 403);
  }

  // 3) Find eller opret Auth-brugeren
  let profileId: string;
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, /* @ts-ignore: understøttet af GoTrue selvom typen mangler den */ email: payload.email });
  const existingUser = (existing?.users ?? []).find((u: any) => u.email?.toLowerCase() === payload.email.toLowerCase());

  if (existingUser) {
    profileId = existingUser.id;
  } else {
    const redirectTo = Deno.env.get("ADMIN_URL") ? `${Deno.env.get("ADMIN_URL")}/admin/login` : undefined;
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(payload.email, {
      data: { full_name: payload.fullName },
      redirectTo,
    });
    if (inviteError || !invited.user) {
      console.error("Invitation fejlede:", inviteError);
      return jsonResponse({ error: inviteError?.message ?? "Kunne ikke invitere brugeren" }, 500);
    }
    profileId = invited.user.id;
  }

  // 4) profiles-række (idempotent)
  await admin.from("profiles").upsert({ id: profileId, full_name: payload.fullName }, { onConflict: "id" });

  // 5) organization_members (idempotent)
  const { error: memberError } = await admin
    .from("organization_members")
    .upsert({ organization_id: payload.organizationId, profile_id: profileId }, { onConflict: "organization_id,profile_id" });
  if (memberError) {
    console.error("Kunne ikke tilføje medlemskab:", memberError);
    return jsonResponse({ error: "Kunne ikke tilføje brugeren til organisationen" }, 500);
  }

  // 6) user_roles: erstat med de valgte roller
  await admin.from("user_roles").delete().eq("organization_id", payload.organizationId).eq("profile_id", profileId);
  const { error: rolesError } = await admin
    .from("user_roles")
    .insert(payload.roles.map((role) => ({ organization_id: payload.organizationId, profile_id: profileId, role })));
  if (rolesError) {
    console.error("Kunne ikke tildele roller:", rolesError);
    return jsonResponse({ error: "Brugeren blev inviteret, men rollerne kunne ikke tildeles" }, 500);
  }

  // 7) Audit-log (fejler aldrig hele kaldet)
  await admin.from("audit_log").insert({
    organization_id: payload.organizationId,
    actor_id: callerData.user.id,
    action: "user.invited",
    entity_type: "profile",
    entity_id: profileId,
    details: { email: payload.email, roles: payload.roles },
  });

  return jsonResponse({ profileId, reused: !!existingUser });
});
