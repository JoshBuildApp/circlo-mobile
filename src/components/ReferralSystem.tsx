import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReferralStats {
  total_referrals: number;
  pending_credits: number;
  earned_credits: number;
  conversion_rate: number;
}

const sb = supabase as any;

export const ReferralSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    pending_credits: 0,
    earned_credits: 0,
    conversion_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user?.id]);

  const loadReferralData = async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error: profileError } = await sb
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      let code = profile?.referral_code;
      
      if (!code) {
        code = await generateReferralCode();
        await updateReferralCode(code);
      }

      setReferralCode(code);
      setReferralLink(`${window.location.origin}/signup?ref=${code}`);

      await loadReferralStats(code);
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

  const generateReferralCode = async (): Promise<string> => {
    const timestamp = Date.now().toString(36);
    const userPart = user?.id?.slice(-4) || "user";
    return `${userPart}${timestamp}`.toUpperCase();
  };

  const updateReferralCode = async (code: string) => {
    const { error } = await sb
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", user?.id);

    if (error) throw error;
  };

  const loadReferralStats = async (code: string) => {
    try {
      const { data: referrals, error } = await sb
        .from("referrals")
        .select(`
          id,
          status,
          credit_amount,
          created_at,
          profiles!referrals_referred_user_id_fkey(id, full_name)
        `)
        .eq("referrer_code", code);

      if (error) throw error;

      const totalReferrals = referrals?.length || 0;
      const pendingCredits = referrals
        ?.filter((r: any) => r.status === "pending")
        ?.reduce((sum: number, r: any) => sum + (r.credit_amount || 0), 0) || 0;
      const earnedCredits = referrals
        ?.filter((r: any) => r.status === "credited")
        ?.reduce((sum: number, r: any) => sum + (r.credit_amount || 0), 0) || 0;
      
      const completedReferrals = referrals?.filter((r: any) => r.status === "credited").length || 0;
      const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

      setStats({
        total_referrals: totalReferrals,
        pending_credits: pendingCredits,
        earned_credits: earnedCredits,
        conversion_rate: conversionRate,
      });
    } catch (error) {
      console.error("Error loading referral stats:", error);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link",
      });
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Circlo with my referral link",
          text: "Get started with fitness coaching on Circlo!",
          url: referralLink,
        });
      } catch (error) {
        // Share cancelled
      }
    } else {
      copyReferralLink();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
        <p className="text-muted-foreground">
          Invite friends and earn 10% credit on their first booking!
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.total_referrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Earned Credits</p>
                <p className="text-2xl font-bold">${stats.earned_credits.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Credits</p>
                <p className="text-2xl font-bold">${stats.pending_credits.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Share2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="referral-code">Referral Code</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="referral-code"
                value={referralCode}
                readOnly
                className="font-mono"
              />
              <Badge variant="secondary" className="px-3 py-2">
                {referralCode}
              </Badge>
            </div>
          </div>

          <div>
            <Label htmlFor="referral-link">Referral Link</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="referral-link"
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyReferralLink}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareReferralLink}
                className="shrink-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share your referral link with friends</li>
              <li>• When they sign up and book their first session</li>
              <li>• You earn 10% credit of their booking amount</li>
              <li>• Credits are applied to your account after their session</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
