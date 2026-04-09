import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralData {
  id: string;
  referrer_code: string;
  referred_user_id: string;
  status: "pending" | "credited" | "expired";
  credit_amount: number;
  booking_id?: string;
  created_at: string;
  credited_at?: string;
}

interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_credits: number;
  total_earned: number;
  conversion_rate: number;
}

const sb = supabase as any;

export const useReferral = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    successful_referrals: 0,
    pending_credits: 0,
    total_earned: 0,
    conversion_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const generateReferralCode = (userId: string): string => {
    const timestamp = Date.now().toString(36);
    const userPart = userId.slice(-6);
    return `${userPart}${timestamp}`.toUpperCase();
  };

  const getReferralCode = async () => {
    if (!user?.id) return "";

    try {
      const { data: profile, error } = await sb
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (profile?.referral_code) {
        return profile.referral_code;
      }

      const newCode = generateReferralCode(user.id);
      const { error: updateError } = await sb
        .from("profiles")
        .update({ referral_code: newCode })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return newCode;
    } catch (error) {
      console.error("Error getting referral code:", error);
      return "";
    }
  };

  const loadReferralData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const code = await getReferralCode();
      setReferralCode(code);

      if (code) {
        const { data: referralData, error } = await sb
          .from("referrals")
          .select(`
            *,
            referred_user:profiles!referrals_referred_user_id_fkey(
              id,
              full_name,
              avatar_url
            )
          `)
          .eq("referrer_code", code)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setReferrals(referralData || []);
        calculateStats(referralData || []);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load referral data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (referralData: ReferralData[]) => {
    const totalReferrals = referralData.length;
    const successfulReferrals = referralData.filter(r => r.status === "credited").length;
    const pendingCredits = referralData
      .filter(r => r.status === "pending")
      .reduce((sum, r) => sum + r.credit_amount, 0);
    const totalEarned = referralData
      .filter(r => r.status === "credited")
      .reduce((sum, r) => sum + r.credit_amount, 0);
    const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

    setStats({
      total_referrals: totalReferrals,
      successful_referrals: successfulReferrals,
      pending_credits: pendingCredits,
      total_earned: totalEarned,
      conversion_rate: conversionRate,
    });
  };

  const processReferralSignup = async (referrerCode: string, newUserId: string) => {
    try {
      const { data: referrer, error: referrerError } = await sb
        .from("profiles")
        .select("id")
        .eq("referral_code", referrerCode)
        .single();

      if (referrerError || !referrer) {
        console.log("Invalid referrer code:", referrerCode);
        return false;
      }

      const { error: referralError } = await sb
        .from("referrals")
        .insert({
          referrer_code: referrerCode,
          referred_user_id: newUserId,
          status: "pending",
          credit_amount: 0,
        });

      if (referralError) throw referralError;

      const { error: profileError } = await sb
        .from("profiles")
        .update({ referred_by: referrerCode })
        .eq("id", newUserId);

      if (profileError) throw profileError;

      return true;
    } catch (error) {
      console.error("Error processing referral signup:", error);
      return false;
    }
  };

  const processReferralCredit = async (bookingId: string, bookingAmount: number) => {
    try {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        console.log("Booking not found:", bookingId);
        return false;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("bio")
        .eq("user_id", booking.user_id)
        .maybeSingle();

      if (!profile) {
        console.log("No referrer for this booking");
        return false;
      }

      const { data: previousBookings, error: prevError } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", booking.user_id)
        .eq("status", "completed")
        .neq("id", bookingId);

      if (prevError) throw prevError;

      if (previousBookings && previousBookings.length > 0) {
        console.log("Not the first booking for this user");
        return false;
      }

      const creditAmount = bookingAmount * 0.1;
      console.log("Referral credit processing skipped - feature not fully implemented");
      return true;
    } catch (error) {
      console.error("Error processing referral credit:", error);
      return false;
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user?.id]);

  return {
    referralCode,
    referrals,
    stats,
    isLoading,
    getReferralCode,
    loadReferralData,
    processReferralSignup,
    processReferralCredit,
  };
};
