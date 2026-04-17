import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PracticeTip {
  title: string;
  description: string;
  duration: string;
  intensity: "low" | "medium" | "high";
}

export interface SuggestedCoach {
  id: string;
  coach_name: string;
  image_url: string | null;
  sport: string;
  rating: number | null;
  price: number | null;
  is_verified: boolean;
}

export interface SuggestedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  views: number | null;
  likes_count: number;
  category: string;
  coach_id: string;
}

export interface SessionRecommendations {
  sport: string;
  coachName: string;
  practiceTips: PracticeTip[];
  suggestedCoaches: SuggestedCoach[];
  suggestedVideos: SuggestedVideo[];
}

const SPORT_TIPS: Record<string, PracticeTip[]> = {
  Padel: [
    { title: "Wall Shot Consistency", description: "Practice hitting off the back wall — 20 minutes of solo rebounding to build muscle memory and soft hands.", duration: "20 min", intensity: "medium" },
    { title: "Lob Placement Drill", description: "With a partner, alternate deep lobs targeting the corners. Focus on arc height and landing within 1 meter of the back glass.", duration: "15 min", intensity: "low" },
    { title: "Smash Defense", description: "Work on Vibora and Bandeja smashes from the net position. Repeat 50 reps on each side focusing on wrist snap.", duration: "25 min", intensity: "high" },
    { title: "Net Rush Footwork", description: "Practice split-step timing every time your partner hits. Move forward aggressively after every short ball.", duration: "15 min", intensity: "medium" },
  ],
  Tennis: [
    { title: "Cross-Court Forehand Rally", description: "Find a hitting partner and rally cross-court forehands for 20 minutes. Focus on topspin and consistent depth past the service line.", duration: "20 min", intensity: "medium" },
    { title: "Serve + One Drill", description: "Practice serve + first ball combination — hit 30 first serves and attack the response with a forehand or backhand to a target.", duration: "20 min", intensity: "high" },
    { title: "Backhand Slice Control", description: "Feed 40 balls and hit backhand slices, alternating deep and short drop-shot angles. Control depth and spin.", duration: "15 min", intensity: "low" },
    { title: "Approach Shot & Volley", description: "Hit approach shots off a short ball and follow to the net. Focus on low volleys and angled put-aways.", duration: "25 min", intensity: "medium" },
  ],
  Fitness: [
    { title: "HIIT Interval Circuit", description: "4 rounds: 40 sec work / 20 sec rest — Burpees, Jump Squats, Push-ups, Mountain Climbers. Keep heart rate elevated throughout.", duration: "20 min", intensity: "high" },
    { title: "Compound Lift Focus", description: "Perform 5x5 on your primary compound lift (Squat, Deadlift or Bench). Rest 3 minutes between sets and prioritize form over weight.", duration: "30 min", intensity: "high" },
    { title: "Core Stability Flow", description: "Plank progressions: Dead bug, Copenhagen plank, RKC plank. 3 sets of 30-45 seconds each with 60 sec rest.", duration: "15 min", intensity: "medium" },
    { title: "Mobility & Recovery", description: "Hip flexor stretches, thoracic rotations, and pigeon pose holds. Spend 10 seconds breathing into each stretch position.", duration: "20 min", intensity: "low" },
  ],
  Boxing: [
    { title: "Jab-Cross Combination Drill", description: "Shadow box 3x3-minute rounds focusing only on the 1-2. Keep your guard tight and reset after every combo.", duration: "15 min", intensity: "medium" },
    { title: "Defensive Slip Drill", description: "Partner holds a pad or string at head height. Practice slipping inside and outside 30 times each side. Stay light on your feet.", duration: "10 min", intensity: "low" },
    { title: "Heavy Bag Power Rounds", description: "3x2-minute rounds on the heavy bag. Focus on transferring power from your legs through your hips — not just your arms.", duration: "15 min", intensity: "high" },
    { title: "Footwork Ladder", description: "Use an agility ladder or tape marks. Practice forward/backward shuffle, in-out patterns, and pivot footwork used in the ring.", duration: "15 min", intensity: "medium" },
  ],
  Soccer: [
    { title: "Passing Accuracy Drill", description: "Set up 4 cones 10 meters apart. Pass wall-ball style or with a partner hitting each cone target 20 times per foot.", duration: "20 min", intensity: "low" },
    { title: "Dribbling Through Gates", description: "Set up 6 mini-gates. Dribble through each gate as fast as possible, alternating inside and outside of foot touches.", duration: "15 min", intensity: "medium" },
    { title: "Shooting From Distance", description: "Strike 20 shots from outside the box — focus on body shape over the ball and a clean contact point on the laces.", duration: "20 min", intensity: "medium" },
    { title: "First Touch Control", description: "Throw or volley the ball to yourself from different heights and angles. Trap with chest, thigh, and instep and immediately set for a pass or shot.", duration: "15 min", intensity: "low" },
  ],
  Basketball: [
    { title: "Form Shooting Progression", description: "Start 1 meter from the basket and shoot 10 makes, then step back. Work up to the 3-point line. Focus on same-form release every shot.", duration: "20 min", intensity: "low" },
    { title: "Ball Handling Combo", description: "Stationary: 2 minutes each of crossover, behind-the-back, and between-the-legs dribbles at max speed. Then walk-pace moving drills.", duration: "15 min", intensity: "medium" },
    { title: "Defensive Slide Circuit", description: "Defensive stance slides: 4 sets of baseline-to-baseline with a chair change-of-direction in the middle. Keep low — no standing up.", duration: "15 min", intensity: "high" },
    { title: "Mid-Range Pull-Up", description: "Off a live dribble, practice pull-up jumpers from the elbow and wing spots. 5 makes from each of 4 spots.", duration: "20 min", intensity: "medium" },
  ],
  Yoga: [
    { title: "Sun Salutation Flow", description: "Perform 10 rounds of Surya Namaskar at your breath's pace. Focus on smooth transitions and full extension in Upward Dog.", duration: "20 min", intensity: "low" },
    { title: "Hip Opening Sequence", description: "Pigeon pose, Lizard lunge, and Butterfly — hold each for 90 seconds per side. Breathe into tension rather than forcing depth.", duration: "25 min", intensity: "low" },
    { title: "Balance & Strength", description: "Warrior III, Half Moon, and Crow pose. Hold each 30–45 seconds and focus on a steady drishti (focal point) to build stability.", duration: "20 min", intensity: "medium" },
    { title: "Breathwork & Meditation", description: "10 minutes of box breathing (4-4-4-4 count), followed by 10 minutes of seated body scan meditation.", duration: "20 min", intensity: "low" },
  ],
  Swimming: [
    { title: "Drill Set: Catch-Up Stroke", description: "4x50m with catch-up freestyle drill — one arm extends forward until the other arm 'catches up'. Focus on long reach and body rotation.", duration: "20 min", intensity: "medium" },
    { title: "Kick Board Intervals", description: "8x25m with kickboard: 4 at easy pace, 4 at sprint. Keep ankles loose and kick from the hip — not the knee.", duration: "15 min", intensity: "medium" },
    { title: "Pull Buoy Strength", description: "4x100m with pull buoy (no kick). Focus on high elbow catch, early vertical forearm, and powerful pull-through.", duration: "20 min", intensity: "high" },
    { title: "Turns & Push-Offs", description: "10 flip-turn repetitions each lap end. Focus on tight tuck, quick rotation, and powerful push-off with streamlined entry.", duration: "10 min", intensity: "low" },
  ],
  Running: [
    { title: "Tempo Run", description: "Warm up 10 min easy, then run 20 min at comfortably hard effort (6–7/10 exertion). Cool down 5 min. Builds lactate threshold.", duration: "35 min", intensity: "high" },
    { title: "Strides Practice", description: "After an easy run, do 6x100m strides at 90% effort with 90 sec recovery walk. Focus on quick turnover and relaxed form.", duration: "15 min", intensity: "medium" },
    { title: "Hill Repeats", description: "Find a 6–8% grade hill. Run 8 hard uphill reps of 30 seconds, walk/jog back down. Builds power and improves running economy.", duration: "25 min", intensity: "high" },
    { title: "Easy Recovery Run", description: "30 minutes at conversational pace — you should be able to speak full sentences. Promotes blood flow and speeds up muscle recovery.", duration: "30 min", intensity: "low" },
  ],
  MMA: [
    { title: "Sprawl & Brawl Drill", description: "Partner shoots for 10 double-leg and 10 single-leg takedowns. Focus on hip drop, sprawl timing, and framing on the head.", duration: "15 min", intensity: "high" },
    { title: "Clinch Work", description: "3x3-minute rounds in the clinch — alternate inside and outside control, practice dirty boxing, and look for takedown entries.", duration: "20 min", intensity: "high" },
    { title: "Guard Passing Flow", description: "One partner in guard, one passing. Flow drill for 5 minutes then switch. Focus on posture and not getting swept.", duration: "15 min", intensity: "medium" },
    { title: "Kick Shield Combinations", description: "4x2-minute rounds on kick shields: jab-cross-low kick, jab-cross-hook-knee, and teep-cross-round kick sequences.", duration: "15 min", intensity: "high" },
  ],
  CrossFit: [
    { title: "AMRAP Chipper", description: "15-minute AMRAP: 10 Thrusters, 10 Pull-ups, 10 Box Jumps. Scale weights to complete rounds in under 2 minutes each.", duration: "20 min", intensity: "high" },
    { title: "Olympic Lift Skill Work", description: "Practice Clean & Jerk or Snatch with light weight — 10 sets of 2 reps focusing on bar path, timing, and receiving position.", duration: "25 min", intensity: "medium" },
    { title: "Gymnastics Skill", description: "Spend 20 minutes on a gymnastics skill: handstand hold, kipping pull-up mechanics, or bar muscle-up progression.", duration: "20 min", intensity: "medium" },
    { title: "Zone 2 Recovery", description: "30 minutes of rowing, biking, or skiing at a pace where you can hold a conversation. Builds aerobic base without taxing the CNS.", duration: "30 min", intensity: "low" },
  ],
  "Martial Arts": [
    { title: "Kata Repetition", description: "Practice your current kata 10 times slow (focus on technique) and 5 times at full speed. Video yourself to check stances and transitions.", duration: "20 min", intensity: "medium" },
    { title: "Partner Sparring Drill", description: "Light contact 3x2-minute rounds with a partner. Focus on reading your opponent's weight shift and reacting with counter-techniques.", duration: "20 min", intensity: "medium" },
    { title: "Kicking Power & Speed", description: "50 reps each leg: front kick, side kick, round kick on a bag or pad. Alternate power rounds (slow, heavy) and speed rounds.", duration: "15 min", intensity: "high" },
    { title: "Breathing & Kiai Practice", description: "Shadow movements focusing purely on breath synchronization — exhale on every strike and block. 15 minutes continuous.", duration: "15 min", intensity: "low" },
  ],
};

