import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AuditAction =
  | "role_change"
  | "payment_access"
  | "profile_edit"
  | "coach_status_change"
  | "booking_change"
  | "verification_change"
  | "account_delete"
  | "admin_action"
  | "login"
  | "password_reset";

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: AuditAction;
  target_table: string | null;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  // Enriched
  user_email?: string;
  user_name?: string;
}

interface UseAuditLogOptions {
  action?: AuditAction;
  userId?: string;
  limit?: number;
}

export function useAuditLog(options: UseAuditLogOptions = {}) {
  const { role } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthorized = role === "admin" || role === "developer";

  const fetchLogs = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      setError("Unauthorized: admin or developer role required");
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options.limit ?? 100);

    if (options.action) {
      query = query.eq("action", options.action);
    }
    if (options.userId) {
      query = query.eq("user_id", options.userId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("Failed to fetch audit logs:", fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Enrich with user profiles
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((e) => e.user_id).filter(Boolean))] as string[];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", userIds);

        const profileMap = new Map(
          (profiles ?? []).map((p) => [p.id, p])
        );

        const enriched = data.map((entry) => ({
          ...entry,
          metadata: (entry.metadata ?? {}) as Record<string, unknown>,
          old_value: entry.old_value as Record<string, unknown> | null,
          new_value: entry.new_value as Record<string, unknown> | null,
          user_name: entry.user_id
            ? profileMap.get(entry.user_id)?.full_name ?? profileMap.get(entry.user_id)?.username ?? "Unknown"
            : "System",
        }));

        setEntries(enriched);
      } else {
        setEntries(data.map((entry) => ({
          ...entry,
          metadata: (entry.metadata ?? {}) as Record<string, unknown>,
          old_value: entry.old_value as Record<string, unknown> | null,
          new_value: entry.new_value as Record<string, unknown> | null,
          user_name: "System",
        })));
      }
    } else {
      setEntries([]);
    }

    setLoading(false);
  }, [isAuthorized, options.action, options.userId, options.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { entries, loading, error, refresh: fetchLogs, isAuthorized };
}

/** Log a client-side audit event (e.g., payment access) */
export async function logAuditEvent(
  action: AuditAction,
  targetTable?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.rpc("write_audit_log", {
    _user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    _action: action,
    _target_table: targetTable ?? null,
    _target_id: targetId ?? null,
    _old_value: null,
    _new_value: null,
    _metadata: metadata ?? {},
  });

  if (error) {
    console.error("Failed to write audit log:", error);
  }
}
