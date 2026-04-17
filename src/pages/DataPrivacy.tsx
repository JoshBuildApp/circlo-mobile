import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Trash2, Shield, AlertTriangle, Loader2, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const DataPrivacy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dialogConfirmText, setDialogConfirmText] = useState("");

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all user data from relevant tables.
      // Messages use two separate .eq() queries instead of .or() with a
      // template-literal filter — .or() does not parameterize and mixing
      // user input with its string-based filter syntax is a footgun.
      const [
        { data: profile },
        { data: bookings },
        { data: sentMessages },
        { data: receivedMessages },
        { data: likes },
        { data: comments },
        { data: follows },
        { data: savedItems },
        { data: progress },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("bookings").select("*").eq("user_id", user.id),
        supabase.from("messages").select("*").eq("sender_id", user.id),
        supabase.from("messages").select("*").eq("receiver_id", user.id),
        supabase.from("likes").select("*").eq("user_id", user.id),
        supabase.from("comments").select("*").eq("user_id", user.id),
        supabase.from("user_follows").select("*").eq("user_id", user.id),
        supabase.from("saved_items").select("*").eq("user_id", user.id),
        supabase.from("trainee_progress").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      const messages = [...(sentMessages ?? []), ...(receivedMessages ?? [])];

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profile || null,
        bookings: bookings || [],
        messages: (messages || []).map(m => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          is_sender: m.sender_id === user.id,
        })),
        likes: (likes || []).length,
        comments: comments || [],
        following: (follows || []).length,
        saved_items: (savedItems || []).length,
        training_progress: progress || null,
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `circlo-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteRequest = () => {
    if (deleteConfirmText !== "DELETE") return;
    setDialogConfirmText("");
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (dialogConfirmText !== "DELETE") return;
    setShowDeleteDialog(false);
    setDeleting(true);

    const succeeded: string[] = [];
    const failed: string[] = [];

    const deletionSteps: { label: string; run: () => any }[] = [
      {
        label: "Saved items",
        run: () => supabase.from("saved_items").delete().eq("user_id", user.id),
      },
      {
        label: "Likes",
        run: () => supabase.from("likes").delete().eq("user_id", user.id),
      },
      {
        label: "Comments",
        run: () => supabase.from("comments").delete().eq("user_id", user.id),
      },
      {
        label: "Follows",
        run: async () => {
          // Split into two explicit .eq() deletes — see the messages comment
          // in handleExport for why we avoid .or() with a template literal.
          const [byUser, byCoach] = await Promise.all([
            supabase.from("user_follows").delete().eq("user_id", user.id),
            supabase.from("user_follows").delete().eq("coach_id", user.id),
          ]);
          return byUser.error ? byUser : byCoach;
        },
      },
      {
        label: "Notifications",
        run: () => supabase.from("notifications").delete().eq("user_id", user.id),
      },
      {
        label: "Training progress",
        run: () => supabase.from("trainee_progress").delete().eq("user_id", user.id),
      },
      {
        label: "Stories",
        run: () => supabase.from("stories").delete().eq("user_id", user.id),
      },
      {
        label: "Sent messages",
        run: () => supabase.from("messages").delete().eq("sender_id", user.id),
      },
      {
        label: "Received messages",
        run: () => supabase.from("messages").delete().eq("receiver_id", user.id),
      },
      {
        label: "Bookings (anonymized)",
        run: () =>
          supabase
            .from("bookings")
            .update({ coach_name: "Deleted User" } as never)
            .eq("user_id", user.id),
      },
      {
        label: "Profile",
        run: () => supabase.from("profiles").delete().eq("user_id", user.id),
      },
    ];

    let hadError = false;

    for (const step of deletionSteps) {
      try {
        const { error } = await step.run();
        if (error) {
          failed.push(step.label);
          hadError = true;
        } else {
          succeeded.push(step.label);
        }
      } catch {
        failed.push(step.label);
        hadError = true;
      }
    }

    if (hadError) {
      const deletedList = succeeded.length > 0 ? succeeded.join(", ") : "None";
      const failedList = failed.join(", ");
      console.error("Partial deletion — deleted:", deletedList, "failed:", failedList);
      toast.error(
        `Deletion incomplete. Deleted: ${deletedList}. Failed: ${failedList}. Please contact support.`,
        { duration: 10000 }
      );
      setDeleting(false);
      return;
    }

    // All deletions succeeded — sign out
    await supabase.auth.signOut();
    toast.success("Your data has been deleted. Goodbye!");
    navigate("/");
    setDeleting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Data & Privacy</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Your data, your control</p>
            <p className="text-xs text-muted-foreground mt-1">
              Under GDPR and data privacy regulations, you have the right to export or delete your personal data at any time.
            </p>
          </div>
        </div>

        {/* Export Section */}
        <div className="rounded-2xl border border-border/10 bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Export Your Data</p>
              <p className="text-xs text-muted-foreground">Download a copy of all your Circlo data</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            This includes your profile, bookings, messages, likes, comments, follows, and training progress. The export will be a JSON file.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full h-11 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {exporting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Preparing export...</>
            ) : (
              <><Download className="h-4 w-4" /> Download My Data</>
            )}
          </button>
        </div>

        {/* Delete Section */}
        <div className="rounded-2xl border border-destructive/20 bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Delete Your Account</p>
              <p className="text-xs text-muted-foreground">Permanently remove all your data</p>
            </div>
          </div>

          {!confirmDelete ? (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                This will permanently delete your profile, messages, likes, comments, follows, and training progress. Booking history will be anonymized. This action cannot be undone.
              </p>
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full h-11 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-destructive/5"
              >
                <Trash2 className="h-4 w-4" /> Request Account Deletion
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-medium">
                  This action is permanent and cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full h-11 px-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-destructive/20"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmDelete(false); setDeleteConfirmText(""); }}
                  className="flex-1 h-11 rounded-xl bg-secondary text-sm font-semibold text-muted-foreground active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRequest}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                  ) : (
                    "Delete Everything"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Additional info */}
        <p className="text-[10px] text-muted-foreground/60 text-center px-4">
          For questions about your data, contact support@circloclub.com
        </p>
      </div>

      {/* Final confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Final Confirmation</DialogTitle>
            <DialogDescription>
              This is your last chance to cancel. All your data will be permanently
              deleted and this action cannot be undone. Type <strong>DELETE</strong> again
              to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={dialogConfirmText}
              onChange={(e) => setDialogConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="text-center"
            />
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 h-11 rounded-xl bg-secondary text-sm font-semibold text-muted-foreground active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={dialogConfirmText !== "DELETE"}
              className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Permanently Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataPrivacy;
