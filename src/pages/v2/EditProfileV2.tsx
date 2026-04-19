import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function EditProfileV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, age")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setUsername(data.username ?? "");
        setAge(data.age ? String(data.age) : "");
      }
      setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username.trim()) return setError("Username is required.");
    setError(null);
    setLoading(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        age: age ? Number(age) : null,
      })
      .eq("user_id", user.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Profile updated.");
    qc.invalidateQueries({ queryKey: ["v2", "me"] });
    navigate(-1);
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-3.5 flex items-center justify-between">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">Edit profile</h3>
        <div className="w-9" />
      </header>

      <main className="px-7 pt-6 pb-8 flex-1">
        {!user && (
          <div className="text-center text-v2-muted text-[13px] mt-12">
            Sign in to edit your profile.
          </div>
        )}
        {user && hydrating && (
          <div className="text-center text-v2-muted text-[13px] mt-12 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        )}
        {user && !hydrating && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
                placeholder="guy.cohen"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">Bio <span className="font-medium normal-case text-v2-muted-2">· optional</span></span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal resize-none"
                placeholder="Padel player, weekly hitter, always down for doubles."
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">Age</span>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal tnum"
                placeholder="32"
              />
            </label>
            {error && (
              <div className="v2-danger-soft px-3.5 py-2.5 rounded-[10px] text-danger text-[12px] font-semibold">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Saving…" : "Save changes"}
            </button>
          </form>
        )}
      </main>
    </PhoneFrame>
  );
}
