import type { CoachBusinessData } from "@/components/dashboard/BobAITab";

export interface PresetQuestion {
  key: string;
  label: string;
  getAnswer: (data: CoachBusinessData) => string;
}

function busiestDay(bookingsByDay: Record<string, number>): string {
  const entries = Object.entries(bookingsByDay);
  if (entries.length === 0) return "weekdays";
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function priceRange(avgPrice: number): string {
  const low = Math.round(avgPrice * 0.8);
  const high = Math.round(avgPrice * 1.3);
  return `$${low}–$${high}`;
}

export const BOB_PRESETS: PresetQuestion[] = [
  {
    key: "get_more_bookings",
    label: "How can I get more bookings?",
    getAnswer: () =>
      "Focus on response time — coaches who reply within 1 hour get 3x more bookings. Make sure your availability is updated weekly.",
  },
  {
    key: "what_to_charge",
    label: "What should I charge?",
    getAnswer: (d) =>
      `Based on your sport and rating, coaches similar to you charge ${priceRange(d.avgSessionPrice)}. Consider starting at $${Math.round(d.avgSessionPrice)} and increasing as reviews grow.`,
  },
  {
    key: "improve_rating",
    label: "How do I improve my rating?",
    getAnswer: (d) =>
      `Your current completion rate is ${d.completionRate}%. The #1 driver of ratings is communication — message clients 24h before sessions and follow up after.`,
  },
  {
    key: "grow_followers",
    label: "How do I grow my followers?",
    getAnswer: (d) =>
      `You currently have ${d.followerCount} followers. Post at least 3 times per week. Video content gets 5x more engagement than photos. Your best posting time is weekday mornings.`,
  },
  {
    key: "peak_booking_days",
    label: "What are my peak booking days?",
    getAnswer: (d) =>
      `Based on your booking history, ${busiestDay(d.bookingsByDay)} is your busiest day. Consider adding extra slots on that day.`,
  },
  {
    key: "get_verified",
    label: "How do I get verified?",
    getAnswer: () =>
      "Complete your profile (photo, bio, certifications), reach 10 bookings, and maintain a 4.5+ rating. Then request verification from your dashboard.",
  },
  {
    key: "increase_revenue",
    label: "How do I increase revenue?",
    getAnswer: (d) => {
      const monthly = Math.round(d.totalRevenue / Math.max(1, Math.ceil(d.totalSessions / d.avgPerDay / 30)));
      const groupEstimate = Math.round(d.avgSessionPrice * 4.3);
      return `Your current monthly revenue is ~$${monthly}. Adding one group session per week could add ~$${groupEstimate} monthly.`;
    },
  },
  {
    key: "online_sessions",
    label: "Should I offer online sessions?",
    getAnswer: () =>
      "Online sessions open you to a global market. Coaches offering online earn 40% more on average. Start with 2 online slots per week.",
  },
];

/** Check if a question matches a preset by key */
export function findPreset(questionKey: string): PresetQuestion | undefined {
  return BOB_PRESETS.find((p) => p.key === questionKey);
}

/** Try to match a free-text question to a preset */
export function matchPresetByText(text: string): PresetQuestion | undefined {
  const lower = text.toLowerCase().trim();
  return BOB_PRESETS.find((p) => p.label.toLowerCase() === lower);
}
