import { useState, useEffect } from 'react';
import { Star, Users, Calendar, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CoachSocialProofProps {
  coachId: string;
  className?: string;
}

interface SocialProofData {
  totalStudents: number;
  yearsCoaching: number;
  certifications: string[];
  recentReview: {
    id: string;
    rating: number;
    comment: string;
    author: string;
    date: string;
  } | null;
}

export function CoachSocialProof({ coachId, className }: CoachSocialProofProps) {
  const [data, setData] = useState<SocialProofData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialProof = async () => {
      try {
        setLoading(true);

        const { count: studentsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', coachId)
          .eq('status', 'confirmed');

        const { data: coachProfile } = await supabase
          .from('coach_profiles')
          .select('years_experience, certifications')
          .eq('id', coachId)
          .single();

        const { data: recentReview } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, user_name')
          .eq('coach_id', coachId)
          .gte('rating', 4)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setData({
          totalStudents: studentsCount || 0,
          yearsCoaching: coachProfile?.years_experience || 0,
          certifications: coachProfile?.certifications || [],
          recentReview: recentReview ? {
            id: recentReview.id,
            rating: recentReview.rating,
            comment: recentReview.comment || '',
            author: recentReview.user_name || 'Anonymous',
            date: new Date(recentReview.created_at).toLocaleDateString()
          } : null,
        });
      } catch (error) {
        console.error('Error fetching social proof:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialProof();
  }, [coachId]);

  if (loading) {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-secondary h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const renderStars = (rating: number) => (
    [...Array(5)].map((_, i) => (
      <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
    ))
  );

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <Users className="h-6 w-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{data.totalStudents}</div>
          <div className="text-sm text-muted-foreground">Students Trained</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <Calendar className="h-6 w-6 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{data.yearsCoaching}+</div>
          <div className="text-sm text-muted-foreground">Years Coaching</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center col-span-2 md:col-span-1">
          <Award className="h-6 w-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{data.certifications.length}</div>
          <div className="text-sm text-muted-foreground">Certifications</div>
        </div>
      </div>

      {data.recentReview && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Latest Review</h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">{renderStars(data.recentReview.rating)}</div>
            <span className="text-sm text-muted-foreground">by {data.recentReview.author} • {data.recentReview.date}</span>
          </div>
          <p className="text-muted-foreground italic">"{data.recentReview.comment}"</p>
        </div>
      )}
    </div>
  );
}
