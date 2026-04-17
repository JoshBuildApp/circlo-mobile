import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedItem {
  id: string;
  user_id: string;
  content_id: string;
  collection_name: string;
  created_at: string;
}

export function useSavedItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["saved_items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SavedItem[];
    },
  });

  const saveItem = useMutation({
    mutationFn: async ({ contentId, collectionName = "Saved" }: { contentId: string; collectionName?: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("saved_items").insert({
        user_id: user.id,
        content_id: contentId,
        collection_name: collectionName,
      });
      if (error) throw error;
    },
    onMutate: async ({ contentId, collectionName = "Saved" }) => {
      await queryClient.cancelQueries({ queryKey: ["saved_items", user?.id] });
      const previous = queryClient.getQueryData<SavedItem[]>(["saved_items", user?.id]);
      queryClient.setQueryData<SavedItem[]>(["saved_items", user?.id], (old = []) => [
        { id: `optimistic-${Date.now()}`, user_id: user!.id, content_id: contentId, collection_name: collectionName, created_at: new Date().toISOString() },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["saved_items", user?.id], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saved_items", user?.id] }),
  });

  const unsaveItem = useMutation({
    mutationFn: async (contentId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("content_id", contentId);
      if (error) throw error;
    },
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: ["saved_items", user?.id] });
      const previous = queryClient.getQueryData<SavedItem[]>(["saved_items", user?.id]);
      queryClient.setQueryData<SavedItem[]>(["saved_items", user?.id], (old = []) =>
        old.filter((item) => item.content_id !== contentId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["saved_items", user?.id], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["saved_items", user?.id] }),
  });

  const isItemSaved = (contentId: string) =>
    (query.data || []).some((item) => item.content_id === contentId);

  const collections = [...new Set((query.data || []).map((item) => item.collection_name))];

  return { savedItems: query.data || [], collections, isItemSaved, saveItem, unsaveItem, loading: query.isLoading };
}
