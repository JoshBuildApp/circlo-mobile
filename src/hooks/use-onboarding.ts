import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useOnboarding() {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setNeedsOnboarding(false);
      setCheckComplete(true);
      return false;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('interests, onboarding_completed')
        .eq('user_id', user.id)
        .single();

      // Needs onboarding if: no interests set OR onboarding_completed is explicitly false/null
      const needs = !profile?.interests?.length || !(profile as Record<string, unknown>)?.onboarding_completed;
      setNeedsOnboarding(needs);
      setCheckComplete(true);
      return needs;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setCheckComplete(true);
      return false;
    }
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  return { needsOnboarding, checkComplete, checkOnboardingStatus };
}
