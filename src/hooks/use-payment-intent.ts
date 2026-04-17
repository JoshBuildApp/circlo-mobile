import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

// Starts a payment for a booking. The edge function creates a payment
// intent row, posts to Make.com, and returns a hosted checkout URL from
// Grow. We then redirect the browser there. When the user finishes paying,
// Grow → Make.com → our `grow-payment-callback` edge function flips the
// intent (and the booking) to its final state. The user comes back to
// `/payment/return?key=<idempotency_key>` where we poll for the final state.
export const usePaymentIntent = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const startPayment = async (bookingId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        'create-payment-intent',
        { body: { bookingId } },
      );

      if (error) throw error;
      if (!data?.checkout_url || typeof data.checkout_url !== 'string') {
        throw new Error('No checkout URL received');
      }

      // Redirect to the Grow-hosted checkout.
      window.location.href = data.checkout_url;
      return data;
    } catch (err: any) {
      console.error('Payment error:', err);
      // The edge function returns 503 with this exact message when the
      // Make.com webhook env vars aren't configured yet — show a friendlier
      // "not wired up" toast for that case so the dev environment isn't
      // confusing while Grow is being set up.
      const msg =
        err?.message?.includes?.('not configured') ||
        err?.context?.status === 503
          ? 'Payments are not configured yet. Please try again later.'
          : 'Failed to initialize payment. Please try again.';
      toast({
        title: 'Payment Error',
        description: msg,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { startPayment, loading };
};
