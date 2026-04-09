import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  coach_id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock: number;
  status: string;
  created_at: string;
}

export function useCoachProducts(coachId: string | undefined) {
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["coach-products", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("coach_id", coachId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: !!coachId,
  });

  return { products, loading: isLoading, refresh: refetch };
}
