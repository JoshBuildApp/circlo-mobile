import { Bell } from "lucide-react";

interface NotificationsTabProps {
  coachProfileId: string;
}

// Placeholder tab for the coach dashboard notifications view. The live version
// will read from the notifications table scoped to the coach profile.
const NotificationsTab = ({ coachProfileId: _coachProfileId }: NotificationsTabProps) => {
  return (
    <div className="rounded-2xl border border-border/10 bg-card p-6 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Bell className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">Notifications</p>
        <p className="text-xs text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
};

export default NotificationsTab;
