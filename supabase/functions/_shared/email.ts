// Provider-uafhængig e-mailadapter (mock | resend | postmark).
// Fejl her må ALDRIG vælte kaldskæden – leadet er allerede gemt (spec pkt. 16/25).
// deno-lint-ignore-file no-explicit-any

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  status: "sent" | "failed" | "queued";
  provider: string;
  providerMessageId?: string;
  error?: string;
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = Deno.env.get("EMAIL_PROVIDER") ?? "mock";
  const apiKey = Deno.env.get("EMAIL_API_KEY") ?? "";
  const from = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "noreply@example.invalid";

  try {
    switch (provider) {
      case "resend": {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: message.to, subject: message.subject, html: message.html }),
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) return { status: "failed", provider, error: data?.message ?? `HTTP ${res.status}` };
        return { status: "sent", provider, providerMessageId: data?.id };
      }
      case "postmark": {
        const res = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: { "X-Postmark-Server-Token": apiKey, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ From: from, To: message.to, Subject: message.subject, HtmlBody: message.html }),
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) return { status: "failed", provider, error: data?.Message ?? `HTTP ${res.status}` };
        return { status: "sent", provider, providerMessageId: data?.MessageID };
      }
      case "mock":
      default:
        console.info(`[MOCK EMAIL] til=${message.to} emne="${message.subject}"`);
        return { status: "sent", provider: "mock", providerMessageId: `mock-${crypto.randomUUID()}` };
    }
  } catch (err) {
    return { status: "failed", provider, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Logger e-mailafsendelse i email_logs – fejl i logning ignoreres bevidst. */
export async function logEmail(
  supabase: any,
  params: {
    organizationId: string | null;
    leadId?: string | null;
    inquiryId?: string | null;
    template: string;
    to: string;
    result: EmailResult;
  }
): Promise<void> {
  try {
    await supabase.from("email_logs").insert({
      organization_id: params.organizationId,
      lead_id: params.leadId ?? null,
      inquiry_id: params.inquiryId ?? null,
      template: params.template,
      to_address: params.to,
      status: params.result.status,
      provider: params.result.provider,
      provider_message_id: params.result.providerMessageId ?? null,
      error: params.result.error ?? null,
      attempts: 1,
    });
  } catch (err) {
    console.error("email_logs insert fejlede:", err);
  }
}
