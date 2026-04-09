import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CoachPackage {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  session_count: number;
  validity_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CoachPackageInput = Pick<
  CoachPackage,
  "name" | "price" | "session_count" | "validity_days"
> & {
  description?: string | null;
  currency?: string;
};

export function useCoachPackages(coachId: string | undefined) {
  const { data: packages = [], isLoading, refetch } = useQuery({
    queryKey: ["coach-packages", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("coach_packages")
        .select("*")
        .eq("coach_id", coachId)
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      return (data || []) as CoachPackage[];
    },
    enabled: !!coachId,
  });

  return { packages, loading: isLoading, refresh: refetch };
}

export function useManageCoachPackages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["coach-packages", user?.id] });
  };

  const createPackage = useMutation({
    mutationFn: async (input: CoachPackageInput) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("coach_packages")
        .insert({
          coach_id: user.id,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          currency: input.currency ?? "ILS",
          session_count: input.session_count,
          validity_days: input.validity_days,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CoachPackage;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Package created");
    },
    onError: (err: Error) => {
      console.error("Failed to create package:", err);
      toast.error("Failed to create package");
    },
  });

  const updatePackage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CoachPackage> & { id: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("coach_packages")
        .update(updates)
        .eq("id", id)
        .eq("coach_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as CoachPackage;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Package updated");
    },
    onError: (err: Error) => {
      console.error("Failed to update package:", err);
      toast.error("Failed to update package");
    },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("coach_packages")
        .update({ is_active: false })
        .eq("id", id)
        .eq("coach_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Package removed");
    },
    onError: (err: Error) => {
      console.error("Failed to delete package:", err);
      toast.error("Failed to remove package");
    },
  });

  return { createPackage, updatePackage, deletePackage };
}
