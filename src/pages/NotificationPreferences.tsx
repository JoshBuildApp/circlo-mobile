import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  Heart,
  MessageSquare,
  UserPlus,
  Calendar,
  Mail,
  Settings2,
  Smartphone,
  Moon,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationPreferences, NotificationPreferences } from "@/hooks/use-notification-preferences";
import { toast } from "sonner";

interface PreferenceRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
  disabled?: boolean;
}

const PreferenceRow = ({ icon, label, description, checked, onCheckedChange, disabled }: PreferenceRowProps) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

const NotificationPreferencesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { preferences, loading, saving, savePreferences } = useNotificationPreferences();
  const [local, setLocal] = useState<NotificationPreferences>(preferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocal(preferences);
  }, [preferences]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const update = (key: keyof NotificationPreferences, value: boolean) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const ok = await savePreferences(local);
    if (ok) {
      setSaved(true);
      toast.success("Notification preferences saved");
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error("Failed to save preferences");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Stay in control</p>
            <p className="text-xs text-muted-foreground mt-1">
              Choose which notifications you receive. Turning off a category stops both in-app and push notifications for that type.
            </p>
          </div>
        </div>

        {/* ── In-App Notifications ── */}
        <div className="rounded-2xl border border-border/10 bg-card p-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Settings2 className="h-[18px] w-[18px] text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Notification Types</h2>
              <p className="text-[10px] text-muted-foreground">Control what you get notified about</p>
            </div>
          </div>

          <div className="divide-y divide-border/10">
            <PreferenceRow
              icon={<Heart className="h-3.5 w-3.5 text-pink-500" />}
              label="Likes"
              description="When someone likes your content"
              checked={local.likes}
              onCheckedChange={(v) => update("likes", v)}
            />
            <PreferenceRow
              icon={<MessageSquare className="h-3.5 w-3.5 text-blue-500" />}
              label="Comments"
              description="When someone comments on your post"
              checked={local.comments}
              onCheckedChange={(v) => update("comments", v)}
            />
            <PreferenceRow
              icon={<UserPlus className="h-3.5 w-3.5 text-green-500" />}
              label="Followers"
              description="When someone starts following you"
              checked={local.follows}
              onCheckedChange={(v) => update("follows", v)}
            />
            <PreferenceRow
              icon={<Calendar className="h-3.5 w-3.5 text-orange-500" />}
              label="Bookings"
              description="Session requests and confirmations"
              checked={local.bookings}
              onCheckedChange={(v) => update("bookings", v)}
            />
            <PreferenceRow
              icon={<Mail className="h-3.5 w-3.5 text-violet-500" />}
              label="Messages"
              description="New direct messages"
              checked={local.messages}
              onCheckedChange={(v) => update("messages", v)}
            />
            <PreferenceRow
              icon={<Bell className="h-3.5 w-3.5 text-amber-500" />}
              label="System"
              description="Updates, announcements, and alerts"
              checked={local.system}
              onCheckedChange={(v) => update("system", v)}
            />
          </div>
        </div>

        {/* ── Push Notifications ── */}
        <div className="rounded-2xl border border-border/10 bg-card p-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-[18px] w-[18px] text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Push Notifications</h2>
              <p className="text-[10px] text-muted-foreground">Notifications sent to your device</p>
            </div>
          </div>

          <div className="divide-y divide-border/10">
            <PreferenceRow
              icon={<Smartphone className="h-3.5 w-3.5 text-primary" />}
              label="Enable Push"
              description="Receive push notifications on your device"
              checked={local.push_enabled}
              onCheckedChange={(v) => update("push_enabled", v)}
            />
            {local.push_enabled && (
              <>
                <PreferenceRow
                  icon={<Heart className="h-3.5 w-3.5 text-pink-500" />}
                  label="Push — Likes"
                  description="Push when someone likes your content"
                  checked={local.push_likes}
                  onCheckedChange={(v) => update("push_likes", v)}
                  disabled={!local.likes}
                />
                <PreferenceRow
                  icon={<MessageSquare className="h-3.5 w-3.5 text-blue-500" />}
                  label="Push — Comments"
                  description="Push when someone comments"
                  checked={local.push_comments}
                  onCheckedChange={(v) => update("push_comments", v)}
                  disabled={!local.comments}
                />
                <PreferenceRow
                  icon={<UserPlus className="h-3.5 w-3.5 text-green-500" />}
                  label="Push — Followers"
                  description="Push when someone follows you"
                  checked={local.push_follows}
                  onCheckedChange={(v) => update("push_follows", v)}
                  disabled={!local.follows}
                />
                <PreferenceRow
                  icon={<Calendar className="h-3.5 w-3.5 text-orange-500" />}
                  label="Push — Bookings"
                  description="Push for session updates"
                  checked={local.push_bookings}
                  onCheckedChange={(v) => update("push_bookings", v)}
                  disabled={!local.bookings}
                />
                <PreferenceRow
                  icon={<Mail className="h-3.5 w-3.5 text-violet-500" />}
                  label="Push — Messages"
                  description="Push for new messages"
                  checked={local.push_messages}
                  onCheckedChange={(v) => update("push_messages", v)}
                  disabled={!local.messages}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Quiet Hours ── */}
        <div className="rounded-2xl border border-border/10 bg-card p-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Moon className="h-[18px] w-[18px] text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Quiet Hours</h2>
              <p className="text-[10px] text-muted-foreground">Pause push notifications during set hours</p>
            </div>
          </div>

          <div className="divide-y divide-border/10">
            <PreferenceRow
              icon={<Moon className="h-3.5 w-3.5 text-indigo-500" />}
              label="Enable Quiet Hours"
              description="No push notifications during these times"
              checked={local.quiet_hours_enabled}
              onCheckedChange={(v) => update("quiet_hours_enabled", v)}
            />
          </div>

          {local.quiet_hours_enabled && (
            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1.5">From</label>
                <input
                  type="time"
                  value={local.quiet_hours_start}
                  onChange={(e) => setLocal((p) => ({ ...p, quiet_hours_start: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-secondary border border-border/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1.5">To</label>
                <input
                  type="time"
                  value={local.quiet_hours_end}
                  onChange={(e) => setLocal((p) => ({ ...p, quiet_hours_end: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-secondary border border-border/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-2xl bg-brand-gradient text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-brand-sm hover:brightness-110 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : saved ? (
            <><CheckCircle2 className="h-4 w-4" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4" /> Save Preferences</>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground/60 text-center px-4">
          Changes apply immediately after saving
        </p>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
