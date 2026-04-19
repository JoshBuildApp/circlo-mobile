import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, User, CreditCard, Sun, Eye, MapPin, FileText, HelpCircle, Award } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton, Avatar } from "@/components/v2/shared";
import { useMyPlayerProfile } from "@/hooks/v2/useMocks";
import { useV2Theme } from "@/contexts/v2/ThemeContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SettingRow {
  icon: typeof User;
  iconClass?: string;
  title: string;
  sub: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}

function SettingsList({ rows }: { rows: SettingRow[] }) {
  return (
    <div className="bg-navy-card rounded-[14px] overflow-hidden">
      {rows.map((row, i) => {
        const Icon = row.icon;
        return (
          <button
            key={i}
            onClick={row.onClick}
            className={cn(
              "w-full flex gap-3 px-3.5 py-3.5 items-center text-left",
              i < rows.length - 1 && "border-b border-navy-line"
            )}
          >
            <div className={cn("w-9 h-9 rounded-[10px] bg-navy-card-2 flex items-center justify-center text-teal", row.iconClass)}>
              <Icon size={16} />
            </div>
            <div className="flex-1">
              <h4 className="text-[14px] font-bold">{row.title}</h4>
              <p className="text-[12px] text-v2-muted mt-0.5">{row.sub}</p>
            </div>
            {row.trailing ?? <ChevronRight size={14} className="text-v2-muted" />}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      aria-label="Toggle"
      onClick={() => onChange(!on)}
      className={cn("w-11 h-[26px] rounded-full relative transition-colors shrink-0", on ? "bg-teal" : "bg-navy-line")}
    >
      <span className={cn("absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all", on ? "right-[3px]" : "left-[3px]")} />
    </button>
  );
}

export default function SettingsV2Page() {
  const navigate = useNavigate();
  const { data: me } = useMyPlayerProfile();
  const { theme, setTheme } = useV2Theme();
  const { signOut } = useAuth();
  const dark = theme === "dark";
  const setDark = (next: boolean) => setTheme(next ? "dark" : "light");
  const [profileVisible, setProfileVisible] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    if (!window.confirm("Sign out of Circlo?")) return;
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out.");
      navigate("/v2/welcome", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign out failed.");
      setSigningOut(false);
    }
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-2.5 flex items-center justify-between">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/profile")}>
          <ChevronLeft size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">Settings</h3>
        <div className="w-9" />
      </header>

      <div className="px-5 pt-5 pb-3.5 flex gap-3.5 items-center">
        <Avatar size={56} gradient="teal-mint" />
        <div className="flex-1">
          <div className="text-[16px] font-bold">{me?.fullName ?? "Member"}</div>
          <div className="text-[12px] text-v2-muted mt-0.5">{me?.email ?? ""} · {me?.city ?? ""}</div>
        </div>
        <button
          onClick={() => navigate("/v2/profile/edit")}
          className="px-3.5 py-2 rounded-full bg-navy-card text-offwhite font-semibold text-[12px]"
        >
          Edit
        </button>
      </div>

      <div className="px-5 pb-3 text-[10px] text-v2-muted font-bold tracking-widest uppercase">ACCOUNT</div>
      <div className="px-5 mb-4">
        <SettingsList
          rows={[
            { icon: User, title: "Personal info", sub: "Name, email, phone", onClick: () => navigate("/v2/profile/edit") },
            { icon: CreditCard, title: "Payment methods", sub: "Visa ···· 4242 · Apple Pay", onClick: () => navigate("/v2/profile/payments") },
          ]}
        />
      </div>

      <div className="px-5 pb-3 text-[10px] text-v2-muted font-bold tracking-widest uppercase">PREFERENCES</div>
      <div className="px-5 mb-4">
        <SettingsList
          rows={[
            { icon: Sun, title: "Appearance", sub: dark ? "Dark mode" : "Light mode", trailing: <Toggle on={dark} onChange={setDark} /> },
          ]}
        />
      </div>

      <div className="px-5 pb-3 text-[10px] text-v2-muted font-bold tracking-widest uppercase">PRIVACY</div>
      <div className="px-5 mb-4">
        <SettingsList
          rows={[
            { icon: Eye, title: "Profile visibility", sub: "Coaches can see your profile", trailing: <Toggle on={profileVisible} onChange={setProfileVisible} /> },
            { icon: MapPin, title: "Share location", sub: "For nearby coaches · Near you section", trailing: <Toggle on={shareLocation} onChange={setShareLocation} /> },
          ]}
        />
      </div>

      <div className="px-5 pb-3 text-[10px] text-v2-muted font-bold tracking-widest uppercase">SUPPORT</div>
      <div className="px-5 mb-5">
        <SettingsList
          rows={[
            { icon: HelpCircle, title: "Help center", sub: "FAQ · contact support", onClick: () => window.open("mailto:support@circloclub.com", "_blank") },
            { icon: FileText, title: "Terms & policies", sub: "Terms of service · Privacy", onClick: () => window.open("https://circloclub.com/legal/terms", "_blank") },
            { icon: Award, iconClass: "text-orange", title: "Become a coach", sub: "Start coaching on Circlo", onClick: () => navigate("/v2/go-pro") },
          ]}
        />
      </div>

      <div className="px-5 mb-5">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3.5 rounded-[14px] bg-navy-card text-danger border border-danger/30 font-bold text-[14px] disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <div className="text-center text-[11px] text-v2-muted-2 pb-12">Circlo v2 · build {Math.floor(Math.random() * 1000)}</div>
    </PhoneFrame>
  );
}
