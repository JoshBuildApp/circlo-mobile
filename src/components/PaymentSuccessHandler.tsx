import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const PaymentSuccessHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');

    if (success === 'true' && sessionId) {
      // Show success message
      toast({
        title: 'Payment Successful!',
        description: 'Your booking has been confirmed. You will receive a confirmation email shortly.',
      });

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        navigate('/bookings', { replace: true });
      }, 2000);
    }
  }, [searchParams, navigate, toast]);

  const sessionId = searchParams.get('session_id');
  const success = searchParams.get('success');

  if (success === 'true' && sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
        <p className="text-gray-600 text-center">
          Please wait while we confirm your booking.
        </p>
      </div>
    );
  }

  return null;
};