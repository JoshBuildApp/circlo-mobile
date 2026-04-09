import { useState, useCallback } from "react";
import { Trash2, Search, X, Ban, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManagedUser {
  user_id: string;
  username: string;
  email: string;
  status: string;
  role: string;
  postCount: number;
}

const AdminUserManager = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: "suspend" | "delete" | "restore" } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, username, email, status");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    // Count posts per user
    const { data: videos } = await supabase.from("coach_videos").select("user_id");

    const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
    const postMap = new Map<string, number>();
    (videos || []).forEach((v) => {
      postMap.set(v.user_id, (postMap.get(v.user_id) || 0) + 1);
    });

    setUsers(
      (profiles || []).map((p) => ({
        user_id: p.user_id,
        username: p.username,
        email: p.email || "—",
        status: p.status || "active",
        role: (roleMap.get(p.user_id) as string) || "user",
        postCount: postMap.get(p.user_id) || 0,
      }))
    );
    setLoading(false);
    setLoaded(true);
  }, []);

  const handleAction = async (userId: string, action: "suspend" | "delete" | "restore") => {
    setActing(userId);
    const newStatus = action === "restore" ? "active" : action === "suspend" ? "suspended" : "deleted";

    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success(
        action === "restore" ? "User restored" :
        action === "suspend" ? "User suspended" :
        "User deleted (soft)"
      );
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u))
      );
    }
    setActing(null);
    setConfirmAction(null);
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!loaded) {
    return (
      <div className="bg-card rounded-2xl border border-border/10 p-6 text-center">
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-6 h-10 rounded-xl bg-foreground text-background text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load Users"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} users</p>

      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden divide-y divide-border/10">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
        ) : (
          filtered.map((u) => (
            <div key={u.user_id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-sm flex-shrink-0">
                {u.username.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{u.username}</p>
                  {u.status !== "active" && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      u.status === "suspended" ? "bg-yellow-500/20 text-yellow-600" : "bg-destructive/20 text-destructive"
                    }`}>
                      {u.status}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {u.email} · {u.role} · {u.postCount} posts
                </p>
              </div>

              {/* Actions */}
              {confirmAction?.userId === u.user_id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(u.user_id, confirmAction.action)}
                    disabled={acting === u.user_id}
                    className="px-3 h-8 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-bold disabled:opacity-50"
                  >
                    {acting === u.user_id ? "…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {/* Don't allow actions on admin/developer */}
                  {u.role !== "admin" && u.role !== "developer" && (
                    <>
                      {u.status === "active" && (
                        <button
                          onClick={() => setConfirmAction({ userId: u.user_id, action: "suspend" })}
                          className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-600 transition-colors"
                          title="Suspend user"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      {u.status === "active" && (
                        <button
                          onClick={() => setConfirmAction({ userId: u.user_id, action: "delete" })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete user (soft)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {(u.status === "suspended" || u.status === "deleted") && (
                        <button
                          onClick={() => setConfirmAction({ userId: u.user_id, action: "restore" })}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-600 transition-colors"
                          title="Restore user"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUserManager;
