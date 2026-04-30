"use server";

import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL?.trim();
  if (!value) throw new Error("SUPABASE_URL tidak di-set.");
  return value;
}

function getSupabaseServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) throw new Error("SUPABASE_SERVICE_ROLE_KEY tidak di-set.");
  return value;
}

function createServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function logAdminAudit(
  adminEmail: string,
  action: "create" | "update" | "delete" | "approve" | "reject",
  entityType: "competition" | "submission",
  entityId: string,
  payloadBefore: unknown = null,
  payloadAfter: unknown = null,
): Promise<void> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("admin_audit_logs").insert({
      admin_email: adminEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      payload_before: payloadBefore,
      payload_after: payloadAfter,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Gagal menyimpan audit log:", error.message);
    }
  } catch (error) {
    console.error("Gagal menyimpan audit log:", error);
  }
}
