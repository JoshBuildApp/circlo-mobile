import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, User, UserCog, Image, FileX, DollarSign, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminVerificationInbox from "@/components/AdminVerificationInbox";
import AdminContentPanel from "@/components/AdminContentPanel";
import AdminUserManager from "@/components/AdminUserManager";
import RevenueTab from "@/components/admin/RevenueTab";
import ChurnTab from "@/components/admin/ChurnTab";
import FunnelTab from "@/components/admin/FunnelTab";
import { toast } from "sonner";

type AppRole = "admin" | "user" | "coach" | "developer";

interface UserRow {
  user_id: string;
  username: string;
  email: string;
  role: AppRole;
}

type Tab = "verification" | "users" | "content" | "manage-users" | "revenue" | "churn" | "funnel";

const AdminDashboard = () => {
  const { user, isAdmin, isDeveloper, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<Tab>("verification");
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast.error("Access denied");
      navigate("/home");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, username, email");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      if (profiles && roles) {
        const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));
        const combined: UserRow[] = profiles.map((p) => ({
          user_id: p.user_id,
          username: p.username,
          email: p.email || "—",
          role: (roleMap.get(p.user_id) as AppRole) || "user",
        }));
        setUsers(combined);
      }
      setFetching(false);
    };

    fetchUsers();
  }, [isAdmin]);

  const handleAssignAdmin = async (targetUserId: string) => {
    setPromoting(targetUserId);
    const { error } = await supabase.rpc("assign_admin", { _target_user_id: targetUserId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("User promoted to admin");
      setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, role: "admin" } : u));
    }
    setPromoting(null);
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "verification", label: "Verification" },
    { key: "users", label: "All Users" },
    { key: "content", label: "Content" },
    { key: "manage-users", label: "Manage Users" },
    { key: "revenue", label: "Revenue" },
    { key: "churn", label: "Churn" },
    { key: "funnel", label: "Funnel" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-6 pb-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your CIRCLO community</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-2xl border border-border/10 p-4">
            <Users className="h-4 w-4 text-muted-foreground mb-1.5" />
            <p className="font-heading text-xl font-bold text-foreground">{users.length}</p>
            <p className="text-[10px] text-muted-foreground">Users</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/10 p-4">
            <Shield className="h-4 w-4 text-primary mb-1.5" />
            <p className="font-heading text-xl font-bold text-foreground">
              {users.filter((u) => u.role === "coach").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Coaches</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/10 p-4">
            <User className="h-4 w-4 text-accent mb-1.5" />
            <p className="font-heading text-xl font-bold text-foreground">
              {users.filter((u) => u.role === "admin" || u.role === "developer").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Admins</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 h-9 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                tab === t.key ? "bg-foreground text-background" : "bg-secondary text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "verification" && <AdminVerificationInbox />}

        {tab === "content" && <AdminContentPanel />}

        {tab === "manage-users" && <AdminUserManager />}

        {tab === "revenue" && <RevenueTab />}

        {tab === "churn" && <ChurnTab />}

        {tab === "funnel" && <FunnelTab />}

        {tab === "users" && (
          <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
            <div className="p-4 border-b border-border/10">
              <h2 className="font-heading font-bold text-foreground text-sm">All Users</h2>
            </div>

            {fetching ? (
              <div className="p-10 text-center">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">No users found</div>
            ) : (
              <div className="divide-y divide-border/10">
                {users.map((u) => (
                  <div key={u.user_id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-heading font-bold text-sm flex-shrink-0">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.username}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        u.role === "developer"
                          ? "bg-accent/20 text-accent"
                          : u.role === "admin"
                          ? "bg-primary/15 text-primary"
                          : u.role === "coach"
                          ? "bg-accent/15 text-accent"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                    {isDeveloper && u.role === "user" && (
                      <button
                        onClick={() => handleAssignAdmin(u.user_id)}
                        disabled={promoting === u.user_id}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                        title="Promote to admin"
                      >
                        <UserCog className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
