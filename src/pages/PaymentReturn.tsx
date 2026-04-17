import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type IntentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

interface PaymentIntentRow {
  idempotency_key: string;
  booking_id: string | null;
  status: IntentStatus;
  amount_cents: number;
  currency: string;
  error_detail: string | null;
}

// Landing page the user returns to after paying at Grow. We poll the
// payment_intents row (readable by the owning user per RLS) until its
// status becomes terminal, then show the outcome.
const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const key = searchParams.get("key");

  const [intent, setIntent] = useState<PaymentIntentRow | null>(null);
  const [polling, setPolling] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!key || !user) return;

    let cancelled = false;

    const poll = async () => {
      const { data } = await supabase
        .from("payment_intents")
        .select("idempotency_key, booking_id, status, amount_cents, currency, error_detail")
        .eq("idempotency_key", key)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setIntent(data as PaymentIntentRow);
        if (data.status !== "pending") {
          setPolling(false);
          return;
        }
      }

      setAttempts((n) => n + 1);
    };

    poll();
    const iv = setInterval(() => {
      if (attempts > 30) {
        // ~60s with a 2s interval — give up gracefully.
        setPolling(false);
        clearInterval(iv);
        return;
      }
      poll();
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [key, user, attempts]);

  if (!key) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Missing payment reference</h1>
          <p className="text-muted-foreground">
            We couldn't tell which payment this is. Head back to your bookings.
          </p>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Go to bookings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  if (polling && (!intent || intent.status === "pending")) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <h1 className="text-xl font-semibold">Confirming your payment…</h1>
          <p className="text-muted-foreground text-sm">
            This usually takes a few seconds.
          </p>
        </div>
      </main>
    );
  }

  if (intent?.status === "paid") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold">Payment received</h1>
          <p className="text-muted-foreground">
            Your booking is confirmed. You'll find it in your Bookings tab.
          </p>
          <button
            onClick={() => navigate("/bookings")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            View bookings <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    );
  }

  // failed / cancelled / refunded / timed out
  const failureMessage =
    intent?.status === "cancelled"
      ? "Payment was cancelled."
      : intent?.status === "refunded"
      ? "This payment was refunded."
      : intent?.error_detail ||
        "Something went wrong processing the payment.";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <XCircle className="w-14 h-14 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Payment didn't go through</h1>
        <p className="text-muted-foreground">{failureMessage}</p>
        <button
          onClick={() => navigate("/bookings")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity"
        >
          Back to bookings
        </button>
      </div>
    </main>
  );
};

export default PaymentReturn;