const DEFAULT_TIPS: PracticeTip[] = [
  { title: "Active Recovery Session", description: "Light movement for 20–30 minutes to flush lactic acid and reduce muscle soreness from your last session.", duration: "20 min", intensity: "low" },
  { title: "Mobility & Flexibility", description: "Dynamic stretching of the major muscle groups used in your session. Hold each stretch 30–60 seconds with full breathing.", duration: "15 min", intensity: "low" },
  { title: "Technique Review", description: "Watch back any video footage from your session, or look up instructional content for the specific skills you worked on.", duration: "15 min", intensity: "low" },
  { title: "Mental Rehearsal", description: "Spend 10 minutes visualizing your ideal technique execution from your last session. Reinforces motor patterns without physical exertion.", duration: "10 min", intensity: "low" },
];

function getTipsForSport(sport: string): PracticeTip[] {
  const key = Object.keys(SPORT_TIPS).find(
    (k) => k.toLowerCase() === sport?.toLowerCase()
  );
  return key ? SPORT_TIPS[key] : DEFAULT_TIPS;
}

export function useSessionRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<SessionRecommendations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Get most recent completed or upcoming booking
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, coach_id, coach_name, date, status")
        .eq("user_id", user.id)
        .in("status", ["completed", "confirmed", "upcoming"])
        .gte("date", threeDaysAgo)
        .lte("date", today)
        .order("date", { ascending: false })
        .limit(1);

      if (!bookings || bookings.length === 0) {
        setLoading(false);
        return;
      }

      const lastBooking = bookings[0];

      // 2. Fetch coach sport
      const { data: coachProfile } = await supabase
        .from("coach_profiles")
        .select("sport")
        .eq("id", lastBooking.coach_id)
        .maybeSingle();

      const sport = coachProfile?.sport || "Fitness";

      // 3. Practice tips (personalized by sport)
      const practiceTips = getTipsForSport(sport);

      // 4. Suggested coaches — same sport, not the coach they just saw
      const { data: coaches } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, image_url, sport, rating, price, is_verified")
        .eq("sport", sport)
        .eq("is_verified", true)
        .neq("id", lastBooking.coach_id)
        .order("rating", { ascending: false })
        .limit(4);

      // 5. Relevant videos — matching sport as category
      const { data: videos } = await supabase
        .from("coach_videos")
        .select("id, title, thumbnail_url, views, likes_count, category, coach_id")
        .eq("category", sport)
        .eq("is_fake", false)
        .order("views", { ascending: false })
        .limit(6);

      // Fallback: if not enough category matches, grab top videos
      let videoList = videos || [];
      if (videoList.length < 3) {
        const { data: fallbackVideos } = await supabase
          .from("coach_videos")
          .select("id, title, thumbnail_url, views, likes_count, category, coach_id")
          .eq("is_fake", false)
          .order("likes_count", { ascending: false })
          .limit(6);
        videoList = fallbackVideos || [];
      }

      setRecommendations({
        sport,
        coachName: lastBooking.coach_name,
        practiceTips,
        suggestedCoaches: (coaches || []) as SuggestedCoach[],
        suggestedVideos: videoList as SuggestedVideo[],
      });
    } catch (err) {
      console.error("Failed to load session recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading };
}
