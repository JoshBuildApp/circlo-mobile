// Danger Zone: change password, cancel subscription, delete account.
//
// All three are irreversible (or nearly so) so each is gated behind a
// confirm dialog with a typed-confirmation pattern for delete-account
// (the destructive one).
//
// Hooks into:
//   - supabase.auth.updateUser({ password }) for password change
//   - supabase.rpc("delete_my_account") for account deletion (live in
//     migration 20260423130000_delete_my_account_rpc.sql)
//   - For "cancel subscription": Circlo Pro is mentioned in the routes but
//     no real subscription system is wired yet; we render a stub that
//     opens an email-to-support link. When the subscription system lands
//     this component will be updated.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AlertTriangle, KeyRound, CreditCard, Trash2, Loader2 } from "lucide-react";

export function DangerZone() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // ── change password ───────────────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[\d!@#$%^&*]/.test(newPassword)) {
      toast.error("Password must include a letter and a digit or special character.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword("");
    setNewPasswordConfirm("");
    setPwOpen(false);
    toast.success("Password updated. You'll stay logged in on this device.");
  }

  async function handleSendResetEmail() {
    if (!user?.email) {
      toast.error("No email on file. Contact support.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Reset link sent to ${user.email}. Check your inbox.`);
  }

  // ── delete account ────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_my_account", { reason: "user_initiated" });
    if (error) {
      setDeleting(false);
      toast.error(`Could not delete account: ${error.message}`);
      return;
    }
    // Sign out locally + redirect to landing.
    await signOut();
    navigate("/");
    toast.success("Your account has been deleted.");
  }

  // ── cancel subscription ───────────────────────────────────────────────
  const [cancelOpen, setCancelOpen] = useState(false);

  function handleCancelSubscription() {
    // Stub: until Circlo Pro subscriptions are wired, send the user to
    // email support and close the dialog. When Stripe Subscriptions go
    // live, replace this with a real RPC that calls
    // stripe.subscriptions.update(id, { cancel_at_period_end: true }).
    window.location.href =
      "mailto:circlomanagement@circloclub.com?subject=Cancel%20subscription&body=I%20would%20like%20to%20cancel%20my%20Circlo%20Pro%20subscription.%20Account%20email%3A%20" +
      encodeURIComponent(user?.email ?? "");
    setCancelOpen(false);
  }

  return (
    <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-destructive">
          Danger Zone
        </h2>
      </div>

      <p className="text-xs text-muted-foreground mb-5 leading-snug">
        These actions are irreversible. Read each one carefully before confirming.
      </p>

      <div className="space-y-3">
        {/* change password */}
        <Row
          icon={<KeyRound className="h-4 w-4" />}
          title="Change password"
          desc="Update your password. You'll stay logged in on this device. To log out other devices, change here, then sign out + sign back in everywhere."
        >
          <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
            Change
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSendResetEmail}>
            Email me a reset link
          </Button>
        </Row>

        {/* cancel subscription */}
        <Row
          icon={<CreditCard className="h-4 w-4" />}
          title="Cancel subscription"
          desc="Cancel Circlo Pro at the end of your current billing cycle. You keep access until the period ends. (Subscription billing isn't live yet — we'll handle this manually for now.)"
        >
          <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
            Cancel Pro
          </Button>
        </Row>

        {/* delete account */}
        <Row
          icon={<Trash2 className="h-4 w-4" />}
          title="Delete account"
          desc="Permanently deletes your account, profile, bookings, messages, and content. Legally-required records (waivers, payment receipts) are anonymized — kept as evidence but no longer linked to you. This cannot be undone."
        >
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteOpen(true);
            }}
          >
            Delete my account
          </Button>
        </Row>
      </div>

      {/* ─── change password dialog ──────────────────────────────────── */}
      <AlertDialog open={pwOpen} onOpenChange={setPwOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change your password</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a new password (8+ characters, must include a letter and a digit or special character).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="dz-new-pw">New password</Label>
              <Input
                id="dz-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="dz-new-pw2">Confirm new password</Label>
              <Input
                id="dz-new-pw2"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pwSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} disabled={pwSaving}>
              {pwSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save new password"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── cancel subscription dialog ──────────────────────────────── */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Circlo Pro?</AlertDialogTitle>
            <AlertDialogDescription>
              We don't have automated subscription cancellation wired up yet. Click "Email support"
              and we'll handle it for you within 1 business day. You'll keep access until the end
              of your current billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription}>
              Email support
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── delete account dialog ───────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanently delete your Circlo account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>This cannot be undone. We will:</span>
              <span className="block pl-4">
                · Delete your profile, bookings, messages, and uploaded content<br />
                · Cancel any pending bookings (refunds per the Refund Policy)<br />
                · Anonymize legally-required records (waivers, receipts) so they no longer identify you
              </span>
              <span className="block">
                Type <strong>DELETE</strong> below to confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            className="my-2"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== "DELETE"}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                "Delete my account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3 rounded-xl border border-border/40 bg-background">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-shrink-0">{children}</div>
    </div>
  );
}
