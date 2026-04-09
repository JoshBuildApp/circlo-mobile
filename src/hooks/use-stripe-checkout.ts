import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (
    bookingId: string,
    coachId: string,
    sessionType: string,
    price: number,
    currency = 'usd'
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          bookingId,
          coachId,
          sessionType,
          price,
          currency,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
  };
};