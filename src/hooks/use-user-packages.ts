import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  coach_id: string;
  sessions_total: number;
  sessions_used: number;
  purchased_at: string;
  expires_at: string;
  status: "active" | "expired" | "exhausted";
  // Joined from coach_packages
  package_name?: string;
  package_description?: string | null;
}

export function useUserPackages(coachId: string | undefined) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user?.id || !coachId) {
      setPackages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("user_packages")
      .select("*, coach_packages(name, description)")
      .eq("user_id", user.id)
      .eq("coach_id", coachId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching user packages:", error);
      setPackages([]);
    } else {
      const mapped = (data || []).map((row: Record<string, unknown>) => {
        const cp = row.coach_packages as Record<string, unknown> | null;
        return {
          id: row.id as string,
          user_id: row.user_id as string,
          package_id: row.package_id as string,
          coach_id: row.coach_id as string,
          sessions_total: row.sessions_total as number,
          sessions_used: row.sessions_used as number,
          purchased_at: row.purchased_at as string,
          expires_at: row.expires_at as string,
          status: row.status as "active" | "expired" | "exhausted",
          package_name: cp?.name as string | undefined,
          package_description: cp?.description as string | null | undefined,
        };
      });
      setPackages(mapped.filter((p) => p.sessions_used < p.sessions_total));
    }
    setLoading(false);
  }, [user?.id, coachId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const purchasePackage = async (
    packageId: string,
    coachId: string,
    sessionCount: number,
    validityDays: number
  ): Promise<UserPackage | null> => {
    if (!user?.id) return null;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const { data, error } = await supabase
      .from("user_packages")
      .insert({
        user_id: user.id,
        package_id: packageId,
        coach_id: coachId,
        sessions_total: sessionCount,
        sessions_used: 0,
        expires_at: expiresAt.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error purchasing package:", error);
      return null;
    }

    await fetch();
    return data as unknown as UserPackage;
  };

  const useSession = async (userPackageId: string): Promise<boolean> => {
    const pkg = packages.find((p) => p.id === userPackageId);
    if (!pkg) return false;

    const newUsed = pkg.sessions_used + 1;
    const newStatus = newUsed >= pkg.sessions_total ? "exhausted" : "active";

    const { error } = await supabase
      .from("user_packages")
      .update({ sessions_used: newUsed, status: newStatus })
      .eq("id", userPackageId);

    if (error) {
      console.error("Error using package session:", error);
      return false;
    }

    await fetch();
    return true;
  };

  return { packages, loading, refresh: fetch, purchasePackage, useSession };
}
