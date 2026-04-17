import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { openExternal } from "@/lib/platform";

interface StripeStatus {
  stripe_account_id: string | null;
  stripe_account_status: string | null;
}

const StripeConnectSetup = ({ coachProfileId }: { coachProfileId: string }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [payoutStats, setPayoutStats] = useState<{
    total_paid: number;
    last_payout_at: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("coach_profiles")
        .select("stripe_account_id, stripe_account_status")
        .eq("id", coachProfileId)
        .maybeSingle();

      if (data) {
        setStatus({
          stripe_account_id: (data as any).stripe_account_id ?? null,
          stripe_account_status: (data as any).stripe_account_status ?? null,
        });

        // Fetch payout stats if connected
        if ((data as any).stripe_account_id) {
          const { data: payouts } = await (supabase.from as any)("coach_payouts")
            .select("amount, paid_at, status")
            .eq("coach_id", coachProfileId)
            .eq("status", "paid")
            .order("paid_at", { ascending: false });

          if (payouts && payouts.length > 0) {
            const totalPaid = payouts.reduce((s: number, p: any) => s + (p.amount || 0), 0);
            setPayoutStats({
              total_paid: totalPaid,
              last_payout_at: (payouts[0] as any).paid_at ?? null,
            });
          } else {
            setPayoutStats({ total_paid: 0, last_payout_at: null });
          }
        }
      }
      setLoading(false);
    };
    fetchStatus();
  }, [coachProfileId]);

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-connect-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ coach_profile_id: coachProfileId }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create Stripe account");
      }

      const { url } = await res.json();
      if (url) {
        openExternal(url);
        toast.success("Stripe onboarding opened in a new tab");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Stripe");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border/10 p-5 animate-pulse">
        <div className="h-4 w-32 bg-secondary rounded mb-3" />
        <div className="h-8 w-48 bg-secondary rounded" />
      </div>
    );
  }

  const accountId = status?.stripe_account_id;
  const accountStatus = status?.stripe_account_status;

  // Determine display state
  const isActive = accountId && (accountStatus === "active" || accountStatus === "complete");
  const isPending = accountId && !isActive;

  return (
    <div className="rounded-2xl bg-card border border-border/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#635BFF]/10 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-[#635BFF]" />
        </div>
        <div>
          <h3 className="text-sm font-heading font-bold text-foreground">Payout Account</h3>
          <p className="text-[11px] text-muted-foreground">Powered by Stripe Connect</p>
        </div>
      </div>

      {/* Status */}
      {isActive && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-xs font-bold text-green-500">Payout account active ✓</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Total Paid Out</p>
              <p className="text-base font-heading font-bold text-foreground">
                ₪{((payoutStats?.total_paid ?? 0) / 100).toLocaleString()}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Last Payout</p>
              <p className="text-sm font-bold text-foreground">
                {payoutStats?.last_payout_at
                  ? new Date(payoutStats.last_payout_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Account ID: <span className="font-mono">{accountId?.slice(0, 18)}…</span>
          </p>
        </div>
      )}

      {isPending && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-500">Verification in progress</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Account created", done: true },
              { label: "Identity verification", done: false },
              { label: "Bank account connected", done: false },
              { label: "Payouts enabled", done: false },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-2.5">
                {step.done ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className={`text-xs ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-bold active:scale-[0.98] transition-transform"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Continue Verification
          </button>
        </div>
      )}

      {!accountId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border/10">
            <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">Not connected</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Connect a Stripe account to receive payouts from your sessions and digital product sales.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-heading font-bold active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {connecting ? "Opening Stripe…" : "Connect Stripe"}
          </button>
        </div>
      )}
    </div>
  );
};

export default StripeConnectSetup;
